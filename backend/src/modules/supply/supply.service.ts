import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, OfferStatus } from '@prisma/client';
import {
  CreateSupplyOfferDto,
  UpdateSupplyOfferDto,
  FilterSupplyOfferDto,
} from './dto/supply-offer.dto';
import { SettingsService } from '../settings/settings.service';
import {
  CreateHarvestPlanDto,
  UpdateHarvestPlanDto,
} from './dto/harvest-plan.dto';

@Injectable()
export class SupplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  private formatRupiah(val: number | string): string {
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  }

  /**
   * Mengambil profil pemasok milik pengguna yang sedang login
   */
  private async getSupplierProfileOrThrow(userId: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      include: { region: true },
    });

    if (!profile) {
      throw new ForbiddenException({
        code: 'NOT_A_SUPPLIER',
        message: 'Profil pemasok pangan tidak ditemukan untuk akun ini',
      });
    }

    return profile;
  }

  /**
   * Mengambil daftar penawaran stok milik pemasok
   */
  async getMyOffers(filter: FilterSupplyOfferDto, userId: string) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      supplierId: profile.id,
    };

    if (filter.status) where.status = filter.status;
    if (filter.commodityId) where.commodityId = filter.commodityId;

    const [total, data] = await Promise.all([
      this.prisma.supplyOffer.count({ where }),
      this.prisma.supplyOffer.findMany({
        where,
        skip,
        take: limit,
        include: {
          commodity: true,
        },
        orderBy: { harvestDate: 'desc' },
      }),
    ]);

    const formattedData = data.map((item) => {
      const available = Math.max(
        0,
        Number(item.quantityAvailable) - Number(item.quantityReserved),
      );
      return {
        ...item,
        availableQuantity: available,
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
   * Pratinjau seluruh stok aktif di wilayah untuk KITCHEN_MANAGER & ADMIN
   */
  async getAvailableOffersInRegion(regionId: string, commodityId?: string) {
    const where: any = {
      status: OfferStatus.ACTIVE,
      supplier: { regionId },
    };

    if (commodityId) where.commodityId = commodityId;

    const offers = await this.prisma.supplyOffer.findMany({
      where,
      include: {
        commodity: true,
        supplier: {
          select: {
            id: true,
            displayName: true,
            publicName: true,
            village: true,
            qualityScore: true,
            reliabilityRate: true,
          },
        },
      },
      orderBy: { harvestDate: 'asc' },
    });

    return offers.map((o) => ({
      ...o,
      availableQuantity: Math.max(
        0,
        Number(o.quantityAvailable) - Number(o.quantityReserved),
      ),
    }));
  }

  /**
   * Detail satu penawaran stok
   */
  async getOfferById(id: string, userId: string, userRole: Role) {
    const offer = await this.prisma.supplyOffer.findUnique({
      where: { id },
      include: {
        commodity: true,
        supplier: true,
      },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Penawaran stok tidak ditemukan',
      });
    }

    if (userRole === Role.SUPPLIER && offer.supplier.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki akses ke penawaran stok ini',
      });
    }

    return {
      ...offer,
      availableQuantity: Math.max(
        0,
        Number(offer.quantityAvailable) - Number(offer.quantityReserved),
      ),
    };
  }

  /**
   * Buat penawaran stok pasokan baru
   * Validasi:
   * 1. askingPrice >= floorPrice (harga dasar perlindungan petani)
   * 2. Peringatan jika harvestDate > hari ini + 14 hari
   */
  async createOffer(
    dto: CreateSupplyOfferDto,
    userId: string,
    ipAddress?: string,
  ) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    // 1. Validasi Komoditas aktif
    const commodity = await this.prisma.commodity.findUnique({
      where: { id: dto.commodityId },
    });

    if (!commodity || !commodity.isActive) {
      throw new BadRequestException({
        code: 'COMMODITY_INACTIVE',
        message: 'Komoditas tidak ditemukan atau sedang tidak aktif',
      });
    }

    // 2. Validasi Harga Dasar Wilayah (docs/04 & docs/06 M3)
    const activePriceRef = await this.prisma.priceReference.findFirst({
      where: {
        commodityId: dto.commodityId,
        regionId: profile.regionId,
        validTo: null,
      },
      orderBy: { validFrom: 'desc' },
    });

    if (activePriceRef) {
      const floorPrice = Number(activePriceRef.floorPrice);
      if (dto.askingPrice < floorPrice) {
        throw new UnprocessableEntityException({
          code: 'PRICE_BELOW_FLOOR',
          message: `Harga ajuan tidak boleh di bawah harga dasar (${this.formatRupiah(floorPrice)}).`,
          details: { floorPrice, askingPrice: dto.askingPrice },
        });
      }
    }

    const harvestDate = new Date(dto.harvestDate);

    // 3. Simpan penawaran pasokan
    const created = await this.prisma.supplyOffer.create({
      data: {
        supplierId: profile.id,
        commodityId: dto.commodityId,
        quantityAvailable: dto.quantityAvailable,
        quantityReserved: 0,
        harvestDate,
        askingPrice: dto.askingPrice,
        status: OfferStatus.ACTIVE,
        sourceText: dto.sourceText,
      },
      include: {
        commodity: true,
      },
    });

    await this.auditService.log({
      action: 'SUPPLY_OFFER_CREATED',
      entity: 'SupplyOffer',
      entityId: created.id,
      userId,
      ipAddress,
      meta: {
        commodityName: commodity.name,
        quantityAvailable: dto.quantityAvailable,
        askingPrice: dto.askingPrice,
        harvestDate: dto.harvestDate,
      },
    });

    return created;
  }

  /**
   * Perbarui penawaran stok pasokan
   * Validasi:
   * 1. quantityAvailable tidak boleh diturunkan di bawah quantityReserved (INSUFFICIENT_STOCK)
   * 2. askingPrice >= floorPrice
   */
  async updateOffer(
    id: string,
    dto: UpdateSupplyOfferDto,
    userId: string,
    ipAddress?: string,
  ) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const offer = await this.prisma.supplyOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Penawaran stok tidak ditemukan',
      });
    }

    if (offer.supplierId !== profile.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk mengubah penawaran ini',
      });
    }

    // 1. Validasi batas kuantitas terhadap kuantitas tereservasi
    if (dto.quantityAvailable !== undefined) {
      const currentReserved = Number(offer.quantityReserved);
      if (dto.quantityAvailable < currentReserved) {
        throw new UnprocessableEntityException({
          code: 'INSUFFICIENT_STOCK',
          message: `Kuantitas stok tidak boleh lebih kecil dari kuantitas yang sedang tereservasi untuk pesanan (${currentReserved} kg).`,
          details: {
            requestedQuantity: dto.quantityAvailable,
            quantityReserved: currentReserved,
          },
        });
      }
    }

    // 2. Validasi Harga Dasar Wilayah
    if (dto.askingPrice !== undefined) {
      const activePriceRef = await this.prisma.priceReference.findFirst({
        where: {
          commodityId: offer.commodityId,
          regionId: profile.regionId,
          validTo: null,
        },
        orderBy: { validFrom: 'desc' },
      });

      if (activePriceRef) {
        const floorPrice = Number(activePriceRef.floorPrice);
        if (dto.askingPrice < floorPrice) {
          throw new UnprocessableEntityException({
            code: 'PRICE_BELOW_FLOOR',
            message: `Harga ajuan tidak boleh di bawah harga dasar (${this.formatRupiah(floorPrice)}).`,
            details: { floorPrice, askingPrice: dto.askingPrice },
          });
        }
      }
    }

    const updated = await this.prisma.supplyOffer.update({
      where: { id },
      data: {
        quantityAvailable: dto.quantityAvailable,
        askingPrice: dto.askingPrice,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
      },
      include: { commodity: true },
    });

    await this.auditService.log({
      action: 'SUPPLY_OFFER_UPDATED',
      entity: 'SupplyOffer',
      entityId: id,
      userId,
      ipAddress,
      meta: { dto },
    });

    return updated;
  }

  /**
   * Batalkan penawaran stok
   * Hanya boleh jika quantityReserved === 0
   */
  async cancelOffer(id: string, userId: string, ipAddress?: string) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const offer = await this.prisma.supplyOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException({
        code: 'OFFER_NOT_FOUND',
        message: 'Penawaran stok tidak ditemukan',
      });
    }

    if (offer.supplierId !== profile.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk membatalkan penawaran ini',
      });
    }

    if (Number(offer.quantityReserved) > 0) {
      throw new UnprocessableEntityException({
        code: 'CANNOT_CANCEL_RESERVED_OFFER',
        message: 'Penawaran stok yang memiliki alokasi pesanan berjalan tidak dapat dibatalkan.',
      });
    }

    const cancelled = await this.prisma.supplyOffer.update({
      where: { id },
      data: { status: OfferStatus.CANCELLED },
    });

    await this.auditService.log({
      action: 'SUPPLY_OFFER_CANCELLED',
      entity: 'SupplyOffer',
      entityId: id,
      userId,
      ipAddress,
      meta: { previousStatus: offer.status },
    });

    return {
      message: 'Penawaran stok pasokan berhasil dibatalkan',
      offer: cancelled,
    };
  }

  // =========================================================================
  // RENCANA PANEN (HARVEST PLAN) & KALENDER KOLEKTIF (docs/06 M3 - P1)
  // =========================================================================

  /**
   * Membuat rencana panen baru untuk pemasok
   */
  async createHarvestPlan(dto: CreateHarvestPlanDto, userId: string, ipAddress?: string) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const commodity = await this.prisma.commodity.findUnique({
      where: { id: dto.commodityId },
    });

    if (!commodity || !commodity.isActive) {
      throw new NotFoundException({
        code: 'COMMODITY_NOT_FOUND',
        message: 'Komoditas pangan tidak ditemukan atau tidak aktif',
      });
    }

    const harvestDate = new Date(dto.expectedHarvestDate);

    const plan = await this.prisma.harvestPlan.create({
      data: {
        supplierId: profile.id,
        commodityId: dto.commodityId,
        expectedQuantity: dto.expectedQuantity,
        expectedHarvestDate: harvestDate,
        notes: dto.notes || null,
      },
      include: {
        commodity: true,
      },
    });

    await this.auditService.log({
      action: 'HARVEST_PLAN_CREATED',
      entity: 'HarvestPlan',
      entityId: plan.id,
      userId,
      ipAddress,
      meta: {
        commodityName: commodity.name,
        expectedQuantity: dto.expectedQuantity,
        expectedHarvestDate: dto.expectedHarvestDate,
      },
    });

    return {
      ...plan,
      expectedQuantity: Number(plan.expectedQuantity),
    };
  }

  /**
   * Mengambil daftar rencana panen milik pemasok yang sedang login
   */
  async getMyHarvestPlans(userId: string) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const plans = await this.prisma.harvestPlan.findMany({
      where: { supplierId: profile.id },
      include: { commodity: true },
      orderBy: { expectedHarvestDate: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      expectedQuantity: Number(p.expectedQuantity),
    }));
  }

  /**
   * Mengubah rencana panen
   */
  async updateHarvestPlan(
    id: string,
    dto: UpdateHarvestPlanDto,
    userId: string,
    ipAddress?: string,
  ) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const plan = await this.prisma.harvestPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException({
        code: 'HARVEST_PLAN_NOT_FOUND',
        message: 'Rencana panen tidak ditemukan',
      });
    }

    if (plan.supplierId !== profile.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk mengubah rencana panen ini',
      });
    }

    const dataToUpdate: any = {};
    if (dto.expectedQuantity !== undefined) {
      dataToUpdate.expectedQuantity = dto.expectedQuantity;
    }
    if (dto.expectedHarvestDate !== undefined) {
      dataToUpdate.expectedHarvestDate = new Date(dto.expectedHarvestDate);
    }
    if (dto.notes !== undefined) {
      dataToUpdate.notes = dto.notes;
    }

    const updated = await this.prisma.harvestPlan.update({
      where: { id },
      data: dataToUpdate,
      include: { commodity: true },
    });

    await this.auditService.log({
      action: 'HARVEST_PLAN_UPDATED',
      entity: 'HarvestPlan',
      entityId: id,
      userId,
      ipAddress,
      meta: { changes: dto },
    });

    return {
      ...updated,
      expectedQuantity: Number(updated.expectedQuantity),
    };
  }

  /**
   * Menghapus rencana panen
   */
  async deleteHarvestPlan(id: string, userId: string, ipAddress?: string) {
    const profile = await this.getSupplierProfileOrThrow(userId);

    const plan = await this.prisma.harvestPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException({
        code: 'HARVEST_PLAN_NOT_FOUND',
        message: 'Rencana panen tidak ditemukan',
      });
    }

    if (plan.supplierId !== profile.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk menghapus rencana panen ini',
      });
    }

    await this.prisma.harvestPlan.delete({
      where: { id },
    });

    await this.auditService.log({
      action: 'HARVEST_PLAN_DELETED',
      entity: 'HarvestPlan',
      entityId: id,
      userId,
      ipAddress,
    });

    return { message: 'Rencana panen berhasil dihapus' };
  }

  /**
   * Mengambil Kalender Panen Kolektif dan Heatmap Pasokan vs Kebutuhan (docs/06 M3 & docs/04 bagian 0)
   * Agregat per komoditas per rentang minggu (default 4 minggu):
   * demand (kg), supply (kg), ratio (supply/demand), status (Kurang / Cukup / Berlebih)
   * Menggunakan ambang batas SystemSetting:
   * harvest.gapLowRatio = 0.8 (ratio < 0.8 = "Kurang")
   * harvest.gapHighRatio = 1.3 (ratio > 1.3 = "Berlebih", diantaranya = "Cukup")
   */
  async getHarvestCalendar(params: { regionId?: string; weeks?: number }) {
    const weeksCount = Math.min(12, Math.max(1, Number(params.weeks) || 4));

    const gapLowRatio = await this.settingsService.getSetting<number>(
      'harvest.gapLowRatio',
      0.8,
    );
    const gapHighRatio = await this.settingsService.getSetting<number>(
      'harvest.gapHighRatio',
      1.3,
    );

    // Hitung jendela tanggal per minggu mulai dari awal minggu ini (Senin)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() + diffToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const weeklyIntervals: {
      weekIndex: number;
      weekLabel: string;
      startDate: Date;
      endDate: Date;
    }[] = [];

    for (let i = 0; i < weeksCount; i++) {
      const start = new Date(startOfCurrentWeek);
      start.setDate(startOfCurrentWeek.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const startFmt = start.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
      const endFmt = end.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });

      weeklyIntervals.push({
        weekIndex: i + 1,
        weekLabel: `Mgg ${i + 1} (${startFmt} - ${endFmt})`,
        startDate: start,
        endDate: end,
      });
    }

    const windowStart = weeklyIntervals[0].startDate;
    const windowEnd = weeklyIntervals[weeklyIntervals.length - 1].endDate;

    // 1. Ambil semua komoditas aktif
    const commodities = await this.prisma.commodity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // 2. Filter wilayah untuk dapur dan pemasok bila ditentukan
    const demandWhere: any = {
      neededDate: { gte: windowStart, lte: windowEnd },
      status: { notIn: ['CANCELLED', 'DRAFT'] },
    };
    if (params.regionId) {
      demandWhere.kitchen = { regionId: params.regionId };
    }

    const demandRequests = await this.prisma.demandRequest.findMany({
      where: demandWhere,
    });

    // 3. Ambil Pasokan: Gabungan SupplyOffer aktif + HarvestPlan
    const offerWhere: any = {
      harvestDate: { gte: windowStart, lte: windowEnd },
      status: { in: [OfferStatus.ACTIVE, OfferStatus.DEPLETED] },
    };
    if (params.regionId) {
      offerWhere.supplier = { regionId: params.regionId };
    }

    const supplyOffers = await this.prisma.supplyOffer.findMany({
      where: offerWhere,
    });

    const planWhere: any = {
      expectedHarvestDate: { gte: windowStart, lte: windowEnd },
    };
    if (params.regionId) {
      planWhere.supplier = { regionId: params.regionId };
    }

    const harvestPlans = await this.prisma.harvestPlan.findMany({
      where: planWhere,
    });

    // 4. Agregasi per komoditas per interval minggu
    const calendarData = commodities.map((commodity) => {
      const weeks = weeklyIntervals.map((interval) => {
        // Hitung total demand pada minggu ini
        const weekDemands = demandRequests.filter(
          (d) =>
            d.commodityId === commodity.id &&
            d.neededDate >= interval.startDate &&
            d.neededDate <= interval.endDate,
        );
        const totalDemand = weekDemands.reduce(
          (sum, d) => sum + Number(d.quantity),
          0,
        );

        // Hitung total supply pada minggu ini (Offers + Plans)
        const weekOffers = supplyOffers.filter(
          (o) =>
            o.commodityId === commodity.id &&
            o.harvestDate >= interval.startDate &&
            o.harvestDate <= interval.endDate,
        );
        const offerQty = weekOffers.reduce(
          (sum, o) => sum + (Number(o.quantityAvailable) + Number(o.quantityReserved)),
          0,
        );

        const weekPlans = harvestPlans.filter(
          (p) =>
            p.commodityId === commodity.id &&
            p.expectedHarvestDate >= interval.startDate &&
            p.expectedHarvestDate <= interval.endDate,
        );
        const planQty = weekPlans.reduce(
          (sum, p) => sum + Number(p.expectedQuantity),
          0,
        );

        const totalSupply = offerQty + planQty;

        let ratio = 1.0;
        let status: 'DEFICIT' | 'BALANCED' | 'SURPLUS' = 'BALANCED';
        let statusLabel = 'Cukup';

        if (totalDemand > 0) {
          ratio = Number((totalSupply / totalDemand).toFixed(2));
          if (ratio < gapLowRatio) {
            status = 'DEFICIT';
            statusLabel = 'Kurang';
          } else if (ratio > gapHighRatio) {
            status = 'SURPLUS';
            statusLabel = 'Berlebih';
          } else {
            status = 'BALANCED';
            statusLabel = 'Cukup';
          }
        } else if (totalSupply > 0) {
          ratio = 99.0;
          status = 'SURPLUS';
          statusLabel = 'Berlebih';
        }

        return {
          weekIndex: interval.weekIndex,
          weekLabel: interval.weekLabel,
          startDate: interval.startDate,
          endDate: interval.endDate,
          demandKg: totalDemand,
          supplyKg: totalSupply,
          ratio,
          status,
          statusLabel,
        };
      });

      const totalCommodityDemand = weeks.reduce((sum, w) => sum + w.demandKg, 0);
      const totalCommoditySupply = weeks.reduce((sum, w) => sum + w.supplyKg, 0);

      return {
        commodityId: commodity.id,
        commodityName: commodity.name,
        commodityCategory: commodity.category,
        totalDemandKg: totalCommodityDemand,
        totalSupplyKg: totalCommoditySupply,
        weeks,
      };
    });

    return {
      weeks: weeklyIntervals.map((w) => ({
        weekIndex: w.weekIndex,
        weekLabel: w.weekLabel,
      })),
      thresholds: {
        gapLowRatio,
        gapHighRatio,
      },
      commodities: calendarData,
    };
  }
}

