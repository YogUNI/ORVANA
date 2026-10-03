import { Test, TestingModule } from '@nestjs/testing';
import { DemandService } from './demand.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, DemandStatus, OrderStatus } from '@prisma/client';
import {
  ForbiddenException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';

describe('DemandService Unit Tests (T2.5)', () => {
  let service: DemandService;
  let prisma: any;
  let auditService: any;

  const mockDemandDraft = {
    id: 'dem-1',
    kitchenId: 'k-1',
    commodityId: 'comm-bayam',
    quantity: 69.0,
    neededDate: new Date('2026-10-12'), // H+X
    maxPricePerUnit: 8000,
    minQualityScore: 60,
    status: DemandStatus.DRAFT,
    kitchen: { id: 'k-1', managerId: 'user-km-1', regionId: 'reg-demo' },
    commodity: { id: 'comm-bayam', name: 'Bayam' },
    orders: [],
  };

  beforeEach(async () => {
    prisma = {
      demandRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      priceReference: {
        findFirst: jest.fn(),
      },
      supplierProfile: {
        findUnique: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      supplyOffer: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DemandService>(DemandService);
  });

  describe('Scoping Data & Akses Dapur', () => {
    it('menolak KITCHEN_MANAGER lain yang mencoba mengubah permintaan dapur orang lain', async () => {
      prisma.demandRequest.findUnique.mockResolvedValue(mockDemandDraft);

      await expect(
        service.updateDemandRequest(
          mockDemandDraft.id,
          { quantity: 70 },
          'user-km-OTHER',
          Role.KITCHEN_MANAGER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Publish Demand Request & Validasi Bisnis', () => {
    it('menolak publikasi dengan kode PRICE_BELOW_FLOOR jika maxPricePerUnit < floorPrice', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const invalidPriceDemand = {
        ...mockDemandDraft,
        neededDate: tomorrow,
        maxPricePerUnit: 5500, // Di bawah dasar bayam 6.000 (vektor docs/09 bagian 6)
      };

      prisma.demandRequest.findUnique.mockResolvedValue(invalidPriceDemand);
      prisma.priceReference.findFirst.mockResolvedValue({
        floorPrice: 6000,
        referencePrice: 8000,
        ceilingPrice: 12000,
      });

      await expect(
        service.publishDemandRequest(
          invalidPriceDemand.id,
          'user-km-1',
          Role.KITCHEN_MANAGER,
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.publishDemandRequest(
          invalidPriceDemand.id,
          'user-km-1',
          Role.KITCHEN_MANAGER,
        );
      } catch (err: any) {
        expect(err.response.code).toBe('PRICE_BELOW_FLOOR');
        expect(err.response.message).toContain('6.000');
      }
    });

    it('menolak publikasi dengan kode INVALID_DATE jika neededDate adalah hari ini atau masa lalu', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pastDemand = {
        ...mockDemandDraft,
        neededDate: yesterday,
      };

      prisma.demandRequest.findUnique.mockResolvedValue(pastDemand);

      await expect(
        service.publishDemandRequest(
          pastDemand.id,
          'user-km-1',
          Role.KITCHEN_MANAGER,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('berhasil menerbitkan permintaan jika tanggal H+1 dan harga wajar (DRAFT -> OPEN)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const validDemand = {
        ...mockDemandDraft,
        neededDate: futureDate,
        maxPricePerUnit: 8000,
      };

      prisma.demandRequest.findUnique.mockResolvedValue(validDemand);
      prisma.priceReference.findFirst.mockResolvedValue({
        floorPrice: 6000,
        referencePrice: 8000,
        ceilingPrice: 12000,
      });

      prisma.demandRequest.update.mockResolvedValue({
        ...validDemand,
        status: DemandStatus.OPEN,
      });

      const res = await service.publishDemandRequest(
        validDemand.id,
        'user-km-1',
        Role.KITCHEN_MANAGER,
      );

      expect(res.status).toBe(DemandStatus.OPEN);
      expect(prisma.demandRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validDemand.id },
          data: { status: DemandStatus.OPEN },
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DEMAND_PUBLISHED',
          entityId: validDemand.id,
        }),
      );
    });
  });

  describe('Cancel Demand Request & Pelepasan Reservasi', () => {
    it('membatalkan permintaan dan melepas reservasi pada order yang masih PROPOSED/ACCEPTED', async () => {
      const demandWithOrders = {
        ...mockDemandDraft,
        status: DemandStatus.OPEN,
        orders: [
          {
            id: 'ord-1',
            quantity: 40.0,
            status: OrderStatus.PROPOSED,
            offerId: 'off-1',
          },
        ],
      };

      prisma.demandRequest.findUnique.mockResolvedValue(demandWithOrders);

      const res = await service.cancelDemandRequest(
        demandWithOrders.id,
        { reason: 'Rencana menu berubah' },
        'user-km-1',
        Role.KITCHEN_MANAGER,
      );

      expect(res.message).toContain('berhasil dibatalkan');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(prisma.supplyOffer.update).toHaveBeenCalledWith({
        where: { id: 'off-1' },
        data: {
          quantityReserved: { decrement: 40.0 },
        },
      });
      expect(prisma.demandRequest.update).toHaveBeenCalledWith({
        where: { id: demandWithOrders.id },
        data: { status: DemandStatus.CANCELLED },
      });
    });

    it('menolak pembatalan jika pesanan sudah dalam proses pengiriman (CONSOLIDATED / IN_TRANSIT)', async () => {
      const demandInTransit = {
        ...mockDemandDraft,
        status: DemandStatus.MATCHING,
        orders: [
          {
            id: 'ord-2',
            quantity: 20.0,
            status: OrderStatus.IN_TRANSIT,
          },
        ],
      };

      prisma.demandRequest.findUnique.mockResolvedValue(demandInTransit);

      await expect(
        service.cancelDemandRequest(
          demandInTransit.id,
          { reason: 'Batal' },
          'user-km-1',
          Role.KITCHEN_MANAGER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
