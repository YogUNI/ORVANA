import { Test, TestingModule } from '@nestjs/testing';
import { SupplyService } from './supply.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OfferStatus, SupplierType } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('SupplyService Unit Tests (T3.1)', () => {
  let service: SupplyService;
  let prisma: any;
  let auditService: any;

  const mockSupplierProfile = {
    id: 'supp-prof-1',
    userId: 'user-supp-1',
    displayName: 'Tani Makmur',
    type: SupplierType.FARMER,
    regionId: 'reg-demo',
    region: { id: 'reg-demo', name: 'Kabupaten Demo' },
  };

  const mockCommodityBayam = {
    id: 'comm-bayam',
    name: 'Bayam',
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      supplierProfile: {
        findUnique: jest.fn(),
      },
      commodity: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      priceReference: {
        findFirst: jest.fn(),
      },
      supplyOffer: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      harvestPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      demandRequest: {
        findMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const mockSettingsService = {
      getSetting: jest.fn().mockImplementation((key: string, def: any) => {
        if (key === 'harvest.gapLowRatio') return 0.8;
        if (key === 'harvest.gapHighRatio') return 1.3;
        return def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<SupplyService>(SupplyService);
  });

  describe('Validasi Harga Dasar (PRICE_BELOW_FLOOR)', () => {
    it('menolak pembuatan penawaran stok jika harga ajuan di bawah harga dasar produsen', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);
      prisma.commodity.findUnique.mockResolvedValue(mockCommodityBayam);

      // Harga dasar bayam = 6.000 (docs/09 Bagian 5.1)
      prisma.priceReference.findFirst.mockResolvedValue({
        commodityId: 'comm-bayam',
        regionId: 'reg-demo',
        floorPrice: 6000,
        referencePrice: 8000,
        ceilingPrice: 12000,
      });

      await expect(
        service.createOffer(
          {
            commodityId: 'comm-bayam',
            quantityAvailable: 40.0,
            harvestDate: '2026-10-12',
            askingPrice: 5000, // Di bawah dasar 6.000!
          },
          'user-supp-1',
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.createOffer(
          {
            commodityId: 'comm-bayam',
            quantityAvailable: 40.0,
            harvestDate: '2026-10-12',
            askingPrice: 5000,
          },
          'user-supp-1',
        );
      } catch (err: any) {
        expect(err.response.code).toBe('PRICE_BELOW_FLOOR');
        expect(err.response.message).toContain('6.000');
      }
    });

    it('berhasil membuat stok jika harga ajuan >= harga dasar produsen', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);
      prisma.commodity.findUnique.mockResolvedValue(mockCommodityBayam);
      prisma.priceReference.findFirst.mockResolvedValue({
        commodityId: 'comm-bayam',
        regionId: 'reg-demo',
        floorPrice: 6000,
        referencePrice: 8000,
        ceilingPrice: 12000,
      });

      prisma.supplyOffer.create.mockResolvedValue({
        id: 'off-1',
        supplierId: mockSupplierProfile.id,
        commodityId: 'comm-bayam',
        quantityAvailable: 40.0,
        quantityReserved: 0,
        askingPrice: 8000,
        status: OfferStatus.ACTIVE,
      });

      const res = await service.createOffer(
        {
          commodityId: 'comm-bayam',
          quantityAvailable: 40.0,
          harvestDate: '2026-10-12',
          askingPrice: 8000,
        },
        'user-supp-1',
      );

      expect(res.id).toBe('off-1');
      expect(prisma.supplyOffer.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUPPLY_OFFER_CREATED',
        }),
      );
    });
  });

  describe('Invarian Kuantitas Stok (INSUFFICIENT_STOCK)', () => {
    it('menolak penurunan quantityAvailable di bawah quantityReserved (contoh: punya reservasi 40 kg, diubah ke 30 kg)', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);

      // Stok memiliki 40 kg tereservasi untuk pesanan
      prisma.supplyOffer.findUnique.mockResolvedValue({
        id: 'off-1',
        supplierId: mockSupplierProfile.id,
        commodityId: 'comm-bayam',
        quantityAvailable: 50.0,
        quantityReserved: 40.0,
        askingPrice: 8000,
        status: OfferStatus.ACTIVE,
      });

      await expect(
        service.updateOffer(
          'off-1',
          { quantityAvailable: 30.0 }, // Coba turunkan ke 30 < 40
          'user-supp-1',
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.updateOffer(
          'off-1',
          { quantityAvailable: 30.0 },
          'user-supp-1',
        );
      } catch (err: any) {
        expect(err.response.code).toBe('INSUFFICIENT_STOCK');
        expect(err.response.message).toContain('40 kg');
      }
    });
  });

  describe('Pembatalan Penawaran Stok Pasokan', () => {
    it('menolak pembatalan jika stok masih memiliki kuantitas tereservasi (quantityReserved > 0)', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);
      prisma.supplyOffer.findUnique.mockResolvedValue({
        id: 'off-1',
        supplierId: mockSupplierProfile.id,
        quantityReserved: 10.0, // Masih ada reservasi
        status: OfferStatus.ACTIVE,
      });

      await expect(
        service.cancelOffer('off-1', 'user-supp-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('berhasil membatalkan penawaran jika tidak ada reservasi aktif (quantityReserved = 0)', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);
      prisma.supplyOffer.findUnique.mockResolvedValue({
        id: 'off-1',
        supplierId: mockSupplierProfile.id,
        quantityReserved: 0,
        status: OfferStatus.ACTIVE,
      });

      prisma.supplyOffer.update.mockResolvedValue({
        id: 'off-1',
        status: OfferStatus.CANCELLED,
      });

      const res = await service.cancelOffer('off-1', 'user-supp-1');
      expect(res.message).toContain('berhasil dibatalkan');
      expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
        where: { id: 'off-1' },
        data: { status: OfferStatus.CANCELLED },
      });
    });
  });

  describe('Rencana Panen (HarvestPlan) & Kalender Kolektif (T7.2 & docs/06 M3)', () => {
    it('berhasil membuat rencana panen untuk pemasok', async () => {
      prisma.supplierProfile.findUnique.mockResolvedValue(mockSupplierProfile);
      prisma.commodity.findUnique.mockResolvedValue(mockCommodityBayam);
      prisma.harvestPlan.create.mockImplementation(({ data }: any) => ({
        id: 'plan-1',
        ...data,
        commodity: mockCommodityBayam,
      }));

      const plan = await service.createHarvestPlan(
        {
          commodityId: 'comm-bayam',
          expectedQuantity: 150.0,
          expectedHarvestDate: '2026-10-25',
          notes: 'Varietas bayam hijau cabut',
        },
        'user-supp-1',
      );

      expect(plan.id).toBe('plan-1');
      expect(plan.expectedQuantity).toBe(150.0);
      expect(prisma.harvestPlan.create).toHaveBeenCalled();
    });

    it('menghitung kalender panen dan melabeli status Kurang (ratio < 0.8) sesuai kriteria docs/06 M3', async () => {
      // Kriteria penerimaan docs/06 M3:
      // Demand 100 kg dan supply 70 kg -> ratio 0.70 < 0.80 -> status "DEFICIT" / "Kurang"
      const now = new Date();
      prisma.commodity.findMany.mockResolvedValue([mockCommodityBayam]);

      // Demand 100 kg
      prisma.demandRequest.findMany.mockResolvedValue([
        {
          id: 'dem-1',
          commodityId: 'comm-bayam',
          neededDate: now,
          quantity: 100.0,
        },
      ]);

      // Supply 70 kg (Offer 50 kg + Plan 20 kg)
      prisma.supplyOffer.findMany.mockResolvedValue([
        {
          id: 'off-1',
          commodityId: 'comm-bayam',
          harvestDate: now,
          quantityAvailable: 50.0,
          quantityReserved: 0,
        },
      ]);

      prisma.harvestPlan.findMany.mockResolvedValue([
        {
          id: 'plan-1',
          commodityId: 'comm-bayam',
          expectedHarvestDate: now,
          expectedQuantity: 20.0,
        },
      ]);

      const calendar = await service.getHarvestCalendar({ weeks: 4 });

      expect(calendar.commodities).toHaveLength(1);
      const bayamWeeks = calendar.commodities[0].weeks;
      // Minggu pertama (berisi hari ini)
      const currentWeek = bayamWeeks[0];
      expect(currentWeek.demandKg).toBe(100.0);
      expect(currentWeek.supplyKg).toBe(70.0);
      expect(currentWeek.ratio).toBe(0.7);
      expect(currentWeek.status).toBe('DEFICIT');
      expect(currentWeek.statusLabel).toBe('Kurang');
    });
  });
});
