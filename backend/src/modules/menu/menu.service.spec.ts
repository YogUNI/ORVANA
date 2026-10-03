import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, DemandStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MenuService Unit Tests (T2.4)', () => {
  let service: MenuService;
  let prisma: any;

  const mockKitchen = {
    id: 'k-1',
    code: 'DPR01',
    name: 'Dapur Gizi Demo A',
    managerId: 'user-manager-1',
    regionId: 'reg-1',
  };

  const mockRecipe = {
    id: 'rec-1',
    name: 'R1 Nasi Lele',
    items: [
      {
        commodityId: 'comm-bayam',
        quantityPerPortion: 0.06,
        commodity: { id: 'comm-bayam', name: 'Bayam', wastePercent: 0.15 },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      kitchen: {
        findUnique: jest.fn(),
      },
      recipe: {
        findUnique: jest.fn(),
      },
      menuPlan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      demandRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      commodity: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  describe('Kitchen Access Scoping', () => {
    it('menolak KITCHEN_MANAGER yang mencoba mengakses dapur orang lain', async () => {
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);

      await expect(
        service.createMenuPlan(
          mockKitchen.id,
          { recipeId: 'rec-1', serviceDate: '2026-10-12', portions: 1000 },
          'user-manager-OTHER',
          Role.KITCHEN_MANAGER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('mengizinkan ADMIN mengakses dapur mana saja', async () => {
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);
      prisma.recipe.findUnique.mockResolvedValue(mockRecipe);
      prisma.menuPlan.findUnique.mockResolvedValue(null);
      prisma.menuPlan.create.mockResolvedValue({ id: 'mp-1', portions: 1000 });

      const result = await service.createMenuPlan(
        mockKitchen.id,
        { recipeId: 'rec-1', serviceDate: '2026-10-12', portions: 1000 },
        'admin-user',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
      expect(prisma.menuPlan.create).toHaveBeenCalled();
    });
  });

  describe('Generate Demand Idempotency', () => {
    it('membuat draf baru jika belum ada permintaan pada tanggal tersebut', async () => {
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);
      prisma.menuPlan.findMany.mockResolvedValue([
        {
          id: 'mp-1',
          portions: 1000,
          serviceDate: new Date('2026-10-12'),
          recipe: mockRecipe,
        },
      ]);

      prisma.commodity.findMany.mockResolvedValue([
        {
          id: 'comm-bayam',
          priceReferences: [{ referencePrice: 8000 }],
        },
      ]);

      // Belum ada demand request
      prisma.demandRequest.findUnique.mockResolvedValue(null);
      prisma.demandRequest.create.mockResolvedValue({
        id: 'dr-1',
        commodityId: 'comm-bayam',
        quantity: 69.0,
        status: DemandStatus.DRAFT,
      });

      const res = await service.generateDemand(
        mockKitchen.id,
        { from: '2026-10-12', to: '2026-10-12' },
        mockKitchen.managerId,
        Role.KITCHEN_MANAGER,
      );

      expect(res.demands).toHaveLength(1);
      expect(prisma.demandRequest.create).toHaveBeenCalled();
    });

    it('memperbarui draf yang masih DRAFT jika generate dipanggil dua kali (idempoten)', async () => {
      prisma.kitchen.findUnique.mockResolvedValue(mockKitchen);
      prisma.menuPlan.findMany.mockResolvedValue([
        {
          id: 'mp-1',
          portions: 1000,
          serviceDate: new Date('2026-10-12'),
          recipe: mockRecipe,
        },
      ]);

      prisma.commodity.findMany.mockResolvedValue([
        {
          id: 'comm-bayam',
          priceReferences: [{ referencePrice: 8000 }],
        },
      ]);

      // Sudah ada demand request yang masih DRAFT
      prisma.demandRequest.findUnique.mockResolvedValue({
        id: 'dr-existing',
        commodityId: 'comm-bayam',
        quantity: 50.0,
        status: DemandStatus.DRAFT,
      });

      prisma.demandRequest.update.mockResolvedValue({
        id: 'dr-existing',
        commodityId: 'comm-bayam',
        quantity: 69.0,
        status: DemandStatus.DRAFT,
      });

      const res = await service.generateDemand(
        mockKitchen.id,
        { from: '2026-10-12', to: '2026-10-12' },
        mockKitchen.managerId,
        Role.KITCHEN_MANAGER,
      );

      expect(res.demands).toHaveLength(1);
      expect(prisma.demandRequest.update).toHaveBeenCalled();
      expect(prisma.demandRequest.create).not.toHaveBeenCalled();
    });
  });
});
