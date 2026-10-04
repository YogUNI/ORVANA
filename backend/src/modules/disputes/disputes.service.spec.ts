import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
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
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('DisputesService (T7.1 & docs/06 M8 & docs/04 Bagian 8)', () => {
  let service: DisputesService;
  let prisma: any;
  let audit: any;
  let ledger: any;
  let settings: any;

  const mockKitchenUser = {
    sub: 'user-km-1',
    email: 'dapur01@orvana.local',
    role: Role.KITCHEN_MANAGER,
    regionId: 'reg-sleman',
    status: 'ACTIVE' as const,
    tokenVersion: 1,
  };

  const mockSupplierUser = {
    sub: 'user-sup-1',
    email: 'petani01@orvana.local',
    role: Role.SUPPLIER,
    regionId: 'reg-sleman',
    status: 'ACTIVE' as const,
    tokenVersion: 1,
  };

  const mockAdminUser = {
    sub: 'user-admin-1',
    email: 'admin@orvana.local',
    role: Role.ADMIN,
    regionId: null,
    status: 'ACTIVE' as const,
    tokenVersion: 1,
  };

  const mockOrderWithQc = {
    id: 'ord-dispute-test',
    orderNo: 'ORD-20261014-9999',
    quantity: 30.0,
    pricePerUnit: 7500,
    status: OrderStatus.PAID,
    kitchen: { managerId: 'user-km-1' },
    supplier: { userId: 'user-sup-1' },
    batch: {
      id: 'batch-test-1',
      batchCode: 'BAT-20261014-D01',
      receivedQuantity: 29.0, // diterima 29 kg
      qualityChecks: [
        {
          id: 'qc-1',
          acceptedQuantity: 20.0, // awalnya diterima 20 kg
          rejectedQuantity: 9.0, // ditolak 9 kg
          checkedAt: new Date(Date.now() - 5 * 3600 * 1000), // 5 jam lalu (masih dalam 48 jam)
        },
      ],
    },
    ledger: [
      { id: 'h1', stage: LedgerStage.HOLD, amount: 225000 }, // 30 * 7500
      { id: 'r1', stage: LedgerStage.RELEASE, amount: 150000 }, // 20 * 7500
      { id: 'v1', stage: LedgerStage.VOID, amount: 75000 },
    ],
    disputes: [],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      dispute: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    ledger = {
      record: jest.fn().mockResolvedValue({ id: 'adj-1' }),
    };

    settings = {
      getSetting: jest.fn().mockResolvedValue(48), // 48 jam default
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: LedgerService, useValue: ledger },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  describe('createDispute', () => {
    it('harus berhasil membuat sengketa dalam jendela 48 jam dan mengubah status order menjadi DISPUTED', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderWithQc);
      prisma.dispute.create.mockImplementation(({ data }: any) => ({
        id: 'dsp-001',
        ...data,
        createdAt: new Date(),
      }));

      const result = await service.createDispute(
        'ord-dispute-test',
        {
          reason: 'Kualitas bayam yang ditolak sebenarnya masih segar dan layak konsumsi.',
        },
        mockSupplierUser,
      );

      expect(result.id).toBe('dsp-001');
      expect(result.status).toBe(DisputeStatus.OPEN);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-dispute-test' },
        data: { status: OrderStatus.DISPUTED },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DISPUTE_CREATED' }),
      );
    });

    it('harus menolak dengan 422 bila batas jendela 48 jam telah lewat (docs/06 M8)', async () => {
      const expiredQcOrder = {
        ...mockOrderWithQc,
        batch: {
          ...mockOrderWithQc.batch,
          qualityChecks: [
            {
              id: 'qc-old',
              acceptedQuantity: 20.0,
              rejectedQuantity: 9.0,
              checkedAt: new Date(Date.now() - 50 * 3600 * 1000), // 50 jam lalu (> 48 jam)
            },
          ],
        },
      };

      prisma.order.findUnique.mockResolvedValue(expiredQcOrder);

      await expect(
        service.createDispute(
          'ord-dispute-test',
          {
            reason: 'Alasan sengketa yang terlambat diajukan lebih dari 48 jam.',
          },
          mockSupplierUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('harus menolak jika pengguna bukan pengelola dapur atau pemasok dari pesanan tersebut', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderWithQc);

      const otherUser = {
        sub: 'other-user',
        email: 'other@orvana.local',
        role: Role.SUPPLIER,
        regionId: 'reg-sleman',
        status: 'ACTIVE' as const,
        tokenVersion: 1,
      };

      await expect(
        service.createDispute(
          'ord-dispute-test',
          {
            reason: 'Alasan sengketa dari orang lain yang tidak berhak sama sekali.',
          },
          otherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resolveDispute (docs/06 M8 & docs/04 Bagian 8)', () => {
    it('harus menyelesaikan putusan SPLIT dengan adjustedAcceptedQuantity 27 kg dan mencatat ADJUSTMENT sebesar Rp 52.500', async () => {
      // Skenario kriteria penerimaan docs/06 M8:
      // Dari diterima 29 kg, awal QC accepted 20 kg (release Rp 150.000).
      // Admin putus SPLIT adjustedAcceptedQuantity = 27 kg pada harga 7.500.
      // Target release = 27 * 7.500 = Rp 202.500.
      // Selisih adjustment = 202.500 - 150.000 = +52.500.
      const mockDispute = {
        id: 'dsp-001',
        orderId: 'ord-dispute-test',
        status: DisputeStatus.UNDER_REVIEW,
        order: mockOrderWithQc,
      };

      prisma.dispute.findUnique.mockResolvedValue(mockDispute);
      prisma.dispute.update.mockImplementation(({ data }: any) => ({
        id: 'dsp-001',
        ...data,
      }));
      prisma.order.update.mockResolvedValue({
        ...mockOrderWithQc,
        status: OrderStatus.PAID,
      });

      const result = await service.resolveDispute(
        'dsp-001',
        {
          outcome: DisputeOutcome.SPLIT,
          adjustedAcceptedQuantity: 27.0,
          resolutionNote: 'Disepakati kompromi kuantitas layak konsumsi 27 kg.',
        },
        mockAdminUser,
      );

      expect(result.status).toBe(DisputeStatus.RESOLVED);
      expect(result.outcome).toBe(DisputeOutcome.SPLIT);
      expect(result.adjustedAcceptedQuantity).toBe(27.0);

      // Verifikasi pemanggilan Ledger ADJUSTMENT
      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-dispute-test',
          stage: LedgerStage.ADJUSTMENT,
          amount: 52500, // 202.500 - 150.000
        }),
        prisma,
      );

      // Verifikasi order kembali ke PAID
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-dispute-test' },
        data: { status: OrderStatus.PAID },
      });
    });

    it('harus menyelesaikan putusan FAVOR_SUPPLIER dengan kuantitas penuh tiba di dapur (29 kg)', async () => {
      // Tiba 29 kg, harga 7.500. Target release = 29 * 7.500 = Rp 217.500.
      // Penyesuaian = 217.500 - 150.000 = +67.500.
      const mockDispute = {
        id: 'dsp-002',
        orderId: 'ord-dispute-test',
        status: DisputeStatus.UNDER_REVIEW,
        order: mockOrderWithQc,
      };

      prisma.dispute.findUnique.mockResolvedValue(mockDispute);
      prisma.dispute.update.mockImplementation(({ data }: any) => ({
        id: 'dsp-002',
        ...data,
      }));

      await service.resolveDispute(
        'dsp-002',
        {
          outcome: DisputeOutcome.FAVOR_SUPPLIER,
          resolutionNote: 'Mutu fisik terbukti baik, pemasok berhak menerima kuantitas penuh tiba.',
        },
        mockAdminUser,
      );

      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-dispute-test',
          stage: LedgerStage.ADJUSTMENT,
          amount: 67500, // 217.500 - 150.000
        }),
        prisma,
      );
    });

    it('harus menyelesaikan putusan FAVOR_KITCHEN tanpa membuat mutasi ADJUSTMENT (kuantitas tetap)', async () => {
      const mockDispute = {
        id: 'dsp-003',
        orderId: 'ord-dispute-test',
        status: DisputeStatus.UNDER_REVIEW,
        order: mockOrderWithQc,
      };

      prisma.dispute.findUnique.mockResolvedValue(mockDispute);
      prisma.dispute.update.mockImplementation(({ data }: any) => ({
        id: 'dsp-003',
        ...data,
      }));

      await service.resolveDispute(
        'dsp-003',
        {
          outcome: DisputeOutcome.FAVOR_KITCHEN,
          resolutionNote: 'Hasil inspeksi QC awal terbukti valid dan akurat.',
        },
        mockAdminUser,
      );

      // Kuantitas tetap 20 kg -> adjustmentNeeded = 0 -> ledger.record tidak dipanggil
      expect(ledger.record).not.toHaveBeenCalled();
    });
  });
});
