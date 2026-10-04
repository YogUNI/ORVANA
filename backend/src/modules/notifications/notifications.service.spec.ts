import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('NotificationsService (T7.3 & docs/06 M11)', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-km-1',
    type: 'ORDER_PROPOSED',
    title: 'Tawaran Pesanan Baru',
    body: 'Pesanan bayam 40 kg telah diajukan ke pemasok.',
    link: '/kitchen/demand',
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('harus membuat notifikasi baru untuk pengguna', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification({
        userId: 'user-km-1',
        type: 'ORDER_PROPOSED',
        title: 'Tawaran Pesanan Baru',
        body: 'Pesanan bayam 40 kg telah diajukan ke pemasok.',
        link: '/kitchen/demand',
      });

      expect(result.id).toBe('notif-1');
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-km-1',
          title: 'Tawaran Pesanan Baru',
        }),
      });
    });
  });

  describe('getMyNotifications', () => {
    it('harus mengembalikan daftar notifikasi dan total unreadCount', async () => {
      prisma.notification.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(3); // unreadCount
      prisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await service.getMyNotifications('user-km-1', {
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(5);
      expect(result.meta.unreadCount).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('harus memperbarui readAt saat menandai satu notifikasi', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({
        ...mockNotification,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-1', 'user-km-1');
      expect(result.readAt).not.toBeNull();
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('harus menolak jika pengguna lain mencoba menandai notifikasi bukan miliknya', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);

      await expect(
        service.markAsRead('notif-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllAsRead', () => {
    it('harus menandai seluruh notifikasi yang belum dibaca menjadi terbaca', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 4 });

      const result = await service.markAllAsRead('user-km-1');
      expect(result.updatedCount).toBe(4);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-km-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });
});
