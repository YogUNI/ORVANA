import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerStage, OrderStatus, QcResult } from '@prisma/client';

describe('DashboardService - Impact Metrics Test Vectors (docs/09 section 7)', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  // Mock data presisi 6 order historis (H1 s.d. H6) dari docs/09 bagian 7:
  // Dapur A: lat=-6.9175, lon=107.6191, regionId='reg-1'
  // S1 (Bayam): lat=-6.8800, lon=107.6000 (jarak 6 km), qty=50, price=8000, ref=8000, accepted=50, rejected=0, PASS, RELEASE=400.000, onTime=1
  // S5 (Lele): lat=-6.7500, lon=107.6100 (jarak 20 km), qty=70, price=31000, ref=30000, accepted=70, rejected=0, PASS, RELEASE=2.170.000, onTime=1
  // S6 (Telur): lat=-7.1000, lon=107.5000 (jarak 25 km), qty=60, price=28000, ref=28000, accepted=55, rejected=5, PARTIAL, RELEASE=1.540.000, VOID=140.000, onTime=0
  // S2 (Wortel): lat=-6.8000, lon=107.6500 (jarak 14 km), qty=40, price=12500, ref=12000, accepted=40, rejected=0, PASS, RELEASE=500.000, onTime=1
  // S7 (Tempe): lat=-6.8500, lon=107.6200 (jarak 10 km), qty=50, price=22000, ref=22000, accepted=0, rejected=50, FAIL, VOID=1.100.000, onTime=1
  // S8 (Beras): lat=-6.7800, lon=107.6800 (jarak 18 km), qty=80, price=14000, ref=14000, accepted=80, rejected=0, PASS, RELEASE=1.120.000, onTime=1

  const mockKitchen = {
    id: 'k-1',
    code: 'DPR01',
    name: 'Dapur Gizi Sehat Bandung 01',
    latitude: -6.9175,
    longitude: 107.6191,
    regionId: 'reg-1',
  };

  const createMockOrder = (
    orderNo: string,
    supId: string,
    supLat: number,
    supLon: number,
    commodityId: string,
    qty: number,
    price: number,
    acceptedQty: number,
    rejectedQty: number,
    qcResult: QcResult,
    releaseAmt: number,
    voidAmt: number,
    isOnTime: boolean,
  ) => {
    const arrivedAt = new Date('2026-10-01T08:00:00Z');
    const neededDate = isOnTime
      ? new Date('2026-10-01T10:00:00Z')
      : new Date('2026-09-30T10:00:00Z'); // telat jika neededDate lebih dulu dari tiba

    return {
      id: `ord-${orderNo}`,
      orderNo,
      supplierId: supId,
      kitchenId: mockKitchen.id,
      commodityId,
      quantity: qty,
      pricePerUnit: price,
      status: OrderStatus.COMPLETED,
      createdAt: new Date('2026-10-01T06:00:00Z'),
      kitchen: mockKitchen,
      supplier: {
        id: supId,
        regionId: 'reg-1',
        latitude: supLat,
        longitude: supLon,
      },
      demand: {
        id: `dem-${orderNo}`,
        quantity: qty,
        neededDate,
      },
      shipment: {
        id: `shp-${orderNo}`,
        arrivedAt,
        lossKg: 0,
      },
      batch: {
        id: `batch-${orderNo}`,
        batchCode: `ORV-20261001-DPR01-${orderNo}`,
        qualityChecks: [
          {
            score: qcResult === QcResult.PASS ? 88 : qcResult === QcResult.PARTIAL ? 72 : 50,
            result: qcResult,
            acceptedQuantity: acceptedQty,
            rejectedQuantity: rejectedQty,
            receivedQuantity: acceptedQty + rejectedQty,
            checkedAt: new Date('2026-10-01T09:00:00Z'),
          },
        ],
      },
      ledger: [
        { stage: LedgerStage.HOLD, amount: qty * price },
        ...(releaseAmt > 0 ? [{ stage: LedgerStage.RELEASE, amount: releaseAmt }] : []),
        ...(voidAmt > 0 ? [{ stage: LedgerStage.VOID, amount: voidAmt }] : []),
      ],
    };
  };

  const mockOrders = [
    // H1
    createMockOrder('H1', 'S1', -6.88, 107.6, 'c-bayam', 50, 8000, 50, 0, QcResult.PASS, 400000, 0, true),
    // H2
    createMockOrder('H2', 'S5', -6.75, 107.61, 'c-lele', 70, 31000, 70, 0, QcResult.PASS, 2170000, 0, true),
    // H3
    createMockOrder('H3', 'S6', -7.1, 107.5, 'c-telur', 60, 28000, 55, 5, QcResult.PARTIAL, 1540000, 140000, false),
    // H4
    createMockOrder('H4', 'S2', -6.8, 107.65, 'c-wortel', 40, 12500, 40, 0, QcResult.PASS, 500000, 0, true),
    // H5
    createMockOrder('H5', 'S7', -6.85, 107.62, 'c-tempe', 50, 22000, 0, 50, QcResult.FAIL, 0, 1100000, true),
    // H6
    createMockOrder('H6', 'S8', -6.78, 107.68, 'c-beras', 80, 14000, 80, 0, QcResult.PASS, 1120000, 0, true),
  ];

  const mockDemands = mockOrders.map((o) => o.demand);

  const mockPriceReferences = [
    { commodityId: 'c-bayam', regionId: 'reg-1', referencePrice: 8000 },
    { commodityId: 'c-lele', regionId: 'reg-1', referencePrice: 30000 },
    { commodityId: 'c-telur', regionId: 'reg-1', referencePrice: 28000 },
    { commodityId: 'c-wortel', regionId: 'reg-1', referencePrice: 12000 },
    { commodityId: 'c-tempe', regionId: 'reg-1', referencePrice: 22000 },
    { commodityId: 'c-beras', regionId: 'reg-1', referencePrice: 14000 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            order: { findMany: jest.fn().mockResolvedValue(mockOrders) },
            demandRequest: { findMany: jest.fn().mockResolvedValue(mockDemands) },
            priceReference: { findMany: jest.fn().mockResolvedValue(mockPriceReferences) },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('harus menghitung 9 metrik dampak persis sesuai tabel vektor uji docs/09 bagian 7', async () => {
    const metrics = await service.getImpactMetrics({});

    // 1. Nilai belanja lokal: 400k + 2.17m + 1.54m + 500k + 0 + 1.12m = Rp 5.730.000
    expect(metrics.localSpendingRupiah).toBe(5730000);

    // 2. Produsen terlibat: 5 (S1, S5, S6, S2, S8; S7 tidak dihitung karena RELEASE 0)
    expect(metrics.producersInvolved).toBe(5);

    // 3. Tingkat pemenuhan: 295 / 350 = 84.29%
    expect(metrics.fulfillmentRatePct).toBe(84.29);

    // 4. Tingkat penolakan: 55 / 350 = 15.71%
    expect(metrics.rejectionRatePct).toBe(15.71);

    // 5. Tingkat lolos mutu: 4 PASS dari 6 batch = 66.67%
    expect(metrics.qualityPassRatePct).toBe(66.67);

    // 6. Ketepatan waktu: 5 dari 6 order tiba tepat waktu = 83.33%
    expect(metrics.onTimeDeliveryPct).toBe(83.33);

    // 7. Nilai tertahan (escrow): semua order tuntas = Rp 0
    expect(metrics.escrowHoldRupiah).toBe(0);

    // 8. Meta kuantitas
    expect(metrics.meta.totalDemandKg).toBe(350);
    expect(metrics.meta.totalAcceptedKg).toBe(295);
    expect(metrics.meta.totalRejectedKg).toBe(55);
  });

  it('harus menghasilkan ringkasan publik getPublicImpactSummary dengan benar', async () => {
    const summary = await service.getPublicImpactSummary();
    expect(summary.localSpendingRupiah).toBe(5730000);
    expect(summary.producersInvolved).toBe(5);
    expect(summary.totalDeliveredKg).toBe(295);
    expect(summary.qualityPassRatePct).toBe(66.67);
  });
});
