import { Test, TestingModule } from '@nestjs/testing';
import { OrderSchedulerService } from './order-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MatchingService } from '../matching/matching.service';
import { SettingsService } from '../settings/settings.service';
import { OrderStatus, Role } from '@prisma/client';

describe('OrderSchedulerService (T3.6 & T5.5 - docs/04 Bagian 9)', () => {
  let service: OrderSchedulerService;
  let prisma: any;
  let audit: any;
  let matching: any;
  let settings: any;

  const mockExpiredOrders = [
    {
      id: 'ord-exp-1',
      orderNo: 'ORD-20261014-EXP1',
      demandId: 'demand-bayam-69',
      offerId: 'offer-s1',
      supplierId: 'sup-s1',
      quantity: 40.0,
      status: OrderStatus.PROPOSED,
      offerExpiresAt: new Date(Date.now() - 3600 * 1000), // Sudah lewat 1 jam
    },
  ];

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      supplyOffer: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue(true),
    };

    matching = {
      matchAndAllocate: jest.fn().mockResolvedValue({ message: 'Alokasi ulang berhasil' }),
    };

    settings = {
      getSetting: jest.fn().mockResolvedValue(48),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSchedulerService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: MatchingService, useValue: matching },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get<OrderSchedulerService>(OrderSchedulerService);
  });

  it('harus menemukan order kedaluwarsa, mengubah status ke EXPIRED, melepas reservasi, dan memicu alokasi ulang', async () => {
    prisma.order.findMany.mockResolvedValue(mockExpiredOrders);
    prisma.order.findUnique.mockResolvedValue(mockExpiredOrders[0]);

    const result = await service.handleExpiredOffers();

    expect(result.expiredCount).toBe(1);
    expect(result.reallocatedDemands).toContain('demand-bayam-69');

    // Status order berubah ke EXPIRED
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord-exp-1' },
        data: expect.objectContaining({
          status: OrderStatus.EXPIRED,
        }),
      }),
    );

    // Kuantitas tereservasi dilepas (decrement 40)
    expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-s1' },
      data: {
        quantityReserved: { decrement: 40.0 },
      },
    });

    // Pemicu alokasi ulang untuk demand-bayam-69
    expect(matching.matchAndAllocate).toHaveBeenCalledWith(
      'demand-bayam-69',
      'SYSTEM_SCHEDULER',
      Role.ADMIN,
    );

    // Audit log tercatat
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ORDER_EXPIRED',
        entity: 'Order',
        entityId: 'ord-exp-1',
      }),
    );
  });

  it('harus idempoten: jika tidak ada order PROPOSED kedaluwarsa, tidak melakukan alokasi ulang', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    const result = await service.handleExpiredOffers();

    expect(result.expiredCount).toBe(0);
    expect(result.reallocatedDemands).toHaveLength(0);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(matching.matchAndAllocate).not.toHaveBeenCalled();
  });

  describe('handleOrderCompletion (T5.5)', () => {
    it('harus menyelesaikan order PAID yang melewati disputeWindowHours tanpa sengketa menjadi COMPLETED', async () => {
      const mockPaidOrder = {
        id: 'ord-paid-1',
        orderNo: 'ORD-20261014-0001',
        status: OrderStatus.PAID,
        updatedAt: new Date(Date.now() - 50 * 3600 * 1000), // 50 jam lalu (> 48 jam)
      };

      prisma.order.findMany.mockResolvedValue([mockPaidOrder]);
      prisma.order.update.mockResolvedValue({
        ...mockPaidOrder,
        status: OrderStatus.COMPLETED,
      });

      const result = await service.handleOrderCompletion();

      expect(result.completedCount).toBe(1);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-paid-1' },
        data: { status: OrderStatus.COMPLETED },
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_COMPLETED',
          entity: 'Order',
          entityId: 'ord-paid-1',
        }),
      );
    });
  });
});
