import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentsService } from './shipments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { OrderStatus, ShipmentStatus, Role } from '@prisma/client';
import {
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';

describe('ShipmentsService (docs/06 M5 & Gate 4)', () => {
  let service: ShipmentsService;
  let prisma: any;
  let audit: any;
  let settings: any;

  const mockCoordinatorUser = {
    sub: 'user-coord-1',
    email: 'budi.santoso@orvana.local',
    role: Role.COORDINATOR,
    status: 'ACTIVE' as const,
    regionId: 'reg-bogor',
    tokenVersion: 1,
  };

  const mockCoordinatorProfile = {
    id: 'coord-profile-1',
    userId: 'user-coord-1',
    regionId: 'reg-bogor',
  };

  // Dua order disanggupi untuk Dapur A (sesuai skenario bayam Gate 4)
  const mockOrder1 = {
    id: 'ord-s1',
    orderNo: 'ORD-20261014-0001',
    kitchenId: 'kitchen-a',
    supplierId: 'sup-s1',
    commodityId: 'comm-bayam',
    quantity: 40.0,
    pricePerUnit: 8000,
    status: OrderStatus.ACCEPTED,
    shipmentId: null,
    kitchen: { id: 'kitchen-a', name: 'Dapur Gizi Sukajaya', code: 'DPR01', regionId: 'reg-bogor' },
    supplier: {
      id: 'sup-s1',
      displayName: 'Kelompok Tani Subur',
      village: 'Sukajaya',
      reliabilityRate: 0.95,
    },
    demand: { neededDate: new Date('2026-10-14T06:00:00Z') },
    offer: { harvestDate: new Date('2026-10-13T06:00:00Z') },
  };

  const mockOrder2 = {
    id: 'ord-s2',
    orderNo: 'ORD-20261014-0002',
    kitchenId: 'kitchen-a',
    supplierId: 'sup-s2',
    commodityId: 'comm-bayam',
    quantity: 29.0,
    pricePerUnit: 7500,
    status: OrderStatus.ACCEPTED,
    shipmentId: null,
    kitchen: { id: 'kitchen-a', name: 'Dapur Gizi Sukajaya', code: 'DPR01', regionId: 'reg-bogor' },
    supplier: {
      id: 'sup-s2',
      displayName: 'Tani Mandiri Barokah',
      village: 'Megamendung',
      reliabilityRate: 0.80,
    },
    demand: { neededDate: new Date('2026-10-14T06:00:00Z') },
    offer: { harvestDate: new Date('2026-10-14T06:00:00Z') },
  };

  beforeEach(async () => {
    prisma = {
      coordinatorProfile: {
        findUnique: jest.fn().mockResolvedValue(mockCoordinatorProfile),
        findFirst: jest.fn().mockResolvedValue(mockCoordinatorProfile),
      },
      kitchen: {
        findUnique: jest.fn().mockResolvedValue({ id: 'kitchen-a', regionId: 'reg-bogor' }),
      },
      order: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      shipment: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      batch: {
        count: jest.fn().mockResolvedValue(0),
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
        if (key === 'supplier.reliabilityEmaAlpha') return Promise.resolve(0.2);
        return Promise.resolve(defaultVal);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  describe('createShipment (Konsolidasi Pesanan Satu Dapur)', () => {
    it('harus berhasil menggabungkan dua order dari dapur yang sama ke satu pengiriman (Gate 4)', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder1, mockOrder2]);
      prisma.shipment.create.mockImplementation(({ data }: any) => ({
        id: 'shipment-1',
        ...data,
      }));

      const result = await service.createShipment(
        {
          kitchenId: 'kitchen-a',
          orderIds: ['ord-s1', 'ord-s2'],
          scheduledAt: '2026-10-14T05:00:00.000Z',
          transportCost: 75000,
          routeNotes: 'Armada Pick-up Suzuki Carry Budi',
        },
        mockCoordinatorUser,
      );

      // Verifikasi pembuatan pengiriman dengan status PLANNED
      expect(prisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kitchenId: 'kitchen-a',
            status: ShipmentStatus.PLANNED,
            transportCost: 75000,
          }),
        }),
      );

      // Verifikasi status order diubah menjadi CONSOLIDATED
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['ord-s1', 'ord-s2'] } },
        data: {
          shipmentId: 'shipment-1',
          status: OrderStatus.CONSOLIDATED,
        },
      });

      expect(result.message).toContain('berhasil dikonsolidasikan');
    });

    it('harus menolak (422) jika pesanan yang dipilih ditujukan untuk dapur berbeda', async () => {
      const orderDifferentKitchen = {
        ...mockOrder2,
        kitchenId: 'kitchen-b',
      };
      prisma.order.findMany.mockResolvedValue([mockOrder1, orderDifferentKitchen]);

      await expect(
        service.createShipment(
          {
            kitchenId: 'kitchen-a',
            orderIds: ['ord-s1', 'ord-s2'],
            scheduledAt: '2026-10-14T05:00:00.000Z',
          },
          mockCoordinatorUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('harus menolak (409) jika order yang dipilih sudah pernah dikonsolidasikan', async () => {
      const alreadyConsolidatedOrder = {
        ...mockOrder1,
        status: OrderStatus.CONSOLIDATED,
        shipmentId: 'shp-existing',
      };
      prisma.order.findMany.mockResolvedValue([alreadyConsolidatedOrder, mockOrder2]);

      await expect(
        service.createShipment(
          {
            kitchenId: 'kitchen-a',
            orderIds: ['ord-s1', 'ord-s2'],
            scheduledAt: '2026-10-14T05:00:00.000Z',
          },
          mockCoordinatorUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus & Batch Creation', () => {
    it('harus menolak loncat status (PLANNED langsung ke ARRIVED menghasilkan INVALID_TRANSITION)', async () => {
      prisma.shipment.findUnique.mockResolvedValue({
        id: 'shipment-1',
        status: ShipmentStatus.PLANNED,
        orders: [],
      });

      await expect(
        service.updateStatus(
          'shipment-1',
          { status: ShipmentStatus.ARRIVED },
          mockCoordinatorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('saat status berubah ke IN_TRANSIT, harus menerbitkan Batch unik dan mengubah status order menjadi IN_TRANSIT', async () => {
      const plannedShipment = {
        id: 'shipment-1',
        status: ShipmentStatus.PICKING_UP,
        kitchen: { code: 'DPR01' },
        orders: [
          { ...mockOrder1, batch: null },
          { ...mockOrder2, batch: null },
        ],
      };

      prisma.shipment.findUnique.mockResolvedValue(plannedShipment);
      prisma.shipment.update.mockImplementation(({ data }: any) => ({
        ...plannedShipment,
        ...data,
      }));

      await service.updateStatus(
        'shipment-1',
        { status: ShipmentStatus.IN_TRANSIT },
        mockCoordinatorUser,
      );

      // Verifikasi Batch dibuat dengan format ORV-{YYYYMMDD}-{kitchen.code}-{seq4}
      expect(prisma.batch.create).toHaveBeenCalledTimes(2);
      expect(prisma.batch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'ord-s1',
            shippedQuantity: 40.0,
            batchCode: expect.stringMatching(/^ORV-\d{8}-DPR01-\d{4}$/),
          }),
        }),
      );

      // Verifikasi status order berubah ke IN_TRANSIT
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-s1' },
        data: { status: OrderStatus.IN_TRANSIT },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-s2' },
        data: { status: OrderStatus.IN_TRANSIT },
      });
    });

    it('saat status ARRIVED, harus mencatat susut dan memperbarui nilai keandalan pemasok via EMA', async () => {
      const inTransitShipment = {
        id: 'shipment-1',
        status: ShipmentStatus.IN_TRANSIT,
        kitchen: { code: 'DPR01' },
        orders: [
          { ...mockOrder1, batch: { id: 'b1' } },
        ],
      };

      prisma.shipment.findUnique.mockResolvedValue(inTransitShipment);
      prisma.shipment.update.mockImplementation(({ data }: any) => ({
        ...inTransitShipment,
        ...data,
      }));

      await service.updateStatus(
        'shipment-1',
        {
          status: ShipmentStatus.ARRIVED,
          lossKg: 0.5,
          lossReason: 'Susut penguapan alami dan sortir daun',
        },
        mockCoordinatorUser,
      );

      // Pengiriman tiba tepat waktu: old = 0.95, alpha = 0.2, onTime = 1.0 -> (0.8 * 0.95) + (0.2 * 1.0) = 0.76 + 0.2 = 0.96
      expect(prisma.supplierProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sup-s1' },
          data: expect.objectContaining({
            reliabilityRate: 0.96,
            totalOrders: { increment: 1 },
          }),
        }),
      );
    });
  });
});
