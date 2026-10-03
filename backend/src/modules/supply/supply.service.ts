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

@Injectable()
export class SupplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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
}
