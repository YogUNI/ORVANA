import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MatchingService } from '../matching/matching.service';
import { SettingsService } from '../settings/settings.service';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly matchingService: MatchingService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Tugas Terjadwal: Penyelesaian Otomatis Order (T5.5 - docs/04 bagian 9 & docs/06 M5.5)
   * Berjalan tiap jam: Order berstatus PAID atau QC_FAILED yang melewati disputeWindowHours
   * tanpa adanya sengketa (Dispute) aktif akan diubah statusnya menjadi COMPLETED.
   * Bersifat IDEMPOTEN.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleOrderCompletion() {
    this.logger.log('Menjalankan tugas terjadwal: penyelesaian order otomatis...');

    const disputeWindowHours = await this.settingsService.getSetting<number>(
      'order.disputeWindowHours',
      48,
    );

    const cutoffTime = new Date(Date.now() - disputeWindowHours * 60 * 60 * 1000);

    // Ambil order PAID atau QC_FAILED yang updatedAt <= cutoffTime dan tidak punya sengketa aktif
    const candidateOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.QC_FAILED],
        },
        updatedAt: {
          lte: cutoffTime,
        },
        disputes: {
          none: {
            status: { in: ['OPEN', 'UNDER_REVIEW'] },
          },
        },
      },
    });

    if (candidateOrders.length === 0) {
      return { completedCount: 0 };
    }

    let completedCount = 0;
    for (const order of candidateOrders) {
      try {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.COMPLETED },
        });

        await this.auditService.log({
          action: 'ORDER_COMPLETED',
          entity: 'Order',
          entityId: order.id,
          meta: {
            orderNo: order.orderNo,
            previousStatus: order.status,
            newStatus: OrderStatus.COMPLETED,
            disputeWindowHours,
          },
        });

        completedCount++;
      } catch (err: any) {
        this.logger.error(`Gagal menyelesaikan order ${order.orderNo}: ${err.message}`);
      }
    }

    this.logger.log(`Berhasil menyelesaikan otomatis ${completedCount} pesanan.`);
    return { completedCount };
  }

  /**
   * Tugas Terjadwal: Pemeriksaan tawaran pesanan kedaluwarsa
   * Dijalankan setiap 5 menit (docs/04 bagian 9)
   * Mengubah PROPOSED dengan offerExpiresAt < now() menjadi EXPIRED,
   * melepas kuantitas tereservasi, dan memicu alokasi ulang untuk sisa kuantitas.
   * Bersifat IDEMPOTEN.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredOffers() {
    this.logger.log('Menjalankan tugas terjadwal: pemeriksaan tawaran kedaluwarsa...');
    const now = new Date();

    // 1. Cari semua order PROPOSED yang telah melewati batas waktu respon
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PROPOSED,
        offerExpiresAt: {
          lt: now,
        },
      },
      include: {
        offer: true,
        demand: true,
      },
    });

    if (expiredOrders.length === 0) {
      return { expiredCount: 0, reallocatedDemands: [] };
    }

    this.logger.warn(`Ditemukan ${expiredOrders.length} tawaran pesanan yang kedaluwarsa.`);

    const demandIdsToReallocate = new Set<string>();

    for (const order of expiredOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Ambil ulang dengan status untuk memastikan idempoten (cegah race condition)
          const current = await tx.order.findUnique({
            where: { id: order.id },
          });

          if (!current || current.status !== OrderStatus.PROPOSED) {
            return;
          }

          // Ubah status ke EXPIRED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.EXPIRED,
              rejectionReason: 'Batas waktu respon penawaran (12 jam) telah kedaluwarsa',
            },
          });

          // Lepas kuantitas tereservasi pada stok penawaran
          await tx.supplyOffer.update({
            where: { id: order.offerId },
            data: {
              quantityReserved: { decrement: order.quantity },
            },
          });

          await this.auditService.log({
            action: 'ORDER_EXPIRED',
            entity: 'Order',
            entityId: order.id,
            meta: {
              orderNo: order.orderNo,
              demandId: order.demandId,
              supplierId: order.supplierId,
              releasedQuantity: Number(order.quantity),
            },
          });

          demandIdsToReallocate.add(order.demandId);
        });
      } catch (err: any) {
        this.logger.error(`Gagal memproses kedaluwarsa order ${order.orderNo}: ${err.message}`);
      }
    }

    // 2. Picu alokasi ulang otomatis untuk setiap demand terkait (docs/04 bagian 9)
    const reallocatedDemands: string[] = [];
    for (const demandId of demandIdsToReallocate) {
      try {
        this.logger.log(`Memulai alokasi ulang otomatis untuk Demand ID: ${demandId}`);
        await this.matchingService.matchAndAllocate(
          demandId,
          'SYSTEM_SCHEDULER',
          Role.ADMIN,
        );
        reallocatedDemands.push(demandId);
      } catch (err: any) {
        this.logger.warn(`Alokasi ulang otomatis untuk demand ${demandId} selesai: ${err.message}`);
      }
    }

    return {
      expiredCount: expiredOrders.length,
      reallocatedDemands,
    };
  }
}
