import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from '../ledger/ledger.service';
import { SettingsService } from '../settings/settings.service';
import {
  DisputeStatus,
  DisputeOutcome,
  OrderStatus,
  LedgerStage,
  Role,
} from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly ledgerService: LedgerService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Mengajukan sengketa baru untuk sebuah order
   * Endpoint: POST /orders/:id/disputes
   * Sesuai docs/04 bagian 8 & docs/06 M8:
   * - Pengaju harus KITCHEN_MANAGER atau SUPPLIER terkait (atau ADMIN)
   * - Harus dalam jendela order.disputeWindowHours setelah hasil QC
   * - Menolak dengan 422 bila jendela telah lewat
   * - Status Order berubah menjadi DISPUTED
   */
  async createDispute(
    orderId: string,
    dto: CreateDisputeDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        kitchen: true,
        supplier: true,
        batch: {
          include: {
            qualityChecks: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
        disputes: {
          where: {
            status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan',
      });
    }

    // 1. Validasi Kepemilikan (Scoping)
    if (user.role === Role.KITCHEN_MANAGER && order.kitchen.managerId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki hak untuk menyengketakan pesanan dapur lain',
      });
    }

    if (user.role === Role.SUPPLIER && order.supplier.userId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki hak untuk menyengketakan pesanan pemasok lain',
      });
    }

    if (user.role !== Role.KITCHEN_MANAGER && user.role !== Role.SUPPLIER && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Hanya Pengelola Dapur, Pemasok, atau Admin yang dapat mengajukan sengketa',
      });
    }

    // 2. Validasi Keberadaan Sengketa Aktif
    if (order.disputes.length > 0) {
      throw new BadRequestException({
        code: 'DISPUTE_ALREADY_ACTIVE',
        message: 'Pesanan ini sudah memiliki sengketa aktif yang sedang diproses',
      });
    }

    // 3. Validasi Keberadaan QC
    const latestQc = order.batch?.qualityChecks[0];
    if (!latestQc) {
      throw new BadRequestException({
        code: 'QC_NOT_PERFORMED',
        message: 'Sengketa hanya dapat diajukan setelah pemeriksaan mutu (QC) dilakukan',
      });
    }

    // 4. Validasi Jendela Waktu (docs/06 M8: Jendela lewat -> 422)
    const disputeWindowHours = await this.settingsService.getSetting<number>(
      'order.disputeWindowHours',
      48,
    );
    const windowExpiry = new Date(
      latestQc.checkedAt.getTime() + disputeWindowHours * 60 * 60 * 1000,
    );
    const now = new Date();

    if (now > windowExpiry) {
      throw new UnprocessableEntityException({
        code: 'DISPUTE_WINDOW_EXPIRED',
        message: `Batas waktu pengajuan sengketa (${disputeWindowHours} jam setelah QC) telah berakhir pada ${windowExpiry.toLocaleString('id-ID')}`,
      });
    }

    // 5. Eksekusi Transaksi Pengajuan Sengketa
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          orderId: order.id,
          raisedById: user.sub,
          reason: dto.reason,
          evidenceUrls: dto.evidenceUrls || [],
          status: DisputeStatus.OPEN,
        },
      });

      // Update Order status menjadi DISPUTED
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.DISPUTED },
      });

      await this.auditService.log({
        action: 'DISPUTE_CREATED',
        entity: 'Dispute',
        entityId: dispute.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderId: order.id,
          orderNo: order.orderNo,
          reason: dto.reason,
        },
      });

      return dispute;
    });
  }

  /**
   * Mengambil daftar sengketa dengan scoping peran
   * Endpoint: GET /disputes
   */
  async findAll(
    user: JwtPayload,
    query: { status?: DisputeStatus; orderId?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === Role.KITCHEN_MANAGER) {
      where.order = { kitchen: { managerId: user.sub } };
    } else if (user.role === Role.SUPPLIER) {
      where.order = { supplier: { userId: user.sub } };
    } else if (user.role !== Role.ADMIN && user.role !== Role.AUDITOR) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Peran Anda tidak diizinkan mengakses daftar sengketa',
      });
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }

    const [total, disputes] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        include: {
          order: {
            include: {
              commodity: true,
              kitchen: true,
              supplier: true,
            },
          },
          raisedBy: {
            select: { id: true, name: true, role: true, email: true },
          },
          resolvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = disputes.map((d) => ({
      ...d,
      adjustedAcceptedQuantity: d.adjustedAcceptedQuantity
        ? Number(d.adjustedAcceptedQuantity)
        : null,
      order: {
        ...d.order,
        quantity: Number(d.order.quantity),
        pricePerUnit: Number(d.order.pricePerUnit),
      },
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu sengketa
   * Endpoint: GET /disputes/:id
   */
  async findById(id: string, user: JwtPayload) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            commodity: true,
            kitchen: true,
            supplier: true,
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
          },
        },
        raisedBy: {
          select: { id: true, name: true, role: true, email: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Data sengketa tidak ditemukan',
      });
    }

    // Scoping check
    if (user.role === Role.KITCHEN_MANAGER && dispute.order.kitchen.managerId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki akses ke sengketa dapur lain',
      });
    }
    if (user.role === Role.SUPPLIER && dispute.order.supplier.userId !== user.sub) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Anda tidak memiliki akses ke sengketa pemasok lain',
      });
    }

    return {
      ...dispute,
      adjustedAcceptedQuantity: dispute.adjustedAcceptedQuantity
        ? Number(dispute.adjustedAcceptedQuantity)
        : null,
      order: {
        ...dispute.order,
        quantity: Number(dispute.order.quantity),
        pricePerUnit: Number(dispute.order.pricePerUnit),
        ledger: dispute.order.ledger.map((l) => ({
          ...l,
          amount: Number(l.amount),
        })),
      },
    };
  }

  /**
   * Mengubah status sengketa menjadi UNDER_REVIEW oleh Admin
   * Endpoint: PATCH /disputes/:id/review
   */
  async reviewDispute(id: string, user: JwtPayload, ipAddress?: string) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Hanya Admin yang dapat meninjau sengketa',
      });
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Data sengketa tidak ditemukan',
      });
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException({
        code: 'INVALID_DISPUTE_STATUS',
        message: `Sengketa dengan status ${dispute.status} tidak dapat dipindahkan ke peninjauan`,
      });
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: { status: DisputeStatus.UNDER_REVIEW },
    });

    await this.auditService.log({
      action: 'DISPUTE_UNDER_REVIEW',
      entity: 'Dispute',
      entityId: id,
      userId: user.sub,
      ipAddress,
    });

    return updated;
  }

  /**
   * Memutuskan penyelesaian sengketa oleh Admin
   * Endpoint: PATCH /disputes/:id/resolve
   * Sesuai docs/04 bagian 8, docs/06 M8, & invariant docs/04 bagian 7:
   * - FAVOR_SUPPLIER: terima kuantitas penuh yang diterima di dapur
   * - FAVOR_KITCHEN: pertahankan hasil QC awal (tidak ada perubahan kuantitas)
   * - SPLIT: admin menentukan adjustedAcceptedQuantity
   * - Menulis mutasi ADJUSTMENT di ledger dan mengembalikan order ke status PAID
   */
  async resolveDispute(
    id: string,
    dto: ResolveDisputeDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Hanya Admin yang dapat memutus sengketa',
      });
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            batch: {
              include: {
                qualityChecks: {
                  orderBy: { checkedAt: 'desc' },
                  take: 1,
                },
              },
            },
            ledger: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: 'DISPUTE_NOT_FOUND',
        message: 'Data sengketa tidak ditemukan',
      });
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException({
        code: 'DISPUTE_ALREADY_RESOLVED',
        message: 'Sengketa ini sudah diputus sebelumnya dan tidak dapat diubah lagi',
      });
    }

    const order = dispute.order;
    const latestQc = order.batch?.qualityChecks[0];
    const pricePerUnit = Number(order.pricePerUnit);
    const receivedQty = Number(order.batch?.receivedQuantity || order.quantity);
    const initialAcceptedQty = latestQc ? Number(latestQc.acceptedQuantity) : 0;

    let targetAcceptedQty = initialAcceptedQty;

    if (dto.outcome === DisputeOutcome.FAVOR_SUPPLIER) {
      // Putusan memenangkan pemasok: terima kuantitas penuh yang tiba di dapur
      targetAcceptedQty = receivedQty;
    } else if (dto.outcome === DisputeOutcome.FAVOR_KITCHEN) {
      // Putusan memenangkan dapur: pertahankan hasil QC
      targetAcceptedQty = initialAcceptedQty;
    } else if (dto.outcome === DisputeOutcome.SPLIT) {
      if (dto.adjustedAcceptedQuantity === undefined) {
        throw new BadRequestException({
          code: 'ADJUSTED_QUANTITY_REQUIRED',
          message: 'Kuantitas penyesuaian (adjustedAcceptedQuantity) wajib diisi untuk putusan SPLIT',
        });
      }
      if (dto.adjustedAcceptedQuantity > receivedQty) {
        throw new BadRequestException({
          code: 'EXCEEDS_RECEIVED_QUANTITY',
          message: `Kuantitas penyesuaian (${dto.adjustedAcceptedQuantity} kg) tidak boleh melebihi kuantitas tiba (${receivedQty} kg)`,
        });
      }
      targetAcceptedQty = dto.adjustedAcceptedQuantity;
    }

    // Hitung saldo efektif target
    const targetReleaseAmount = Math.round(targetAcceptedQty * pricePerUnit);

    // Hitung posisi ledger saat ini
    let currentReleased = 0;
    let currentAdjustment = 0;

    for (const entry of order.ledger) {
      const amt = Number(entry.amount);
      if (entry.stage === LedgerStage.RELEASE) currentReleased += amt;
      else if (entry.stage === LedgerStage.ADJUSTMENT) currentAdjustment += amt;
    }

    const currentEffectiveReleased = currentReleased + currentAdjustment;
    const adjustmentNeeded = targetReleaseAmount - currentEffectiveReleased;

    return this.prisma.$transaction(async (tx) => {
      // 1. Jika ada penyesuaian nilai, catat mutasi ADJUSTMENT di ledger
      if (adjustmentNeeded !== 0) {
        await this.ledgerService.record(
          {
            orderId: order.id,
            stage: LedgerStage.ADJUSTMENT,
            amount: adjustmentNeeded,
            note: `Penyesuaian putusan sengketa (${dto.outcome}) kuantitas diakui: ${targetAcceptedQty} kg`,
            userId: user.sub,
            ipAddress,
          },
          tx,
        );
      }

      // 2. Update record Dispute
      const resolvedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          outcome: dto.outcome,
          adjustedAcceptedQuantity: targetAcceptedQty,
          resolutionNote: dto.resolutionNote || null,
          resolvedById: user.sub,
          resolvedAt: new Date(),
        },
      });

      // 3. Kembalikan status Order menjadi PAID (docs/04 bagian 8)
      // Catatan: Jika kuantitas target 0 dan tidak ada release, status tetap PAID/QC_FAILED sesuai kondisi
      const nextOrderStatus = targetReleaseAmount > 0 ? OrderStatus.PAID : OrderStatus.QC_FAILED;

      await tx.order.update({
        where: { id: order.id },
        data: { status: nextOrderStatus },
      });

      await this.auditService.log({
        action: 'DISPUTE_RESOLVED',
        entity: 'Dispute',
        entityId: id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderId: order.id,
          orderNo: order.orderNo,
          outcome: dto.outcome,
          adjustedAcceptedQuantity: targetAcceptedQty,
          adjustmentAmount: adjustmentNeeded,
          resolutionNote: dto.resolutionNote,
        },
      });

      return resolvedDispute;
    });
  }
}
