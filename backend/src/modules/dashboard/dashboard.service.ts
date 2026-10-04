import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateHaversineDistance } from '../../common/utils/haversine';
import { LedgerStage, QcResult, OrderStatus } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { scopeWhere } from '../../common/utils/scope-where.util';

export interface ImpactMetricsResult {
  localSpendingRupiah: number; // Nilai belanja lokal (Rp)
  producersInvolved: number; // Produsen terlibat unik
  fulfillmentRatePct: number; // Tingkat pemenuhan (%)
  rejectionRatePct: number; // Tingkat penolakan (%)
  qualityPassRatePct: number; // Tingkat lolos mutu (%)
  avgDistanceKm: number; // Jarak tempuh rata-rata tertimbang (km)
  pricePremiumPct: number; // Premi harga vs acuan tertimbang (%)
  onTimeDeliveryPct: number; // Ketepatan waktu pengiriman (%)
  escrowHoldRupiah: number; // Nilai dana tertahan (Rp)
  meta: {
    totalOrders: number;
    totalBatches: number;
    totalDemandKg: number;
    totalAcceptedKg: number;
    totalRejectedKg: number;
  };
}

export interface ImpactSummaryDto {
  localSpendingRupiah: number;
  producersInvolved: number;
  totalDeliveredKg: number;
  qualityPassRatePct: number;
  avgDistanceKm: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menghitung 9 metrik dampak sistem secara presisi sesuai rumus docs/04 bagian 10
   */
  async getImpactMetrics(filter: {
    from?: string;
    to?: string;
    regionId?: string;
  }): Promise<ImpactMetricsResult> {
    const whereOrder: any = {};
    const whereDemand: any = {};
    const whereBatch: any = {};

    if (filter.regionId) {
      whereOrder.kitchen = { regionId: filter.regionId };
      whereDemand.kitchen = { regionId: filter.regionId };
      whereBatch.order = { kitchen: { regionId: filter.regionId } };
    }

    if (filter.from || filter.to) {
      whereOrder.createdAt = {};
      whereDemand.neededDate = {};
      whereBatch.createdAt = {};
      if (filter.from) {
        whereOrder.createdAt.gte = new Date(filter.from);
        whereDemand.neededDate.gte = new Date(filter.from);
        whereBatch.createdAt.gte = new Date(filter.from);
      }
      if (filter.to) {
        whereOrder.createdAt.lte = new Date(filter.to);
        whereDemand.neededDate.lte = new Date(filter.to);
        whereBatch.createdAt.lte = new Date(filter.to);
      }
    }

    // 1. Ambil orders dengan relasi lengkap
    const orders = await this.prisma.order.findMany({
      where: whereOrder,
      include: {
        demand: true,
        kitchen: true,
        supplier: true,
        shipment: true,
        batch: {
          include: {
            qualityChecks: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
        ledger: true,
      },
    });

    // 2. Ambil seluruh permintaan yang jatuh tempo pada periode
    const demands = await this.prisma.demandRequest.findMany({
      where: whereDemand,
    });

    // 3. Ambil data harga acuan untuk perhitungan premi harga
    const priceRefs = await this.prisma.priceReference.findMany();

    // Inisialisasi akumulator metrik
    let localSpending = 0;
    const activeSupplierIds = new Set<string>();

    let totalDemandKg = demands.reduce((acc, d) => acc + Number(d.quantity), 0);
    let totalAcceptedKg = 0;
    let totalReceivedKg = 0;
    let totalRejectedKg = 0;

    let totalBatches = 0;
    let passBatches = 0;

    let sumWeightedDistance = 0;
    let sumWeightForDistance = 0;

    let sumWeightedPremiumRatio = 0;
    let sumWeightForPremium = 0;

    let arrivedOrderCount = 0;
    let onTimeOrderCount = 0;

    let totalHold = 0;
    let totalReleased = 0;
    let totalVoid = 0;

    for (const order of orders) {
      const isSameRegion = order.kitchen.regionId === order.supplier.regionId;
      const orderQty = Number(order.quantity);

      // Mutasi Ledger
      let orderRelease = 0;
      let orderAdjustment = 0;
      for (const entry of order.ledger) {
        const amt = Number(entry.amount);
        if (entry.stage === LedgerStage.HOLD) totalHold += amt;
        else if (entry.stage === LedgerStage.RELEASE) {
          totalReleased += amt;
          orderRelease += amt;
        } else if (entry.stage === LedgerStage.VOID) totalVoid += amt;
        else if (entry.stage === LedgerStage.ADJUSTMENT) {
          orderAdjustment += amt;
        }
      }

      const effectiveRelease = orderRelease + orderAdjustment;

      // 1. Belanja lokal: Σ RELEASE (dikurangi koreksi) untuk order pemasok sewilayah
      if (isSameRegion && effectiveRelease > 0) {
        localSpending += effectiveRelease;
      }

      // 2. Produsen terlibat: jumlah pemasok dengan RELEASE efektif > 0
      if (effectiveRelease > 0) {
        activeSupplierIds.add(order.supplierId);
      }

      // 8. Ketepatan waktu pengiriman
      if (order.shipment?.arrivedAt) {
        arrivedOrderCount++;
        // Order tepat waktu jika tiba sebelum/pada tanggal kebutuhan permintaan
        const arrivedDate = order.shipment.arrivedAt;
        const neededDate = new Date(order.demand.neededDate);
        neededDate.setHours(23, 59, 59, 999);
        if (arrivedDate <= neededDate) {
          onTimeOrderCount++;
        }
      }

      // Batch & Mutu
      if (order.batch) {
        totalBatches++;
        const latestQc = order.batch.qualityChecks[0];
        if (latestQc) {
          const accKg = Number(latestQc.acceptedQuantity);
          const rejKg = Number(latestQc.rejectedQuantity);
          const recKg = Number(latestQc.receivedQuantity);

          totalAcceptedKg += accKg;
          totalRejectedKg += rejKg;
          totalReceivedKg += recKg;

          if (latestQc.result === QcResult.PASS) {
            passBatches++;
          }
        }

        // Jarak tempuh menggunakan Haversine
        const dist = calculateHaversineDistance(
          order.supplier.latitude,
          order.supplier.longitude,
          order.kitchen.latitude,
          order.kitchen.longitude,
        );
        sumWeightedDistance += orderQty * dist;
        sumWeightForDistance += orderQty;
      }

      // Premi harga vs acuan
      // Cari referencePrice yang sesuai komoditas dan wilayah dapur
      const ref = priceRefs.find(
        (p) =>
          p.commodityId === order.commodityId &&
          p.regionId === order.kitchen.regionId,
      );

      const refPrice = ref ? Number(ref.referencePrice) : Number(order.pricePerUnit);
      if (refPrice > 0) {
        const orderPrice = Number(order.pricePerUnit);
        const premiumRatio = (orderPrice - refPrice) / refPrice;
        sumWeightedPremiumRatio += orderQty * premiumRatio;
        sumWeightForPremium += orderQty;
      }
    }

    // Kalkulasi rasio persentase akhir (dibulatkan 2 desimal)
    const fulfillmentRatePct =
      totalDemandKg > 0 ? Math.round((totalAcceptedKg / totalDemandKg) * 10000) / 100 : 0;
    const rejectionRatePct =
      totalReceivedKg > 0 ? Math.round((totalRejectedKg / totalReceivedKg) * 10000) / 100 : 0;
    const qualityPassRatePct =
      totalBatches > 0 ? Math.round((passBatches / totalBatches) * 10000) / 100 : 0;

    const avgDistanceKm =
      sumWeightForDistance > 0
        ? Math.round((sumWeightedDistance / sumWeightForDistance) * 100) / 100
        : 0;

    const pricePremiumPct =
      sumWeightForPremium > 0
        ? Math.round((sumWeightedPremiumRatio / sumWeightForPremium) * 10000) / 100
        : 0;

    const onTimeDeliveryPct =
      arrivedOrderCount > 0
        ? Math.round((onTimeOrderCount / arrivedOrderCount) * 10000) / 100
        : 0;

    const escrowHoldRupiah = Math.max(0, totalHold - totalReleased - totalVoid);

    return {
      localSpendingRupiah: Math.round(localSpending),
      producersInvolved: activeSupplierIds.size,
      fulfillmentRatePct,
      rejectionRatePct,
      qualityPassRatePct,
      avgDistanceKm,
      pricePremiumPct,
      onTimeDeliveryPct,
      escrowHoldRupiah: Math.round(escrowHoldRupiah),
      meta: {
        totalOrders: orders.length,
        totalBatches,
        totalDemandKg,
        totalAcceptedKg,
        totalRejectedKg,
      },
    };
  }

  /**
   * Data ringkasan publik untuk landing page (docs/06 M9)
   */
  async getPublicImpactSummary(): Promise<ImpactSummaryDto> {
    const metrics = await this.getImpactMetrics({});
    return {
      localSpendingRupiah: metrics.localSpendingRupiah,
      producersInvolved: metrics.producersInvolved,
      totalDeliveredKg: metrics.meta.totalAcceptedKg,
      qualityPassRatePct: metrics.qualityPassRatePct,
      avgDistanceKm: metrics.avgDistanceKm,
    };
  }

  /**
   * Dashboard Pengelola Dapur (KITCHEN_MANAGER) - docs/06 M10 P1
   * Kebutuhan vs terpenuhi, biaya, order aktif
   */
  async getKitchenDashboard(user: JwtPayload) {
    const kitchen = await this.prisma.kitchen.findFirst({
      where: { managerId: user.sub },
    });

    if (!kitchen) {
      return {
        totalDemandKg: 0,
        fulfilledKg: 0,
        fulfillmentRatePct: 0,
        totalSpendingRupiah: 0,
        activeOrdersCount: 0,
        pendingReceivingCount: 0,
        recentOrders: [],
      };
    }

    const [demands, orders] = await Promise.all([
      this.prisma.demandRequest.findMany({
        where: { kitchenId: kitchen.id },
      }),
      this.prisma.order.findMany({
        where: { kitchenId: kitchen.id },
        include: {
          commodity: true,
          supplier: true,
          batch: {
            include: { qualityChecks: true },
          },
          ledger: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalDemandKg = demands.reduce((acc, d) => acc + Number(d.quantity), 0);

    let fulfilledKg = 0;
    let totalSpendingRupiah = 0;
    let activeOrdersCount = 0;
    let pendingReceivingCount = 0;

    for (const o of orders) {
      // Order aktif
      if (['PROPOSED', 'ACCEPTED', 'CONSOLIDATED', 'IN_TRANSIT', 'RECEIVED'].includes(o.status)) {
        activeOrdersCount++;
      }
      if (o.status === 'IN_TRANSIT') {
        pendingReceivingCount++;
      }

      // Kuantitas diterima lolos QC
      const qc = o.batch?.qualityChecks[0];
      if (qc) {
        fulfilledKg += Number(qc.acceptedQuantity);
      }

      // Belanja riil dari ledger RELEASE
      const releases = o.ledger.filter((l) => l.stage === LedgerStage.RELEASE);
      for (const r of releases) {
        totalSpendingRupiah += Number(r.amount);
      }
    }

    const fulfillmentRatePct = totalDemandKg > 0 ? Math.round((fulfilledKg / totalDemandKg) * 10000) / 100 : 0;

    return {
      kitchen: { id: kitchen.id, name: kitchen.name, code: kitchen.code },
      totalDemandKg: Math.round(totalDemandKg * 100) / 100,
      fulfilledKg: Math.round(fulfilledKg * 100) / 100,
      fulfillmentRatePct,
      totalSpendingRupiah: Math.round(totalSpendingRupiah),
      activeOrdersCount,
      pendingReceivingCount,
      recentOrders: orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        commodityName: o.commodity?.name || '-',
        supplierName: o.supplier?.displayName || '-',
        quantityKg: Number(o.quantity),
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  }

  /**
   * Dashboard Produsen Pemasok (SUPPLIER) - docs/06 M10 P1
   * Pendapatan tercatat, skor mutu, order aktif, ringkasan panen
   */
  async getSupplierDashboard(user: JwtPayload) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId: user.sub },
    });

    if (!profile) {
      return {
        earnedRupiah: 0,
        escrowRupiah: 0,
        qualityScore: 70,
        activeOrdersCount: 0,
        proposedOrdersCount: 0,
        activeOffersCount: 0,
        harvestPlansCount: 0,
        averageRating: null,
        reviewCount: 0,
        recentOrders: [],
      };
    }

    const [orders, offers, harvestPlans, reviews] = await Promise.all([
      this.prisma.order.findMany({
        where: { supplierId: profile.id },
        include: {
          commodity: true,
          kitchen: true,
          ledger: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplyOffer.count({
        where: { supplierId: profile.id, status: 'ACTIVE' },
      }),
      this.prisma.harvestPlan.count({
        where: { supplierId: profile.id },
      }),
      this.prisma.supplierReview.findMany({
        where: { order: { supplierId: profile.id } },
        select: { rating: true },
      }),
    ]);

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    let earnedRupiah = 0;
    let escrowRupiah = 0;
    let activeOrdersCount = 0;
    let proposedOrdersCount = 0;

    for (const o of orders) {
      if (o.status === 'PROPOSED') proposedOrdersCount++;
      if (['ACCEPTED', 'CONSOLIDATED', 'IN_TRANSIT', 'RECEIVED'].includes(o.status)) {
        activeOrdersCount++;
      }

      for (const l of o.ledger) {
        if (l.stage === LedgerStage.RELEASE) {
          earnedRupiah += Number(l.amount);
        } else if (l.stage === LedgerStage.HOLD) {
          escrowRupiah += Number(l.amount);
        } else if (l.stage === LedgerStage.VOID) {
          escrowRupiah -= Number(l.amount);
        }
      }
    }

    return {
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        type: profile.type,
      },
      earnedRupiah: Math.round(earnedRupiah),
      escrowRupiah: Math.max(0, Math.round(escrowRupiah)),
      qualityScore: Number(profile.qualityScore),
      averageRating,
      reviewCount,
      activeOrdersCount,
      proposedOrdersCount,
      activeOffersCount: offers,
      harvestPlansCount: harvestPlans,
      recentOrders: orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        commodityName: o.commodity?.name || '-',
        kitchenName: o.kitchen?.name || '-',
        quantityKg: Number(o.quantity),
        pricePerUnit: Number(o.pricePerUnit),
        totalPrice: Math.round(Number(o.quantity) * Number(o.pricePerUnit)),
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  }

  /**
   * Dashboard Koordinator Pengumpulan (COORDINATOR) - docs/06 M10 P1
   * Order siap kirim, armada pengiriman aktif, total tonase
   */
  async getCoordinatorDashboard(user: JwtPayload) {
    const profile = await this.prisma.coordinatorProfile.findUnique({
      where: { userId: user.sub },
    });

    const coordinatorId = profile?.id;
    const regionId = user.regionId;

    const [readyOrders, shipments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: 'ACCEPTED',
          ...(regionId ? { kitchen: { regionId } } : {}),
        },
        include: {
          commodity: true,
          supplier: true,
          kitchen: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipment.findMany({
        where: coordinatorId ? { coordinatorId } : {},
        include: {
          kitchen: true,
          orders: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    const activeShipmentsCount = shipments.filter((s) =>
      ['PLANNED', 'PICKING_UP', 'IN_TRANSIT'].includes(s.status),
    ).length;

    const totalOrdersReady = readyOrders.length;
    const totalReadyKg = readyOrders.reduce((acc, o) => acc + Number(o.quantity), 0);

    return {
      profile: profile ? { id: profile.id, organizationName: profile.organizationName } : null,
      totalOrdersReady,
      totalReadyKg: Math.round(totalReadyKg * 100) / 100,
      activeShipmentsCount,
      totalShipmentsCount: shipments.length,
      readyOrders: readyOrders.slice(0, 6).map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        commodityName: o.commodity?.name || '-',
        supplierName: o.supplier?.displayName || '-',
        kitchenName: o.kitchen?.name || '-',
        quantityKg: Number(o.quantity),
        createdAt: o.createdAt,
      })),
      recentShipments: shipments.slice(0, 5).map((s) => ({
        id: s.id,
        shipmentNo: s.shipmentNo,
        kitchenName: s.kitchen.name,
        scheduledAt: s.scheduledAt,
        status: s.status,
        orderCount: s.orders.length,
      })),
    };
  }
}

