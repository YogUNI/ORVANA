import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerStage } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('LedgerService Invariant Tests (docs/04 Bagian 7)', () => {
  let service: LedgerService;
  let prisma: any;
  let audit: any;

  const mockOrder = {
    id: 'ord-123',
    orderNo: 'ORD-20261014-0001',
    quantity: 40,
    pricePerUnit: 8000,
    ledger: [],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
      ledgerEntry: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  it('harus berhasil mencatat entri HOLD pertama kali (40 kg @ 8.000 = Rp 320.000)', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      ledger: [],
    });

    prisma.ledgerEntry.create.mockImplementation(({ data }: any) => ({
      id: 'entry-hold-1',
      ...data,
      createdAt: new Date(),
    }));

    const result = await service.record({
      orderId: 'ord-123',
      stage: LedgerStage.HOLD,
      amount: 320000,
      note: 'Pencadangan dana order ORD-20261014-0001',
      userId: 'user-sup-1',
    });

    expect(result.stage).toBe(LedgerStage.HOLD);
    expect(result.amount).toBe(320000);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LEDGER_HOLD',
        entity: 'LedgerEntry',
      }),
    );
  });

  it('harus menolak pembuatan HOLD kedua untuk order yang sama', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      ledger: [
        { id: 'h1', stage: LedgerStage.HOLD, amount: 320000 },
      ],
    });

    await expect(
      service.record({
        orderId: 'ord-123',
        stage: LedgerStage.HOLD,
        amount: 320000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('harus menolak pencatatan RELEASE atau VOID jika belum ada entri HOLD', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      ledger: [],
    });

    await expect(
      service.record({
        orderId: 'ord-123',
        stage: LedgerStage.RELEASE,
        amount: 320000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('harus memvalidasi invarian: Σ RELEASE + Σ VOID tidak boleh melebihi HOLD', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      ledger: [
        { id: 'h1', stage: LedgerStage.HOLD, amount: 320000 },
        { id: 'r1', stage: LedgerStage.RELEASE, amount: 200000 },
      ],
    });

    // Sisa kuota hanya 120.000. Mencoba release 150.000 harus gagal.
    await expect(
      service.record({
        orderId: 'ord-123',
        stage: LedgerStage.RELEASE,
        amount: 150000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('harus menangani kasus skenario vektor uji QC PARTIAL: RELEASE 187.500 dan VOID 30.000', async () => {
    // Skenario S2: 29 kg @ Rp 7.500 = HOLD 217.500. Diterima 25 kg (187.500), ditolak 4 kg (30.000). Total = 217.500.
    const orderWithPartial = {
      ...mockOrder,
      ledger: [
        { id: 'h2', stage: LedgerStage.HOLD, amount: 217500 },
      ],
    };

    prisma.order.findUnique.mockResolvedValue(orderWithPartial);
    prisma.ledgerEntry.create.mockImplementation(({ data }: any) => ({
      id: `entry-${data.stage}`,
      ...data,
      createdAt: new Date(),
    }));

    // Record RELEASE 187.500
    const releaseEntry = await service.record({
      orderId: 'ord-123',
      stage: LedgerStage.RELEASE,
      amount: 187500,
    });
    expect(releaseEntry.amount).toBe(187500);

    // Update state order
    orderWithPartial.ledger.push({ id: 'r2', stage: LedgerStage.RELEASE, amount: 187500 } as any);

    // Record VOID 30.000
    const voidEntry = await service.record({
      orderId: 'ord-123',
      stage: LedgerStage.VOID,
      amount: 30000,
    });
    expect(voidEntry.amount).toBe(30000);
    orderWithPartial.ledger.push({ id: 'v2', stage: LedgerStage.VOID, amount: 30000 } as any);

    // Verifikasi ringkasan saldo seimbang
    const summary = await service.getSummary('ord-123');
    expect(summary.holdAmount).toBe(217500);
    expect(summary.totalReleased).toBe(187500);
    expect(summary.totalVoid).toBe(30000);
    expect(summary.effectiveReleased).toBe(187500);
    expect(summary.effectiveVoid).toBe(30000);
    expect(summary.isBalanced).toBe(true);
  });

  it('harus memvalidasi penyesuaian sengketa (ADJUSTMENT) tidak membuat saldo efektif negatif', async () => {
    // HOLD 100.000, RELEASE 100.000, VOID 0.
    // Jika ADJUSTMENT -150.000, effectiveReleased menjadi -50.000 (tidak valid).
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      ledger: [
        { id: 'h1', stage: LedgerStage.HOLD, amount: 100000 },
        { id: 'r1', stage: LedgerStage.RELEASE, amount: 100000 },
      ],
    });

    await expect(
      service.record({
        orderId: 'ord-123',
        stage: LedgerStage.ADJUSTMENT,
        amount: -150000,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
