import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengirim / membuat notifikasi baru untuk pengguna
   */
  async createNotification(params: CreateNotificationParams, tx?: any) {
    const client = tx || this.prisma;
    return client.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || null,
      },
    });
  }

  /**
   * Mengambil daftar notifikasi milik pengguna yang sedang login
   * Mendukung filter unread=true dan limit
   */
  async getMyNotifications(
    userId: string,
    query: { unread?: boolean; limit?: number; page?: number },
  ) {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unread === true || String(query.unread) === 'true') {
      where.readAt = null;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Menandai satu notifikasi sebagai sudah dibaca
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notifikasi tidak ditemukan',
      });
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki akses ke notifikasi ini',
      });
    }

    if (!notification.readAt) {
      return this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }

    return notification;
  }

  /**
   * Menandai semua notifikasi milik pengguna sebagai sudah dibaca
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      message: 'Semua notifikasi berhasil ditandai telah dibaca',
      updatedCount: result.count,
    };
  }
}
