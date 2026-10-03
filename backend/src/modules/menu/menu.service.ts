import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, DemandStatus } from '@prisma/client';
import { CreateMenuPlanDto, UpdateMenuPlanDto, GenerateDemandDto } from './dto/menu.dto';
import { DemandPlanner } from './demand-planner';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validasi kepemilikan dapur: KITCHEN_MANAGER hanya boleh mengelola dapurnya sendiri
   */
  private async validateKitchenAccess(kitchenId: string, userId: string, userRole: Role) {
    const kitchen = await this.prisma.kitchen.findUnique({
      where: { id: kitchenId },
      include: { manager: true },
    });

    if (!kitchen) {
      throw new NotFoundException({
        code: 'KITCHEN_NOT_FOUND',
        message: 'Dapur tidak ditemukan',
      });
    }

    if (userRole === Role.ADMIN) {
      return kitchen;
    }

    if (userRole === Role.KITCHEN_MANAGER && kitchen.managerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki akses ke dapur ini',
      });
    }

    return kitchen;
  }

  /**
   * Ambil daftar MenuPlan suatu dapur dalam rentang tanggal
   */
  async getMenuPlans(kitchenId: string, from?: string, to?: string, userId?: string, userRole?: Role) {
    if (userId && userRole) {
      await this.validateKitchenAccess(kitchenId, userId, userRole);
    }

    const where: any = { kitchenId };
    if (from || to) {
      where.serviceDate = {};
      if (from) where.serviceDate.gte = new Date(from);
      if (to) where.serviceDate.lte = new Date(to);
    }

    return this.prisma.menuPlan.findMany({
      where,
      include: {
        recipe: {
          include: {
            items: {
              include: { commodity: true },
            },
          },
        },
      },
      orderBy: { serviceDate: 'asc' },
    });
  }

  /**
   * Buat MenuPlan baru untuk suatu dapur
   */
  async createMenuPlan(kitchenId: string, dto: CreateMenuPlanDto, userId: string, userRole: Role) {
    await this.validateKitchenAccess(kitchenId, userId, userRole);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException({
        code: 'RECIPE_NOT_FOUND',
        message: 'Resep baku tidak ditemukan',
      });
    }

    const serviceDate = new Date(dto.serviceDate);

    // Cek apakah menu plan untuk kombinasi ini sudah ada
    const existing = await this.prisma.menuPlan.findUnique({
      where: {
        kitchenId_serviceDate_recipeId: {
          kitchenId,
          serviceDate,
          recipeId: dto.recipeId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'MENU_PLAN_ALREADY_EXISTS',
        message: 'Menu plan untuk resep dan tanggal ini sudah terdaftar',
      });
    }

    return this.prisma.menuPlan.create({
      data: {
        kitchenId,
        recipeId: dto.recipeId,
        serviceDate,
        portions: dto.portions,
      },
      include: {
        recipe: true,
      },
    });
  }

  /**
   * Perbarui MenuPlan (hanya boleh bila belum ada permintaan OPEN untuk tanggal itu)
   */
  async updateMenuPlan(id: string, dto: UpdateMenuPlanDto, userId: string, userRole: Role) {
    const menuPlan = await this.prisma.menuPlan.findUnique({
      where: { id },
    });

    if (!menuPlan) {
      throw new NotFoundException({
        code: 'MENU_PLAN_NOT_FOUND',
        message: 'Menu plan tidak ditemukan',
      });
    }

    await this.validateKitchenAccess(menuPlan.kitchenId, userId, userRole);

    // Cek apakah ada permintaan OPEN atau selanjutnya untuk tanggal layanan ini
    const activeDemand = await this.prisma.demandRequest.findFirst({
      where: {
        kitchenId: menuPlan.kitchenId,
        neededDate: menuPlan.serviceDate,
        status: {
          in: [
            DemandStatus.OPEN,
            DemandStatus.MATCHING,
            DemandStatus.PARTIALLY_FULFILLED,
            DemandStatus.FULFILLED,
          ],
        },
      },
    });

    if (activeDemand) {
      throw new BadRequestException({
        code: 'CANNOT_MODIFY_MENU_WITH_ACTIVE_DEMAND',
        message: 'Tidak dapat mengubah menu karena permintaan kebutuhan tanggal ini sudah terbit atau sedang berjalan',
      });
    }

    return this.prisma.menuPlan.update({
      where: { id },
      data: {
        recipeId: dto.recipeId,
        portions: dto.portions,
      },
      include: { recipe: true },
    });
  }

  /**
   * Hapus MenuPlan
   */
  async deleteMenuPlan(id: string, userId: string, userRole: Role) {
    const menuPlan = await this.prisma.menuPlan.findUnique({
      where: { id },
    });

    if (!menuPlan) {
      throw new NotFoundException({
        code: 'MENU_PLAN_NOT_FOUND',
        message: 'Menu plan tidak ditemukan',
      });
    }

    await this.validateKitchenAccess(menuPlan.kitchenId, userId, userRole);

    const activeDemand = await this.prisma.demandRequest.findFirst({
      where: {
        kitchenId: menuPlan.kitchenId,
        neededDate: menuPlan.serviceDate,
        status: {
          notIn: [DemandStatus.DRAFT, DemandStatus.CANCELLED],
        },
      },
    });

    if (activeDemand) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_MENU_WITH_ACTIVE_DEMAND',
        message: 'Tidak dapat menghapus menu karena terdapat permintaan aktif pada tanggal ini',
      });
    }

    await this.prisma.menuPlan.delete({ where: { id } });
    return { message: 'Menu plan berhasil dihapus' };
  }

  /**
   * Menghasilkan draf kebutuhan bahan (DemandRequest) secara idempoten dari menu plan
   * Sesuai docs/04 bagian 2
   */
  async generateDemand(kitchenId: string, dto: GenerateDemandDto, userId: string, userRole: Role) {
    const kitchen = await this.validateKitchenAccess(kitchenId, userId, userRole);

    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);

    // 1. Ambil menu plans pada rentang tanggal
    const menuPlans = await this.prisma.menuPlan.findMany({
      where: {
        kitchenId,
        serviceDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        recipe: {
          include: {
            items: {
              include: { commodity: true },
            },
          },
        },
      },
    });

    if (menuPlans.length === 0) {
      throw new BadRequestException({
        code: 'NO_MENU_PLANS_FOUND',
        message: 'Tidak ditemukan menu plan pada rentang tanggal yang dipilih',
      });
    }

    // 2. Format input untuk DemandPlanner
    const plannerInputs = menuPlans.map((mp) => ({
      portions: mp.portions,
      serviceDate: mp.serviceDate,
      recipeItems: mp.recipe.items.map((it) => ({
        commodityId: it.commodityId,
        wastePercent: it.commodity.wastePercent,
        quantityPerPortion: it.quantityPerPortion,
      })),
    }));

    // 3. Hitung kebutuhan dengan formula resmi (ceil to 0.1 kg)
    const calculatedDemands = DemandPlanner.calculate(plannerInputs);

    // 4. Ambil harga acuan aktif wilayah dapur untuk mengisi maxPricePerUnit default
    const commoditiesList = await this.prisma.commodity.findMany({
      where: { isActive: true },
      include: {
        priceReferences: {
          where: {
            regionId: kitchen.regionId,
            validTo: null,
          },
        },
      },
    });

    const priceMap = new Map<string, number>();
    for (const c of commoditiesList) {
      const activeRef = c.priceReferences[0];
      if (activeRef) {
        priceMap.set(c.id, Number(activeRef.referencePrice));
      }
    }

    // 5. Simpan / Perbarui draf secara idempoten
    const savedRequests = [];

    for (const calc of calculatedDemands) {
      const neededDate = new Date(calc.neededDate);
      const defaultPrice = priceMap.get(calc.commodityId) || 10000;

      // Cek apakah sudah ada permintaan
      const existing = await this.prisma.demandRequest.findUnique({
        where: {
          kitchenId_commodityId_neededDate: {
            kitchenId,
            commodityId: calc.commodityId,
            neededDate,
          },
        },
      });

      if (!existing) {
        // Buat baru berstatus DRAFT
        const created = await this.prisma.demandRequest.create({
          data: {
            kitchenId,
            commodityId: calc.commodityId,
            neededDate,
            quantity: calc.needQty,
            maxPricePerUnit: defaultPrice,
            minQualityScore: 60,
            status: DemandStatus.DRAFT,
          },
          include: { commodity: true },
        });
        savedRequests.push(created);
      } else if (existing.status === DemandStatus.DRAFT) {
        // Perbarui draf yang masih DRAFT (tidak membuat duplikat)
        const updated = await this.prisma.demandRequest.update({
          where: { id: existing.id },
          data: {
            quantity: calc.needQty,
            maxPricePerUnit: defaultPrice,
          },
          include: { commodity: true },
        });
        savedRequests.push(updated);
      } else {
        // Abaikan jika sudah OPEN atau status selanjutnya (sesuai docs/04 bagian 2)
        savedRequests.push(existing);
      }
    }

    return {
      message: `Berhasil memproses kebutuhan bahan untuk ${savedRequests.length} komoditas`,
      demands: savedRequests,
    };
  }
}
