import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, DemandStatus, OrderStatus } from '@prisma/client';
import { UpdateDemandRequestDto, FilterDemandRequestDto, CancelDemandDto } from './dto/demand.dto';

@Injectable()
export class DemandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper format mata uang Rupiah
   */
  private formatRupiah(val: number | string): string {
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  }

  /**
   * Validasi scoping dapur untuk pengguna
   */
  private async validateDemandAccess(demandId: string, userId: string, userRole: Role) {
    const demand = await this.prisma.demandRequest.findUnique({
      where: { id: demandId },
      include: {
        kitchen: true,
        commodity: true,
        orders: true,
      },
    });

    if (!demand) {
      throw new NotFoundException({
        code: 'DEMAND_NOT_FOUND',
        message: 'Permintaan bahan tidak ditemukan',
      });
    }

    if (userRole === Role.ADMIN) {
      return demand;
    }

    if (userRole === Role.KITCHEN_MANAGER && demand.kitchen.managerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki akses ke permintaan dapur ini',
      });
    }

    return demand;
  }

  /**
   * Mengambil daftar permintaan bahan dengan scoping per peran (docs/02 & docs/06)
   */
  async getDemandRequests(filter: FilterDemandRequestDto, userId: string, userRole: Role) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Scoping peran
    if (userRole === Role.KITCHEN_MANAGER) {
      where.kitchen = { managerId: userId };
    } else if (userRole === Role.SUPPLIER) {
      // Pemasok hanya melihat permintaan terbuka/aktif di wilayahnya
      const supplierProfile = await this.prisma.supplierProfile.findUnique({
        where: { userId },
      });
      if (supplierProfile) {
        where.kitchen = { regionId: supplierProfile.regionId };
        where.status = {
          in: [
            DemandStatus.OPEN,
            DemandStatus.MATCHING,
            DemandStatus.PARTIALLY_FULFILLED,
          ],
        };
      }
    }

    // 2. Filter spesifik
    if (filter.status) where.status = filter.status;
    if (filter.commodityId) where.commodityId = filter.commodityId;
    if (filter.kitchenId && userRole === Role.ADMIN) where.kitchenId = filter.kitchenId;

    if (filter.from || filter.to) {
      where.neededDate = {};
      if (filter.from) where.neededDate.gte = new Date(filter.from);
      if (filter.to) where.neededDate.lte = new Date(filter.to);
    }

    const [total, data] = await Promise.all([
      this.prisma.demandRequest.count({ where }),
      this.prisma.demandRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          kitchen: true,
          commodity: true,
          orders: {
            where: {
              status: {
                notIn: [OrderStatus.REJECTED, OrderStatus.EXPIRED, OrderStatus.CANCELLED],
              },
            },
          },
        },
        orderBy: { neededDate: 'asc' },
      }),
    ]);

    // Tambahkan kalkulasi fulfilledQuantity dan remainingQuantity
    const formattedData = data.map((d) => {
      const fulfilledQty = d.orders.reduce((sum, ord) => sum + Number(ord.quantity), 0);
      const remainingQty = Math.max(0, Number(d.quantity) - fulfilledQty);
      return {
        ...d,
        fulfilledQuantity: fulfilledQty,
        remainingQuantity: remainingQty,
      };
    });

    return {
      data: formattedData,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * Detail satu permintaan bahan beserta order terkait
   */
  async getDemandRequestById(id: string, userId: string, userRole: Role) {
    const demand = await this.validateDemandAccess(id, userId, userRole);

    const activeOrders = demand.orders.filter(
      (o) =>
        o.status !== OrderStatus.REJECTED &&
        o.status !== OrderStatus.EXPIRED &&
        o.status !== OrderStatus.CANCELLED,
    );

    const fulfilledQuantity = activeOrders.reduce((sum, o) => sum + Number(o.quantity), 0);
    const remainingQuantity = Math.max(0, Number(demand.quantity) - fulfilledQuantity);

    return {
      ...demand,
      fulfilledQuantity,
      remainingQuantity,
    };
  }

  /**
   * Mengubah permintaan bahan selagi masih DRAFT (atau OPEN tanpa order)
   */
  async updateDemandRequest(
    id: string,
    dto: UpdateDemandRequestDto,
    userId: string,
    userRole: Role,
    ipAddress?: string,
  ) {
    const demand = await this.validateDemandAccess(id, userId, userRole);

    if (demand.status !== DemandStatus.DRAFT && demand.status !== DemandStatus.OPEN) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Permintaan hanya dapat diubah saat berstatus DRAFT atau OPEN',
      });
    }

    if (demand.status === DemandStatus.OPEN && demand.orders.length > 0) {
      throw new BadRequestException({
        code: 'CANNOT_MODIFY_WITH_ORDERS',
        message: 'Permintaan OPEN yang sudah memiliki tawaran order tidak dapat diubah',
      });
    }

    const updated = await this.prisma.demandRequest.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        maxPricePerUnit: dto.maxPricePerUnit,
        minQualityScore: dto.minQualityScore,
        note: dto.note,
      },
      include: {
        commodity: true,
        kitchen: true,
      },
    });

    await this.auditService.log({
      action: 'DEMAND_UPDATED',
      entity: 'DemandRequest',
      entityId: id,
      userId,
      ipAddress,
      meta: { dto },
    });

    return updated;
  }

  /**
   * Menerbitkan permintaan (DRAFT -> OPEN)
   * Validasi:
   * 1. neededDate >= H+1 (hari esok atau lebih)
   * 2. maxPricePerUnit >= floorPrice (harga dasar produsen)
   */
  async publishDemandRequest(
    id: string,
    userId: string,
    userRole: Role,
    ipAddress?: string,
  ) {
    const demand = await this.validateDemandAccess(id, userId, userRole);

    if (demand.status !== DemandStatus.DRAFT) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Hanya permintaan berstatus DRAFT yang dapat diterbitkan',
      });
    }

    // 1. Validasi neededDate >= hari ini + 1 (minimal H+1)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const neededDate = new Date(demand.neededDate);
    neededDate.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (neededDate < tomorrow) {
      throw new UnprocessableEntityException({
        code: 'INVALID_DATE',
        message: 'Tanggal kebutuhan bahan harus minimal H+1 (mulai besok)',
      });
    }

    // 2. Validasi harga dasar (PRICE_BELOW_FLOOR)
    const activePriceRef = await this.prisma.priceReference.findFirst({
      where: {
        commodityId: demand.commodityId,
        regionId: demand.kitchen.regionId,
        validTo: null,
      },
      orderBy: { validFrom: 'desc' },
    });

    if (activePriceRef) {
      const floorPrice = Number(activePriceRef.floorPrice);
      const maxPrice = Number(demand.maxPricePerUnit);

      if (maxPrice < floorPrice) {
        throw new UnprocessableEntityException({
          code: 'PRICE_BELOW_FLOOR',
          message: `Harga maksimum berada di bawah harga dasar produsen (${this.formatRupiah(floorPrice)}/kg). Naikkan harga agar tetap adil bagi petani.`,
          details: {
            floorPrice,
            maxPricePerUnit: maxPrice,
          },
        });
      }
    }

    // 3. Ubah status menjadi OPEN
    const published = await this.prisma.demandRequest.update({
      where: { id },
      data: {
        status: DemandStatus.OPEN,
      },
      include: {
        commodity: true,
        kitchen: true,
      },
    });

    await this.auditService.log({
      action: 'DEMAND_PUBLISHED',
      entity: 'DemandRequest',
      entityId: id,
      userId,
      ipAddress,
      meta: {
        statusFrom: DemandStatus.DRAFT,
        statusTo: DemandStatus.OPEN,
      },
    });

    return published;
  }

  /**
   * Membatalkan permintaan (DRAFT / OPEN -> CANCELLED)
   * Jika ada order PROPOSED/ACCEPTED, batalkan order dan lepas reservasi stok pemasok
   */
  async cancelDemandRequest(
    id: string,
    dto: CancelDemandDto,
    userId: string,
    userRole: Role,
    ipAddress?: string,
  ) {
    const demand = await this.validateDemandAccess(id, userId, userRole);

    if (
      demand.status === DemandStatus.CANCELLED ||
      demand.status === DemandStatus.FULFILLED
    ) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Permintaan yang sudah dibatalkan atau selesai tidak dapat dibatalkan',
      });
    }

    // Cek apakah ada order yang sudah dalam pengiriman/diterima/selesai
    const nonCancellableOrders = demand.orders.filter(
      (o) =>
        o.status !== OrderStatus.PROPOSED &&
        o.status !== OrderStatus.ACCEPTED &&
        o.status !== OrderStatus.REJECTED &&
        o.status !== OrderStatus.EXPIRED &&
        o.status !== OrderStatus.CANCELLED,
    );

    if (nonCancellableOrders.length > 0) {
      throw new BadRequestException({
        code: 'ORDER_IN_PROGRESS',
        message: 'Permintaan tidak dapat dibatalkan karena pengiriman pesanan sudah berjalan',
      });
    }

    // Jalankan pembatalan dalam transaksi
    await this.prisma.$transaction(async (tx) => {
      // 1. Batalkan semua order PROPOSED / ACCEPTED dan lepas reservasi penawaran stok pemasok
      const activeOrders = demand.orders.filter(
        (o) => o.status === OrderStatus.PROPOSED || o.status === OrderStatus.ACCEPTED,
      );

      for (const ord of activeOrders) {
        await tx.order.update({
          where: { id: ord.id },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        // Lepas reservasi penawaran stok bila ada offerId
        if (ord.offerId) {
          await tx.supplyOffer.update({
            where: { id: ord.offerId },
            data: {
              quantityReserved: {
                decrement: ord.quantity,
              },
            },
          });
        }
      }

      // 2. Ubah status demand menjadi CANCELLED
      await tx.demandRequest.update({
        where: { id },
        data: {
          status: DemandStatus.CANCELLED,
        },
      });
    });

    await this.auditService.log({
      action: 'DEMAND_CANCELLED',
      entity: 'DemandRequest',
      entityId: id,
      userId,
      ipAddress,
      meta: {
        reason: dto.reason || 'Dibatalkan oleh pengelola dapur / admin',
      },
    });

    return {
      message: 'Permintaan bahan berhasil dibatalkan',
    };
  }

  /**
   * Mengurai kalimat kebutuhan bahan dapur via AI microservice (Python FastAPI)
   * Dilengkapi penyesuaian komoditas lokal dan non-blocking fallback.
   */
  async parseDemandText(text: string) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${aiServiceUrl}/ai/parse-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      const parsedData: any = await response.json();

      const commodities = await this.prisma.commodity.findMany({
        where: { isActive: true },
      });

      const enrichedCandidates = (parsedData.candidates || []).map((cand: any) => {
        const found = commodities.find(
          (c) => c.name.toLowerCase() === cand.commodityName.toLowerCase()
        );
        return {
          ...cand,
          commodityId: found ? found.id : null,
          commodityUnit: found ? found.unit : 'kg',
        };
      });

      return {
        data: {
          candidates: enrichedCandidates,
          warnings: parsedData.warnings || [],
          rawText: parsedData.rawText || text,
          aiActive: true,
        },
      };
    } catch (err: any) {
      return {
        data: {
          candidates: [],
          warnings: ['Layanan cerdas Python sedang offline. Silakan gunakan input manual standar.'],
          rawText: text,
          aiActive: false,
        },
      };
    }
  }
}

