import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from '../ledger/ledger.service';
import { MatchingService } from '../matching/matching.service';
import { OrderStatus, LedgerStage, Role, DemandStatus } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { scopeWhere } from '../../common/utils/scope-where.util';
import { RejectOrderDto, CancelOrderDto } from './dto/order-action.dto';
import { CreateSupplierReviewDto } from './dto/supplier-review.dto';

// Siklus status order yang valid sesuai docs/03 bagian 2
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PROPOSED]: [
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.EXPIRED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.CONSOLIDATED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONSOLIDATED]: [
    OrderStatus.IN_TRANSIT,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_TRANSIT]: [
    OrderStatus.RECEIVED,
  ],
  [OrderStatus.RECEIVED]: [
    OrderStatus.QC_PASSED,
    OrderStatus.QC_PARTIAL,
    OrderStatus.QC_FAILED,
  ],
  [OrderStatus.QC_PASSED]: [
    OrderStatus.PAID,
    OrderStatus.DISPUTED,
  ],
  [OrderStatus.QC_PARTIAL]: [
    OrderStatus.PAID,
    OrderStatus.DISPUTED,
  ],
  [OrderStatus.QC_FAILED]: [
    OrderStatus.DISPUTED,
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.DISPUTED,
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.DISPUTED]: [
    OrderStatus.PAID,
    OrderStatus.QC_FAILED,
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.EXPIRED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.COMPLETED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly ledgerService: LedgerService,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Mengambil daftar pesanan dengan filter dan scoping peran
   */
  async findAll(
    user: JwtPayload,
    query: {
      status?: OrderStatus;
      demandId?: string;
      kitchenId?: string;
      supplierId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    let profileIds: any = {};
    if (user.role === Role.SUPPLIER) {
      const sup = await this.prisma.supplierProfile.findUnique({
        where: { userId: user.sub },
      });
      profileIds.supplierProfileId = sup?.id;
    } else if (user.role === Role.COORDINATOR) {
      const coord = await this.prisma.coordinatorProfile.findUnique({
        where: { userId: user.sub },
      });
      profileIds.coordinatorProfileId = coord?.id;
    }

    const baseWhere = scopeWhere(user, 'order', profileIds);
    const where: any = {
      ...baseWhere,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.demandId) {
      where.demandId = query.demandId;
    }
    if (query.kitchenId && user.role === Role.ADMIN) {
      where.kitchenId = query.kitchenId;
    }
    if (query.supplierId && user.role === Role.ADMIN) {
      where.supplierId = query.supplierId;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          commodity: true,
          kitchen: true,
          supplier: true,
          demand: true,
          shipment: true,
          batch: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedOrders = orders.map((o) => ({
      ...o,
      quantity: Number(o.quantity),
      pricePerUnit: Number(o.pricePerUnit),
      matchScore: Number(o.matchScore),
      totalPrice: Math.round(Number(o.quantity) * Number(o.pricePerUnit)),
    }));

    return {
      data: formattedOrders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu pesanan beserta mutasi ledger dan jejak audit
   */
  async findById(id: string, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        commodity: true,
        kitchen: true,
        supplier: {
          include: { user: true },
        },
        demand: true,
        shipment: {
          include: { coordinator: true },
        },
        batch: {
          include: {
            qualityChecks: {
              include: { inspector: true },
            },
          },
        },
        ledger: {
          orderBy: { createdAt: 'asc' },
        },
        disputes: {
          orderBy: { createdAt: 'desc' },
        },
        review: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan',
      });
    }

    // Pengecekan Scoping Hak Akses
    if (user.role === Role.KITCHEN_MANAGER && order.kitchen.managerId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki akses ke pesanan dapur lain',
      });
    }
    if (user.role === Role.SUPPLIER && order.supplier.userId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki akses ke pesanan pemasok lain',
      });
    }

    // Ambil riwayat audit log terkait order ini
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entity: 'Order',
        entityId: order.id,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...order,
      quantity: Number(order.quantity),
      pricePerUnit: Number(order.pricePerUnit),
      matchScore: Number(order.matchScore),
      totalPrice: Math.round(Number(order.quantity) * Number(order.pricePerUnit)),
      ledger: order.ledger.map((l) => ({
        ...l,
        amount: Number(l.amount),
      })),
      auditLogs,
    };
  }

  /**
   * Pemasok MENERIMA tawaran pesanan (POST /orders/:id/accept)
   * Mengubah status PROPOSED -> ACCEPTED dan mencatat pencadangan dana (HOLD) secara atomik
   * docs/06 M4 & docs/04 Bagian 7
   */
  async accept(id: string, user: JwtPayload, ipAddress?: string) {
    if (user.role !== Role.SUPPLIER && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'ROLE_NOT_ALLOWED',
        message: 'Hanya pemasok yang dapat menerima pesanan ini',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { supplier: true },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      if (user.role === Role.SUPPLIER && order.supplier.userId !== user.sub) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_RESOURCE',
          message: 'Anda tidak berhak menerima pesanan pemasok lain',
        });
      }

      if (order.status !== OrderStatus.PROPOSED) {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Hanya pesanan berstatus PROPOSED yang dapat diterima (saat ini ${order.status})`,
        });
      }

      const now = new Date();
      if (order.offerExpiresAt < now) {
        throw new BadRequestException({
          code: 'OFFER_EXPIRED',
          message: 'Batas waktu respon penawaran telah kedaluwarsa',
        });
      }

      // Validasi transisi status
      this.validateTransition(order.status, OrderStatus.ACCEPTED);

      // 1. Update status order menjadi ACCEPTED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.ACCEPTED,
          respondedAt: now,
        },
      });

      // 2. Hitung jumlah pencadangan dana (HOLD) = ROUND(quantity * pricePerUnit)
      const holdAmount = Math.round(Number(order.quantity) * Number(order.pricePerUnit));

      // 3. Catat entri HOLD pada ledger dalam transaksi yang sama
      await this.ledgerService.record(
        {
          orderId: order.id,
          stage: LedgerStage.HOLD,
          amount: holdAmount,
          note: `Pencadangan dana pesanan ${order.orderNo}`,
          userId: user.sub,
          ipAddress,
        },
        tx,
      );

      // 4. Catat AuditLog
      await this.auditService.log({
        action: 'ORDER_ACCEPTED',
        entity: 'Order',
        entityId: order.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderNo: order.orderNo,
          previousStatus: order.status,
          newStatus: OrderStatus.ACCEPTED,
          holdAmount,
        },
      });

      return {
        message: 'Pesanan berhasil disanggupi dan dana pembayaran telah dicadangkan',
        order: {
          ...updatedOrder,
          quantity: Number(updatedOrder.quantity),
          pricePerUnit: Number(updatedOrder.pricePerUnit),
          holdAmount,
        },
      };
    });
  }

  /**
   * Pemasok MENOLAK tawaran pesanan (POST /orders/:id/reject)
   * Mengubah status PROPOSED -> REJECTED, melepas kuantitas tereservasi,
   * dan otomatis memicu alokasi ulang untuk sisa kuantitas permintaan
   * docs/06 M4 & docs/04 Bagian 4.1 point 7
   */
  async reject(id: string, dto: RejectOrderDto, user: JwtPayload, ipAddress?: string) {
    if (user.role !== Role.SUPPLIER && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'ROLE_NOT_ALLOWED',
        message: 'Hanya pemasok yang dapat menolak pesanan ini',
      });
    }

    const demandIdToReallocate = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { supplier: true, offer: true },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      if (user.role === Role.SUPPLIER && order.supplier.userId !== user.sub) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_RESOURCE',
          message: 'Anda tidak berhak menolak pesanan pemasok lain',
        });
      }

      if (order.status !== OrderStatus.PROPOSED) {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Hanya pesanan berstatus PROPOSED yang dapat ditolak (saat ini ${order.status})`,
        });
      }

      const now = new Date();
      this.validateTransition(order.status, OrderStatus.REJECTED);

      // 1. Ubah status order menjadi REJECTED
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REJECTED,
          respondedAt: now,
          rejectionReason: dto.reason,
        },
      });

      // 2. Lepas kuantitas tereservasi pada penawaran stok pemasok
      await tx.supplyOffer.update({
        where: { id: order.offerId },
        data: {
          quantityReserved: { decrement: order.quantity },
        },
      });

      // 3. Catat AuditLog
      await this.auditService.log({
        action: 'ORDER_REJECTED',
        entity: 'Order',
        entityId: order.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderNo: order.orderNo,
          previousStatus: order.status,
          newStatus: OrderStatus.REJECTED,
          reason: dto.reason,
          releasedQuantity: Number(order.quantity),
        },
      });

      return order.demandId;
    });

    // 4. Picu alokasi ulang secara otomatis untuk permintaan bahan tersebut
    let reallocationResult: any = null;
    try {
      reallocationResult = await this.matchingService.matchAndAllocate(
        demandIdToReallocate,
        user.sub,
        user.role,
        undefined,
        ipAddress,
      );
    } catch (err: any) {
      // Jika alokasi ulang tidak menemukan kandidat baru, bukan error fatal
      reallocationResult = { message: err.message };
    }

    return {
      message: 'Pesanan telah ditolak dan kuantitas dialokasikan ulang',
      reallocation: reallocationResult,
    };
  }

  /**
   * ADMIN atau Pengelola Dapur membatalkan pesanan (POST /orders/:id/cancel)
   * Melepas reservasi, membatalkan HOLD jika ada, mengubah status ke CANCELLED
   */
  async cancel(id: string, dto: CancelOrderDto, user: JwtPayload, ipAddress?: string) {
    if (user.role !== Role.ADMIN && user.role !== Role.KITCHEN_MANAGER) {
      throw new ForbiddenException({
        code: 'ROLE_NOT_ALLOWED',
        message: 'Hanya Admin atau Pengelola Dapur yang dapat membatalkan pesanan',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { kitchen: true, ledger: true },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      if (user.role === Role.KITCHEN_MANAGER && order.kitchen.managerId !== user.sub) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_RESOURCE',
          message: 'Anda tidak berhak membatalkan pesanan dapur lain',
        });
      }

      if (
        order.status !== OrderStatus.PROPOSED &&
        order.status !== OrderStatus.ACCEPTED
      ) {
        throw new BadRequestException({
          code: 'CANNOT_CANCEL_ORDER',
          message: `Pesanan berstatus ${order.status} tidak dapat dibatalkan`,
        });
      }

      this.validateTransition(order.status, OrderStatus.CANCELLED);

      // Jika sudah ACCEPTED, lakukan VOID seluruh nilai HOLD
      if (order.status === OrderStatus.ACCEPTED) {
        const holdEntry = order.ledger.find((l) => l.stage === LedgerStage.HOLD);
        if (holdEntry) {
          await this.ledgerService.record(
            {
              orderId: order.id,
              stage: LedgerStage.VOID,
              amount: Number(holdEntry.amount),
              note: `Pembatalan pesanan: ${dto.reason || 'Dibatalkan oleh pengelola'}`,
              userId: user.sub,
              ipAddress,
            },
            tx,
          );
        }
      }

      // Lepas kuantitas tereservasi dari stok pemasok
      await tx.supplyOffer.update({
        where: { id: order.offerId },
        data: {
          quantityReserved: { decrement: order.quantity },
        },
      });

      // Update status order ke CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          rejectionReason: dto.reason || 'Dibatalkan',
        },
      });

      await this.auditService.log({
        action: 'ORDER_CANCELLED',
        entity: 'Order',
        entityId: order.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderNo: order.orderNo,
          previousStatus: order.status,
          newStatus: OrderStatus.CANCELLED,
          reason: dto.reason,
        },
      });

      return {
        message: 'Pesanan berhasil dibatalkan',
        order: updatedOrder,
      };
    });
  }

  /**
   * Mesin transisi status generik untuk modul logistik, penerimaan, dan QC
   */
  async transition(
    orderId: string,
    targetStatus: OrderStatus,
    userId: string,
    tx?: any,
    extraData?: any,
  ) {
    const execute = async (dbTx: any) => {
      const order = await dbTx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      this.validateTransition(order.status, targetStatus);

      const updated = await dbTx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus,
          ...extraData,
        },
      });

      await this.auditService.log({
        action: 'ORDER_STATUS_CHANGED',
        entity: 'Order',
        entityId: orderId,
        userId,
        meta: {
          orderNo: order.orderNo,
          previousStatus: order.status,
          newStatus: targetStatus,
        },
      });

      return updated;
    };

    if (tx) {
      return execute(tx);
    }
    return this.prisma.$transaction(execute);
  }

  /**
   * Memvalidasi transisi status sesuai siklus formal
   */
  private validateTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Transisi status pesanan dari ${currentStatus} ke ${nextStatus} tidak diizinkan`,
      });
    }
  }

  /**
   * Menghasilkan string CSV dari daftar pesanan sesuai rentang tanggal (docs/06 M10 P1)
   */
  async exportOrdersCsv(query: { from?: string; to?: string }): Promise<string> {
    const where: any = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        commodity: true,
        kitchen: true,
        supplier: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Nomor Order',
      'Tanggal Order',
      'Komoditas',
      'Kategori',
      'Dapur Tujuan',
      'Kode Dapur',
      'Pemasok',
      'Jenis Pemasok',
      'Kuantitas (kg)',
      'Harga Per Kg (Rp)',
      'Total Komitmen (Rp)',
      'Skor Kecocokan (%)',
      'Status Order',
      'Kode Batch',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = orders.map((o) => [
      escapeCsv(o.orderNo),
      escapeCsv(o.createdAt.toISOString().split('T')[0]),
      escapeCsv(o.commodity.name),
      escapeCsv(o.commodity.category),
      escapeCsv(o.kitchen.name),
      escapeCsv(o.kitchen.code),
      escapeCsv(o.supplier.displayName),
      escapeCsv(o.supplier.type),
      escapeCsv(Number(o.quantity)),
      escapeCsv(Number(o.pricePerUnit)),
      escapeCsv(Math.round(Number(o.quantity) * Number(o.pricePerUnit))),
      escapeCsv(Number(o.matchScore)),
      escapeCsv(o.status),
      escapeCsv(o.batch?.batchCode || '-'),
    ]);

    const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
    return '\uFEFF' + csvLines.join('\r\n'); // Prefix UTF-8 BOM untuk Excel Indonesia
  }

  /**
   * Menambahkan ulasan dan rating pemasok oleh pengelola dapur (docs/06 M10 / T7.7)
   */
  async createReview(
    orderId: string,
    dto: CreateSupplierReviewDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        kitchen: true,
        supplier: true,
        review: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan',
      });
    }

    // Hanya pengelola dapur terkait atau ADMIN
    if (user.role === Role.KITCHEN_MANAGER && order.kitchen.managerId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk mengulas pesanan dapur lain',
      });
    }

    // Order harus telah selesai atau dibayar
    if (!['COMPLETED', 'PAID'].includes(order.status)) {
      throw new BadRequestException({
        code: 'ORDER_NOT_COMPLETED',
        message: 'Ulasan hanya dapat diberikan setelah pesanan selesai diproses (PAID / COMPLETED)',
      });
    }

    if (order.review) {
      throw new BadRequestException({
        code: 'REVIEW_ALREADY_EXISTS',
        message: 'Pesanan ini sudah pernah diberikan ulasan',
      });
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.supplierReview.create({
        data: {
          orderId: order.id,
          kitchenManagerId: user.sub,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      // Update rata-rata skor mutu dan reputasi supplier jika relevan
      const allReviews = await tx.supplierReview.findMany({
        where: { order: { supplierId: order.supplierId } },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / (allReviews.length || 1);

      await this.auditService.log({
        action: 'SUPPLIER_REVIEW_CREATED',
        entity: 'Order',
        entityId: order.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderNo: order.orderNo,
          supplierId: order.supplierId,
          rating: dto.rating,
          comment: dto.comment,
          supplierAvgRating: Math.round(avgRating * 10) / 10,
        },
      });

      return createdReview;
    });

    return review;
  }
}


