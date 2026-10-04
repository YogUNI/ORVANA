import { Test, TestingModule } from '@nestjs/testing';
import { QcService } from './qc.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { LedgerService } from '../ledger/ledger.service';
import { OrderStatus, QcResult, LedgerStage, Role } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('QcService Unit Tests with Test Vectors (docs/09 Bagian 6 & Gate 5)', () => {
  let service: QcService;
  let prisma: any;
  let audit: any;
  let settings: any;
  let ledger: any;

  const mockInspectorUser = {
    sub: 'user-qc-1',
    email: 'ahli.gizi@orvana.local',
    role: Role.QUALITY_INSPECTOR,
    status: 'ACTIVE' as const,
    regionId: 'reg-bogor',
    tokenVersion: 1,
  };

  const mockKitchenUser = {
    sub: 'user-kitchen-1',
    email: 'dapur.sukajaya@orvana.local',
    role: Role.KITCHEN_MANAGER,
    status: 'ACTIVE' as const,
    regionId: 'reg-bogor',
    tokenVersion: 1,
  };

  // Mock Batch dan Order untuk Skenario Bayam S1 (40 kg @ 8.000)
  const mockBatchS1 = {
    id: 'batch-s1',
    batchCode: 'ORV-20261014-DPR01-0001',
    orderId: 'ord-s1',
    shippedQuantity: 40.0,
    receivedQuantity: 40.0,
    qualityChecks: [],
    order: {
      id: 'ord-s1',
      orderNo: 'ORD-20261014-0001',
      kitchenId: 'kitchen-a',
      supplierId: 'sup-s1',
      quantity: 40.0,
      pricePerUnit: 8000,
      status: OrderStatus.RECEIVED,
      kitchen: { managerId: 'user-kitchen-1' },
      commodity: {
        name: 'Bayam Hijau Segar',
        qualityStandard: {
          passScore: 70,
          checklist: [
            { key: 'freshness', weight: 40 },
            { key: 'physicalCondition', weight: 25 },
            { key: 'sizeUniformity', weight: 15 },
            { key: 'cleanliness', weight: 10 },
            { key: 'handlingTemperature', weight: 10 },
          ],
        },
      },
      supplier: {
        id: 'sup-s1',
        qualityScore: 88.0,
      },
      ledger: [
        { id: 'l1', stage: LedgerStage.HOLD, amount: 320000 },
      ],
    },
  };

  // Mock Batch dan Order untuk Skenario Bayam S2 (29 kg @ 7.500)
  const mockBatchS2 = {
    id: 'batch-s2',
    batchCode: 'ORV-20261014-DPR01-0002',
    orderId: 'ord-s2',
    shippedQuantity: 29.0,
    receivedQuantity: 29.0,
    qualityChecks: [],
    order: {
      id: 'ord-s2',
      orderNo: 'ORD-20261014-0002',
      kitchenId: 'kitchen-a',
      supplierId: 'sup-s2',
      quantity: 29.0,
      pricePerUnit: 7500,
      status: OrderStatus.RECEIVED,
      kitchen: { managerId: 'user-kitchen-1' },
      commodity: {
        name: 'Bayam Hijau Segar',
        qualityStandard: {
          passScore: 70,
          checklist: [
            { key: 'freshness', weight: 40 },
            { key: 'physicalCondition', weight: 25 },
            { key: 'sizeUniformity', weight: 15 },
            { key: 'cleanliness', weight: 10 },
            { key: 'handlingTemperature', weight: 10 },
          ],
        },
      },
      supplier: {
        id: 'sup-s2',
        qualityScore: 80.0,
      },
      ledger: [
        { id: 'l2', stage: LedgerStage.HOLD, amount: 217500 },
      ],
    },
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      batch: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      qualityCheck: {
        create: jest.fn(),
      },
      supplierProfile: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    settings = {
      getSetting: jest.fn().mockImplementation((key, defaultVal) => {
        if (key === 'receive.discrepancyTolerancePct') return Promise.resolve(2);
        if (key === 'supplier.qualityEmaAlpha') return Promise.resolve(0.2);
        return Promise.resolve(defaultVal);
      }),
    };

    ledger = {
      record: jest.fn().mockResolvedValue({ id: 'led-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: SettingsService, useValue: settings },
        { provide: LedgerService, useValue: ledger },
      ],
    }).compile();

    service = module.get<QcService>(QcService);
  });

  describe('receiveOrder (Penerimaan Dapur)', () => {
    it('harus berhasil mencatat penerimaan jika selisih dalam batas toleransi (40 kg diterima penuh)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-s1',
        status: OrderStatus.IN_TRANSIT,
        kitchen: { managerId: 'user-kitchen-1' },
        batch: { id: 'batch-s1', batchCode: 'ORV-001', shippedQuantity: 40.0 },
      });

      prisma.batch.update.mockResolvedValue({ id: 'batch-s1', receivedQuantity: 40.0 });
      prisma.order.update.mockResolvedValue({ id: 'ord-s1', status: OrderStatus.RECEIVED });

      const result = await service.receiveOrder(
        'ord-s1',
        { receivedQuantity: 40.0, note: 'Barang diterima lengkap dan segar' },
        mockKitchenUser,
      );

      expect(prisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'batch-s1' },
          data: expect.objectContaining({ receivedQuantity: 40.0 }),
        }),
      );

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-s1' },
          data: { status: OrderStatus.RECEIVED },
        }),
      );

      expect(result.message).toContain('Batch siap untuk pemeriksaan mutu');
    });

    it('harus menolak jika selisih penerimaan melebihi toleransi 2% tanpa catatan serah terima', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-s1',
        status: OrderStatus.IN_TRANSIT,
        kitchen: { managerId: 'user-kitchen-1' },
        batch: { id: 'batch-s1', batchCode: 'ORV-001', shippedQuantity: 40.0 },
      });

      // Shipped 40 kg, received 35 kg (selisih 12.5% > 2%) tanpa note memadai
      await expect(
        service.receiveOrder(
          'ord-s1',
          { receivedQuantity: 35.0, note: '' },
          mockKitchenUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitQualityCheck (Vektor Uji docs/09 Bagian 6)', () => {
    it('Vektor Uji Pemasok S1 (PASS): skor 90, ditolak 0 kg -> RELEASE 320.000, skor baru 88.40 (Gate 5)', async () => {
      prisma.batch.findUnique.mockResolvedValue(mockBatchS1);
      prisma.qualityCheck.create.mockImplementation(({ data }: any) => ({
        id: 'qc-s1',
        ...data,
      }));

      // Skor komponen: semua 90 -> total skor = 90
      const scores = {
        freshness: 90,
        physicalCondition: 90,
        sizeUniformity: 90,
        cleanliness: 90,
        handlingTemperature: 90,
      };

      const result = await service.submitQualityCheck(
        'batch-s1',
        {
          checklistScores: scores,
          acceptedQuantity: 40.0,
          rejectedQuantity: 0.0,
          notes: 'Mutu bayam sangat prima dan segar optimal',
        },
        mockInspectorUser,
      );

      // Verifikasi skor dan hasil
      expect(result.qualityCheck.score).toBe(90);
      expect(result.qualityCheck.result).toBe(QcResult.PASS);
      expect(result.orderStatus).toBe(OrderStatus.PAID);

      // Verifikasi efek Ledger: RELEASE Rp 320.000 penuh (40 kg * 8.000)
      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-s1',
          stage: LedgerStage.RELEASE,
          amount: 320000,
        }),
        expect.anything(),
      );

      // Verifikasi pembaruan skor mutu pemasok EMA: (0.8 * 88.0) + (0.2 * 90) = 70.4 + 18.0 = 88.40
      expect(result.newSupplierQualityScore).toBe(88.40);
      expect(prisma.supplierProfile.update).toHaveBeenCalledWith({
        where: { id: 'sup-s1' },
        data: { qualityScore: 88.40 },
      });
    });

    it('Vektor Uji Pemasok S2 (PARTIAL): diterima 25 kg, ditolak 4 kg -> RELEASE 187.500 dan VOID 30.000, skor baru 78.40 (Gate 5)', async () => {
      prisma.batch.findUnique.mockResolvedValue(mockBatchS2);
      prisma.qualityCheck.create.mockImplementation(({ data }: any) => ({
        id: 'qc-s2',
        ...data,
      }));

      // Skor komponen: rata-rata 72
      const scores = {
        freshness: 72,
        physicalCondition: 72,
        sizeUniformity: 72,
        cleanliness: 72,
        handlingTemperature: 72,
      };

      const result = await service.submitQualityCheck(
        'batch-s2',
        {
          checklistScores: scores,
          acceptedQuantity: 25.0,
          rejectedQuantity: 4.0,
          notes: 'Terdapat 4 kg daun menguning dan layu di bagian bawah karung',
        },
        mockInspectorUser,
      );

      expect(result.qualityCheck.score).toBe(72);
      expect(result.qualityCheck.result).toBe(QcResult.PARTIAL);
      expect(result.orderStatus).toBe(OrderStatus.PAID);

      // Verifikasi efek Ledger S2:
      // RELEASE: 25 kg * Rp 7.500 = Rp 187.500
      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-s2',
          stage: LedgerStage.RELEASE,
          amount: 187500,
        }),
        expect.anything(),
      );

      // VOID: 4 kg * Rp 7.500 = Rp 30.000 (atau HOLD 217.500 - RELEASE 187.500 = 30.000)
      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-s2',
          stage: LedgerStage.VOID,
          amount: 30000,
        }),
        expect.anything(),
      );

      // Verifikasi skor mutu pemasok S2 EMA: (0.8 * 80.0) + (0.2 * 72) = 64.0 + 14.4 = 78.40
      expect(result.newSupplierQualityScore).toBe(78.40);
      expect(prisma.supplierProfile.update).toHaveBeenCalledWith({
        where: { id: 'sup-s2' },
        data: { qualityScore: 78.40 },
      });
    });

    it('harus menolak (409) jika QC diajukan dua kali untuk batch yang sama (satu QC final)', async () => {
      const alreadyCheckedBatch = {
        ...mockBatchS1,
        qualityChecks: [{ id: 'qc-existing' }],
      };
      prisma.batch.findUnique.mockResolvedValue(alreadyCheckedBatch);

      await expect(
        service.submitQualityCheck(
          'batch-s1',
          {
            checklistScores: { freshness: 85 },
            acceptedQuantity: 40.0,
            rejectedQuantity: 0.0,
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('harus menolak (400) jika acceptedQuantity + rejectedQuantity tidak sama dengan receivedQuantity', async () => {
      prisma.batch.findUnique.mockResolvedValue(mockBatchS1); // received = 40.0

      await expect(
        service.submitQualityCheck(
          'batch-s1',
          {
            checklistScores: { freshness: 85 },
            acceptedQuantity: 30.0,
            rejectedQuantity: 5.0, // total 35 != 40
            notes: 'Catatan cukup panjang untuk pengujian',
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak (422) jika skor < passScore (70) tetapi rejectedQuantity = 0', async () => {
      prisma.batch.findUnique.mockResolvedValue(mockBatchS1);

      // Nilai 60 < passScore (70)
      const lowScores = {
        freshness: 60,
        physicalCondition: 60,
        sizeUniformity: 60,
        cleanliness: 60,
        handlingTemperature: 60,
      };

      await expect(
        service.submitQualityCheck(
          'batch-s1',
          {
            checklistScores: lowScores,
            acceptedQuantity: 40.0,
            rejectedQuantity: 0.0,
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
