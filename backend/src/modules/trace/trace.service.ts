import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicTraceDto {
  batchCode: string;
  commodity: {
    name: string;
    unit: string;
  };
  origin: {
    village: string | null;
    district?: string;
    supplierName: string;
    supplierType: string;
    isPublicName: boolean;
  };
  timeline: {
    harvestDate: string;
    shippedAt?: string | null;
    receivedAt?: string | null;
    checkedAt?: string | null;
  };
  quantities: {
    shipped: number;
    received: number | null;
    accepted: number | null;
    rejected: number | null;
  };
  logistics: {
    kitchenName: string;
    kitchenCode: string;
    distanceKm: number;
    lossKg: number;
  };
  quality: {
    score: number | null;
    result: string | null;
    checklistScores: any;
    notes?: string | null;
  } | null;
  paymentStatus: string;
}

@Injectable()
export class TraceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menampilkan data penelusuran batch untuk publik (docs/06 M9)
   * Menyensor data sensitif (nomor telepon, email, alamat persis, nama jika publicName=false).
   */
  async getPublicTrace(batchCode: string): Promise<PublicTraceDto> {
    const batch = await this.prisma.batch.findUnique({
      where: { batchCode },
      include: {
        order: {
          include: {
            commodity: true,
            kitchen: true,
            supplier: {
              include: {
                user: {
                  select: {
                    name: true,
                    // jangan sertakan email / phone
                  },
                },
              },
            },
            shipment: true,
            ledger: true,
          },
        },
        qualityChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException({
        code: 'BATCH_NOT_FOUND',
        message: `Batch dengan kode ${batchCode} tidak ditemukan`,
      });
    }

    const { order } = batch;
    const latestQc = batch.qualityChecks[0] || null;

    // Privasi nama produsen (docs/02 & docs/06 M9)
    const isPublicName = order.supplier.publicName;
    const supplierName = isPublicName
      ? order.supplier.displayName
      : `Kelompok Tani Terdaftar (Desa ${batch.originVillage || order.supplier.village || 'Lokal'})`;

    // Jarak tempuh menggunakan Haversine
    const { calculateHaversineDistance } = await import('../../common/utils/haversine');
    const distanceKm = calculateHaversineDistance(
      order.supplier.latitude,
      order.supplier.longitude,
      order.kitchen.latitude,
      order.kitchen.longitude,
    );

    // Kuantitas
    const shipped = Number(batch.shippedQuantity);
    const received = batch.receivedQuantity ? Number(batch.receivedQuantity) : null;
    const accepted = latestQc ? Number(latestQc.acceptedQuantity) : null;
    const rejected = latestQc ? Number(latestQc.rejectedQuantity) : null;

    // Status pembayaran umum yang ramah publik
    let paymentStatus = 'PENDING';
    const hasRelease = order.ledger.some((l) => l.stage === 'RELEASE');
    const hasVoidOnly = order.ledger.some((l) => l.stage === 'VOID') && !hasRelease;

    if (order.status === 'COMPLETED' || hasRelease) {
      paymentStatus = 'SETTLED_TO_FARMER'; // Hak petani telah tersalurkan
    } else if (hasVoidOnly || order.status === 'QC_FAILED') {
      paymentStatus = 'CANCELLED';
    } else if (order.status === 'RECEIVED' || order.status === 'IN_TRANSIT') {
      paymentStatus = 'ESCROW_HOLD'; // Dana diamankan di sistem penjamin
    }

    return {
      batchCode: batch.batchCode,
      commodity: {
        name: order.commodity.name,
        unit: order.commodity.unit,
      },
      origin: {
        village: batch.originVillage || order.supplier.village,
        supplierName,
        supplierType: order.supplier.type,
        isPublicName,
      },
      timeline: {
        harvestDate: batch.harvestDate.toISOString().split('T')[0],
        shippedAt: order.shipment?.departedAt ? order.shipment.departedAt.toISOString() : null,
        receivedAt: batch.receivedAt ? batch.receivedAt.toISOString() : null,
        checkedAt: latestQc?.checkedAt ? latestQc.checkedAt.toISOString() : null,
      },
      quantities: {
        shipped,
        received,
        accepted,
        rejected,
      },
      logistics: {
        kitchenName: order.kitchen.name,
        kitchenCode: order.kitchen.code,
        distanceKm,
        lossKg: order.shipment ? Number(order.shipment.lossKg) : 0,
      },
      quality: latestQc
        ? {
            score: latestQc.score,
            result: latestQc.result,
            checklistScores: latestQc.checklistScores,
            notes: latestQc.notes,
          }
        : null,
      paymentStatus,
    };
  }
}
