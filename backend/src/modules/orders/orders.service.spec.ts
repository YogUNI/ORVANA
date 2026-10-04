import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService, VALID_ORDER_TRANSITIONS } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from '../ledger/ledger.service';
import { MatchingService } from '../matching/matching.service';
import { OrderStatus, LedgerStage, Role } from '@prisma/client';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('OrdersService (docs/06 M4 & docs/03 Bagian 2)', () => {
  let service: OrdersService;
  let prisma: any;
  let audit: any;
  let ledger: any;
  let matching: any;

  const mockSupplierUser = {
    sub: 'user-sup-1',
    email: 'tani.subur@orvana.local',
    role: Role.SUPPLIER,
    status: 'ACTIVE' as const,
    regionId: 'reg-bogor',
    tokenVersion: 1,
  };

  const mockOtherSupplierUser = {
    sub: 'user-sup-other',
    email: 'other@orvana.local',
    role: Role.SUPPLIER,
    status: 'ACTIVE' as const,
    regionId: 'reg-bogor',
    tokenVersion: 1,
  };

  const mockOrderProposed = {
    id: 'ord-bayam-s1',
    orderNo: 'ORD-20261014-0001',
    demandId: 'demand-bayam-69',
    offerId: 'offer-s1',
    supplierId: 'sup-s1',
    kitchenId: 'kitchen-a',
    commodityId: 'comm-bayam',
    quantity: 40.0,
    pricePerUnit: 8000,
    matchScore: 88.97,
    status: OrderStatus.PROPOSED,
    offerExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // Belum kedaluwarsa
    supplier: {
      id: 'sup-s1',
      userId: 'user-sup-1',
      displayName: 'Kelompok Tani Subur',
    },
    offer: {
      id: 'offer-s1',
      quantityReserved: 40.0,
    },
    kitchen: {
      id: 'kitchen-a',
      managerId: 'user-kitchen-1',
    },
    ledger: [],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      supplyOffer: {
        update: jest.fn(),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      supplierProfile: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    ledger = {
      record: jest.fn().mockResolvedValue({ id: 'led-1', stage: LedgerStage.HOLD }),
    };

    matching = {
      matchAndAllocate: jest.fn().mockResolvedValue({ message: 'Alokasi ulang dipicu' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: LedgerService, useValue: ledger },
        { provide: MatchingService, useValue: matching },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('accept', () => {
    it('harus menerima order PROPOSED, mengubah status menjadi ACCEPTED, dan mencatat HOLD = Rp 320.000', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderProposed);
      prisma.order.update.mockImplementation(({ data }: any) => ({
        ...mockOrderProposed,
        ...data,
      }));

      const result = await service.accept('ord-bayam-s1', mockSupplierUser);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-bayam-s1' },
          data: expect.objectContaining({
            status: OrderStatus.ACCEPTED,
          }),
        }),
      );

      // Verifikasi pencatatan HOLD pada ledger (40 kg * 8.000 = Rp 320.000)
      expect(ledger.record).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-bayam-s1',
          stage: LedgerStage.HOLD,
          amount: 320000,
        }),
        expect.anything(),
      );

      expect(result.order.status).toBe(OrderStatus.ACCEPTED);
      expect(result.order.holdAmount).toBe(320000);
    });

    it('harus menolak (403) jika pemasok mencoba menerima pesanan milik pemasok lain', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderProposed);

      await expect(
        service.accept('ord-bayam-s1', mockOtherSupplierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('harus menolak jika batas waktu offerExpiresAt telah terlewati', async () => {
      const expiredOrder = {
        ...mockOrderProposed,
        offerExpiresAt: new Date(Date.now() - 3600 * 1000), // 1 jam lalu
      };
      prisma.order.findUnique.mockResolvedValue(expiredOrder);

      await expect(
        service.accept('ord-bayam-s1', mockSupplierUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('harus menolak order PROPOSED, melepas reservasi pada stok, dan memicu alokasi ulang', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderProposed);
      prisma.order.update.mockResolvedValue({
        ...mockOrderProposed,
        status: OrderStatus.REJECTED,
      });

      const result = await service.reject(
        'ord-bayam-s1',
        { reason: 'Stok terkena hama parsial' },
        mockSupplierUser,
      );

      // Status order berubah ke REJECTED
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-bayam-s1' },
          data: expect.objectContaining({
            status: OrderStatus.REJECTED,
            rejectionReason: 'Stok terkena hama parsial',
          }),
        }),
      );

      // Reservasi pada stok dikurangi sebesar kuantitas order (40 kg)
      expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-s1' },
        data: {
          quantityReserved: { decrement: 40.0 },
        },
      });

      // Alokasi ulang dipanggil secara otomatis untuk demand tersebut
      expect(matching.matchAndAllocate).toHaveBeenCalledWith(
        'demand-bayam-69',
        mockSupplierUser.sub,
        mockSupplierUser.role,
        undefined,
        undefined,
      );

      expect(result.message).toContain('ditolak dan kuantitas dialokasikan ulang');
    });
  });

  describe('exportOrdersCsv (docs/06 M10 P1)', () => {
    it('menghasilkan string CSV ber-BOM dengan header dan data yang rapi', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          orderNo: 'ORD-001',
          createdAt: new Date('2026-10-12'),
          commodity: { name: 'Bayam', category: 'SAYURAN_DAUN' },
          kitchen: { name: 'Dapur A', code: 'KIT-A' },
          supplier: { displayName: 'Pak Tani', type: 'INDIVIDUAL_FARMER' },
          quantity: 20,
          pricePerUnit: 8000,
          matchScore: 90,
          status: OrderStatus.ACCEPTED,
          batch: { batchCode: 'BAT-001' },
        },
      ]);

      const csv = await service.exportOrdersCsv({});
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Nomor Order,Tanggal Order');
      expect(csv).toContain('"ORD-001"');
      expect(csv).toContain('"Bayam"');
      expect(csv).toContain('"160000"');
    });
  });

  describe('createReview (docs/06 M10 / T7.7)', () => {
    it('berhasil mencatat review untuk order yang telah COMPLETED / PAID', async () => {
      const mockKmUser = {
        sub: 'user-km-1',
        email: 'dapur@orvana.test',
        role: Role.KITCHEN_MANAGER,
        status: 'ACTIVE' as const,
        regionId: 'reg-bogor',
        tokenVersion: 1,
      };

      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNo: 'ORD-001',
        status: OrderStatus.COMPLETED,
        supplierId: 'sup-1',
        kitchen: { managerId: 'user-km-1' },
        review: null,
      });

      prisma.$transaction.mockImplementation(async (cb: any) => {
        return cb({
          supplierReview: {
            create: jest.fn().mockResolvedValue({ id: 'rev-1', rating: 5 }),
            findMany: jest.fn().mockResolvedValue([{ rating: 5 }]),
          },
        });
      });

      const res = await service.createReview(
        'ord-1',
        { rating: 5, comment: 'Bayam segar dan mantap' },
        mockKmUser,
      );

      expect(res.id).toBe('rev-1');
      expect(res.rating).toBe(5);
    });

    it('menolak (400) jika pesanan belum diselesaikan', async () => {
      const mockKmUser = {
        sub: 'user-km-1',
        email: 'dapur@orvana.test',
        role: Role.KITCHEN_MANAGER,
        status: 'ACTIVE' as const,
        regionId: 'reg-bogor',
        tokenVersion: 1,
      };

      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNo: 'ORD-001',
        status: OrderStatus.ACCEPTED,
        supplierId: 'sup-1',
        kitchen: { managerId: 'user-km-1' },
        review: null,
      });

      await expect(
        service.createReview('ord-1', { rating: 5 }, mockKmUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
