import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import {
  DemandStatus,
  OfferStatus,
  OrderStatus,
  Role,
} from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MatchingService (docs/09 Bagian 6 & docs/04 Bagian 4)', () => {
  let service: MatchingService;
  let prisma: any;
  let audit: any;
  let settings: any;

  // Mock data skenario bayam Dapur A (kebutuhan: 69 kg)
  const mockDemand = {
    id: 'demand-bayam-69',
    kitchenId: 'kitchen-a',
    commodityId: 'comm-bayam',
    quantity: 69.0,
    neededDate: new Date('2026-10-14T06:00:00Z'),
    maxPricePerUnit: 10000,
    minQualityScore: 75,
    status: DemandStatus.OPEN,
    kitchen: {
      id: 'kitchen-a',
      name: 'Dapur Gizi Sukajaya',
      regionId: 'reg-bogor',
      latitude: -6.60,
      longitude: 106.80,
    },
    commodity: {
      id: 'comm-bayam',
      name: 'Bayam Hijau Segar',
      shelfLifeDays: 3,
    },
    orders: [],
  };

  const mockPriceRef = {
    id: 'pr-bayam',
    commodityId: 'comm-bayam',
    regionId: 'reg-bogor',
    referencePrice: 8000,
    floorPrice: 5000,
    ceilingPrice: 11000,
  };

  // Tiga pemasok kandidat sesuai docs/09 Bagian 6
  // S1: 40 kg, panen H-1 (umur 1 hari), harga Rp 8.000, mutu 88, keandalan 95%, jarak 6.0 km
  // S2: 50 kg, panen H (umur 0 hari), harga Rp 8.000, mutu 80, keandalan 80%, jarak 14.0 km
  // S3: 30 kg, panen H-2 (umur 2 hari), harga Rp 9.000, mutu 92, keandalan 90%, jarak 32.0 km
  const mockOffers = [
    {
      id: 'offer-s1',
      supplierId: 'sup-s1',
      commodityId: 'comm-bayam',
      quantityAvailable: 40.0,
      quantityReserved: 0.0,
      askingPrice: 8000,
      harvestDate: new Date('2026-10-13T06:00:00Z'), // H-1
      status: OfferStatus.ACTIVE,
      supplier: {
        id: 'sup-s1',
        displayName: 'Kelompok Tani Subur',
        village: 'Sukajaya',
        latitude: -6.546,
        longitude: 106.80,
        qualityScore: 88,
        reliabilityRate: 0.95,
        user: { status: 'ACTIVE' },
      },
    },
    {
      id: 'offer-s2',
      supplierId: 'sup-s2',
      commodityId: 'comm-bayam',
      quantityAvailable: 50.0,
      quantityReserved: 0.0,
      askingPrice: 8000,
      harvestDate: new Date('2026-10-14T06:00:00Z'), // Hari H (umur 0)
      status: OfferStatus.ACTIVE,
      supplier: {
        id: 'sup-s2',
        displayName: 'Tani Mandiri Barokah',
        village: 'Megamendung',
        latitude: -6.65,
        longitude: 106.90,
        qualityScore: 80,
        reliabilityRate: 0.80,
        user: { status: 'ACTIVE' },
      },
    },
    {
      id: 'offer-s3',
      supplierId: 'sup-s3',
      commodityId: 'comm-bayam',
      quantityAvailable: 30.0,
      quantityReserved: 0.0,
      askingPrice: 9000,
      harvestDate: new Date('2026-10-12T06:00:00Z'), // H-2 (umur 2 hari)
      status: OfferStatus.ACTIVE,
      supplier: {
        id: 'sup-s3',
        displayName: 'Berkah Alam Raya',
        village: 'Cibungbulang',
        latitude: -6.70,
        longitude: 106.60,
        qualityScore: 92,
        reliabilityRate: 0.90,
        user: { status: 'ACTIVE' },
      },
    },
  ];

  const testDistanceMap = new Map<string, number>([
    ['sup-s1', 6.0],
    ['sup-s2', 14.0],
    ['sup-s3', 32.0],
  ]);

  beforeEach(async () => {
    prisma = {
      demandRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      priceReference: {
        findFirst: jest.fn(),
      },
      supplyOffer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    settings = {
      getMatchingWeights: jest.fn().mockResolvedValue({
        distance: 0.30,
        quality: 0.30,
        price: 0.20,
        freshness: 0.10,
        reliability: 0.10,
      }),
      getSetting: jest.fn().mockImplementation((key, defaultVal) => {
        if (key === 'matching.maxRadiusKm') return Promise.resolve(50);
        if (key === 'matching.maxSharePerSupplier') return Promise.resolve(0.6);
        if (key === 'matching.minSupplierQuality') return Promise.resolve(60);
        if (key === 'order.responseWindowHours') return Promise.resolve(12);
        return Promise.resolve(defaultVal);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('findCandidates', () => {
    it('harus menemukan 3 kandidat dan mengurutkan berdasarkan skor tertinggi (S1=88.97, S2=83.60, S3=68.23)', async () => {
      prisma.demandRequest.findUnique.mockResolvedValue(mockDemand);
      prisma.priceReference.findFirst.mockResolvedValue(mockPriceRef);
      prisma.supplyOffer.findMany.mockResolvedValue(mockOffers);

      const result = await service.findCandidates('demand-bayam-69', testDistanceMap);

      expect(result.candidates).toHaveLength(3);
      expect(result.candidates[0].supplierId).toBe('sup-s1');
      expect(result.candidates[0].scoreComponents.matchScore).toBeCloseTo(88.97, 2);

      expect(result.candidates[1].supplierId).toBe('sup-s2');
      expect(result.candidates[1].scoreComponents.matchScore).toBeCloseTo(83.60, 2);

      expect(result.candidates[2].supplierId).toBe('sup-s3');
      expect(result.candidates[2].scoreComponents.matchScore).toBeCloseTo(68.23, 2);
    });

    it('harus mengecualikan pemasok yang pernah menolak (REJECTED) tawaran pada permintaan ini', async () => {
      const demandWithRejected = {
        ...mockDemand,
        orders: [
          {
            id: 'ord-prev',
            supplierId: 'sup-s1',
            status: OrderStatus.REJECTED,
          },
        ],
      };

      prisma.demandRequest.findUnique.mockResolvedValue(demandWithRejected);
      prisma.priceReference.findFirst.mockResolvedValue(mockPriceRef);
      prisma.supplyOffer.findMany.mockResolvedValue(mockOffers);

      const result = await service.findCandidates('demand-bayam-69', testDistanceMap);

      // S1 harus tereliminasi, kandidat teratas menjadi S2
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates.find((c) => c.supplierId === 'sup-s1')).toBeUndefined();
      expect(result.candidates[0].supplierId).toBe('sup-s2');
    });
  });

  describe('matchAndAllocate (Greedy Allocation & Cap 60%)', () => {
    it('harus mengalokasikan persis sesuai skenario bayam 69 kg: S1 dialokasi 40 kg, S2 dialokasi 29 kg, S3 tidak terpilih (kebutuhan sudah terpenuhi)', async () => {
      prisma.demandRequest.findUnique.mockResolvedValue(mockDemand);
      prisma.priceReference.findFirst.mockResolvedValue(mockPriceRef);
      prisma.supplyOffer.findMany.mockResolvedValue(mockOffers);

      // Mock offer saat diakses dalam transaksi
      prisma.supplyOffer.findUnique.mockImplementation(({ where }: any) => {
        const found = mockOffers.find((o) => o.id === where.id);
        return Promise.resolve(found);
      });

      prisma.order.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: `created-${data.orderNo}`,
          ...data,
          supplier: { displayName: `Pemasok ${data.supplierId}` },
          commodity: { name: 'Bayam Hijau Segar' },
        });
      });

      const allocResult = await service.matchAndAllocate(
        'demand-bayam-69',
        'user-kitchen-1',
        Role.KITCHEN_MANAGER,
        testDistanceMap,
      );

      // Kebutuhan 69 kg. Batas cap 60% = 41.4 kg.
      // S1 (skor tertinggi): stok bebas 40 kg <= 41.4 kg -> alokasi 40 kg. Sisa kebutuhan = 29 kg.
      // S2 (skor ke-2): stok bebas 50 kg, cap 41.4 kg, sisa kebutuhan 29 kg -> alokasi min(29, 50, 41.4) = 29 kg. Sisa kebutuhan = 0.
      // S3: tidak mendapatkan alokasi karena sisa kebutuhan sudah 0.
      expect(allocResult.createdOrders).toHaveLength(2);
      expect(allocResult.remainingQuantity).toBe(0);

      const order1 = allocResult.createdOrders[0];
      expect(order1.supplierId).toBe('sup-s1');
      expect(order1.quantity).toBe(40.0);
      expect(order1.status).toBe(OrderStatus.PROPOSED);

      const order2 = allocResult.createdOrders[1];
      expect(order2.supplierId).toBe('sup-s2');
      expect(order2.quantity).toBe(29.0);
      expect(order2.status).toBe(OrderStatus.PROPOSED);

      // Verifikasi kuantitas tereservasi dinaikkan
      expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-s1' },
        data: { quantityReserved: { increment: 40.0 } },
      });
      expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-s2' },
        data: { quantityReserved: { increment: 29.0 } },
      });

      // Verifikasi status DemandRequest diperbarui ke MATCHING
      expect(prisma.demandRequest.update).toHaveBeenCalledWith({
        where: { id: 'demand-bayam-69' },
        data: { status: DemandStatus.MATCHING },
      });

      // Verifikasi AuditLog dicatat
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MATCHING_ALLOCATED',
          entity: 'DemandRequest',
          entityId: 'demand-bayam-69',
        }),
      );
    });

    it('harus membatasi kuantitas alokasi ke pemasok tunggal maksimal 60% dari total demand jika stok pemasok melebihi cap', async () => {
      // Misal demand 100 kg, cap 60% = 60 kg. Pemasok S1 punya stok bebas 80 kg.
      const demand100 = {
        ...mockDemand,
        quantity: 100.0,
      };

      const offerLarge = [
        {
          id: 'offer-large',
          supplierId: 'sup-large',
          commodityId: 'comm-bayam',
          quantityAvailable: 80.0,
          quantityReserved: 0.0,
          askingPrice: 8000,
          harvestDate: new Date('2026-10-14T06:00:00Z'),
          status: OfferStatus.ACTIVE,
          supplier: {
            id: 'sup-large',
            displayName: 'Pemasok Besar',
            latitude: -6.55,
            longitude: 106.80,
            qualityScore: 90,
            reliabilityRate: 0.90,
            user: { status: 'ACTIVE' },
          },
        },
      ];

      prisma.demandRequest.findUnique.mockResolvedValue(demand100);
      prisma.priceReference.findFirst.mockResolvedValue(mockPriceRef);
      prisma.supplyOffer.findMany.mockResolvedValue(offerLarge);
      prisma.supplyOffer.findUnique.mockResolvedValue(offerLarge[0]);
      prisma.order.create.mockImplementation(({ data }: any) => ({
        id: 'ord-1',
        ...data,
        supplier: { displayName: 'Pemasok Besar' },
      }));

      const allocResult = await service.matchAndAllocate(
        'demand-bayam-69',
        'user-kitchen-1',
        Role.KITCHEN_MANAGER,
        new Map([['sup-large', 5.0]]),
      );

      expect(allocResult.createdOrders).toHaveLength(1);
      // Pemasok punya stok 80 kg, tapi dibatasi cap 60 kg (60% dari 100 kg)
      expect(allocResult.createdOrders[0].quantity).toBe(60.0);
      expect(allocResult.remainingQuantity).toBe(40.0);
    });
  });
});
