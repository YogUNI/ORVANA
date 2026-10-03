import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCommodityDto, UpdateCommodityDto } from './dto/commodity.dto';
import { SetQualityStandardDto } from './dto/quality-standard.dto';
import { CreateRecipeDto, UpdateRecipeDto, SetRecipeItemsDto } from './dto/recipe.dto';
import { CreatePriceReferenceDto } from './dto/price-reference.dto';

@Injectable()
export class MasterDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // 1. REGIONS
  // ==========================================
  async getRegions() {
    return this.prisma.region.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // ==========================================
  // 2. COMMODITIES
  // ==========================================
  async getCommodities(category?: any, q?: string) {
    const where: Prisma.CommodityWhereInput = {};
    if (category) where.category = category;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    return this.prisma.commodity.findMany({
      where,
      include: { qualityStandard: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCommodityById(id: string) {
    const commodity = await this.prisma.commodity.findUnique({
      where: { id },
      include: { qualityStandard: true },
    });
    if (!commodity) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Komoditas pangan tidak ditemukan.',
      });
    }
    return commodity;
  }

  async createCommodity(dto: CreateCommodityDto, adminId: string, ipAddress?: string) {
    const existing = await this.prisma.commodity.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException({
        code: 'COMMODITY_ALREADY_EXISTS',
        message: `Komoditas dengan nama "${dto.name}" sudah terdaftar.`,
      });
    }

    const commodity = await this.prisma.commodity.create({
      data: {
        name: dto.name,
        category: dto.category,
        unit: 'kg',
        shelfLifeDays: dto.shelfLifeDays,
        wastePercent: dto.wastePercent,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'COMMODITY_CREATED',
      entity: 'Commodity',
      entityId: commodity.id,
      meta: { name: commodity.name, category: commodity.category },
      ipAddress,
    });

    return commodity;
  }

  async updateCommodity(
    id: string,
    dto: UpdateCommodityDto,
    adminId: string,
    ipAddress?: string,
  ) {
    await this.getCommodityById(id);

    const updated = await this.prisma.commodity.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        shelfLifeDays: dto.shelfLifeDays,
        wastePercent: dto.wastePercent,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'COMMODITY_UPDATED',
      entity: 'Commodity',
      entityId: updated.id,
      meta: dto,
      ipAddress,
    });

    return updated;
  }

  // ==========================================
  // 3. QUALITY STANDARDS (Bobot Wajib = 100)
  // ==========================================
  async getQualityStandard(commodityId: string) {
    await this.getCommodityById(commodityId);
    return this.prisma.qualityStandard.findUnique({
      where: { commodityId },
    });
  }

  async setQualityStandard(
    commodityId: string,
    dto: SetQualityStandardDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.getCommodityById(commodityId);

    // Validasi aturan bisnis: jumlah bobot item checklist HARUS = 100
    const totalWeight = dto.checklist.reduce((sum, item) => sum + item.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.0001) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Jumlah bobot kriteria checklist mutu harus tepat 100 (saat ini ${totalWeight}).`,
      });
    }

    const standard = await this.prisma.qualityStandard.upsert({
      where: { commodityId },
      create: {
        commodityId,
        passScore: dto.passScore,
        checklist: dto.checklist as any,
      },
      update: {
        passScore: dto.passScore,
        checklist: dto.checklist as any,
      },
    });

    await this.auditService.log({
      userId,
      action: 'QUALITY_STANDARD_SET',
      entity: 'QualityStandard',
      entityId: standard.id,
      meta: { commodityId, passScore: dto.passScore, totalWeight },
      ipAddress,
    });

    return standard;
  }

  // ==========================================
  // 4. RECIPES & RECIPE ITEMS
  // ==========================================
  async getRecipes() {
    return this.prisma.recipe.findMany({
      include: {
        items: {
          include: { commodity: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRecipeById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        items: {
          include: { commodity: true },
        },
      },
    });
    if (!recipe) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Resep menu tidak ditemukan.',
      });
    }
    return recipe;
  }

  async createRecipe(dto: CreateRecipeDto, userId: string, ipAddress?: string) {
    const existing = await this.prisma.recipe.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException({
        code: 'RECIPE_ALREADY_EXISTS',
        message: `Resep dengan nama "${dto.name}" sudah ada.`,
      });
    }

    const recipe = await this.prisma.$transaction(async (tx) => {
      const created = await tx.recipe.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.recipeItem.createMany({
          data: dto.items.map((it) => ({
            recipeId: created.id,
            commodityId: it.commodityId,
            quantityPerPortion: it.quantityPerPortion,
          })),
        });
      }

      return created;
    });

    await this.auditService.log({
      userId,
      action: 'RECIPE_CREATED',
      entity: 'Recipe',
      entityId: recipe.id,
      meta: { name: recipe.name },
      ipAddress,
    });

    return this.getRecipeById(recipe.id);
  }

  async updateRecipe(id: string, dto: UpdateRecipeDto, userId: string, ipAddress?: string) {
    await this.getRecipeById(id);
    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    await this.auditService.log({
      userId,
      action: 'RECIPE_UPDATED',
      entity: 'Recipe',
      entityId: id,
      meta: dto,
      ipAddress,
    });

    return updated;
  }

  async setRecipeItems(
    id: string,
    dto: SetRecipeItemsDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.getRecipeById(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { recipeId: id } });
      await tx.recipeItem.createMany({
        data: dto.items.map((it) => ({
          recipeId: id,
          commodityId: it.commodityId,
          quantityPerPortion: it.quantityPerPortion,
        })),
      });
    });

    await this.auditService.log({
      userId,
      action: 'RECIPE_ITEMS_UPDATED',
      entity: 'Recipe',
      entityId: id,
      meta: { itemCount: dto.items.length },
      ipAddress,
    });

    return this.getRecipeById(id);
  }

  // ==========================================
  // 5. PRICE REFERENCES (Floor <= Ref <= Ceiling)
  // ==========================================
  async getPriceReferences(commodityId?: string, regionId?: string) {
    const where: Prisma.PriceReferenceWhereInput = {};
    if (commodityId) where.commodityId = commodityId;
    if (regionId) where.regionId = regionId;

    return this.prisma.priceReference.findMany({
      where,
      include: { commodity: true, region: true },
      orderBy: { validFrom: 'desc' },
    });
  }

  async createPriceReference(
    dto: CreatePriceReferenceDto,
    adminId: string,
    ipAddress?: string,
  ) {
    // 1. Validasi aturan bisnis matematis: floorPrice <= referencePrice <= ceilingPrice
    if (dto.floorPrice > dto.referencePrice || dto.referencePrice > dto.ceilingPrice) {
      throw new BadRequestException({
        code: 'INVALID_PRICE_ORDER',
        message:
          'Urutan harga acuan tidak valid. Ketentuan: Harga Dasar (Floor) ≤ Harga Acuan (Reference) ≤ Batas Atas (Ceiling).',
      });
    }

    const validFromDate = new Date(dto.validFrom);

    const priceRef = await this.prisma.$transaction(async (tx) => {
      // 2. Tutup masa berlaku entri harga acuan sebelumnya untuk komoditas & wilayah yang sama
      const previousEntry = await tx.priceReference.findFirst({
        where: {
          commodityId: dto.commodityId,
          regionId: dto.regionId,
          validTo: null,
          validFrom: { lt: validFromDate },
        },
        orderBy: { validFrom: 'desc' },
      });

      if (previousEntry) {
        const dayBefore = new Date(validFromDate);
        dayBefore.setDate(dayBefore.getDate() - 1);

        await tx.priceReference.update({
          where: { id: previousEntry.id },
          data: { validTo: dayBefore },
        });
      }

      // 3. Buat entri harga acuan baru
      return tx.priceReference.create({
        data: {
          commodityId: dto.commodityId,
          regionId: dto.regionId,
          floorPrice: dto.floorPrice,
          referencePrice: dto.referencePrice,
          ceilingPrice: dto.ceilingPrice,
          validFrom: validFromDate,
          validTo: dto.validTo ? new Date(dto.validTo) : null,
          setById: adminId,
        },
      });
    });

    await this.auditService.log({
      userId: adminId,
      action: 'PRICE_REFERENCE_CREATED',
      entity: 'PriceReference',
      entityId: priceRef.id,
      meta: {
        commodityId: dto.commodityId,
        regionId: dto.regionId,
        floorPrice: dto.floorPrice,
        referencePrice: dto.referencePrice,
        ceilingPrice: dto.ceilingPrice,
      },
      ipAddress,
    });

    return priceRef;
  }
}
