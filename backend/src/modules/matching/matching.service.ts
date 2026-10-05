import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  OfferStatus,
  OrderStatus,
  DemandStatus,
  Role,
} from '@prisma/client';
import { calculateHaversineDistance } from '../../common/utils/haversine';
import { calculateMatchScore } from './matching-calculator';

export interface CandidatePreview {
  offerId: string;
  supplierId: string;
  supplierName: string;
  village?: string | null;
  distanceKm: number;
  availableQuantity: number;
  harvestDate: string;
  ageDays: number;
  askingPrice: number;
  qualityScore: number;
  reliabilityRate: number;
  scoreComponents: {
    sDistance: number;
    sQuality: number;
    sPrice: number;
    sFreshness: number;
    sReliability: number;
    matchScore: number;
  };
  cappedQuantity: number;
  estimatedTotal: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Mengambil dan memfilter kandidat pasokan yang memenuhi syarat untuk satu DemandRequest
   * docs/04 bagian 4.1
   */
  async findCandidates(demandId: string, testDistanceMap?: Map<string, number>): Promise<{
    demand: any;
    candidates: CandidatePreview[];
    referencePrice: number;
  }> {
    const demand = await this.prisma.demandRequest.findUnique({
      where: { id: demandId },
      include: {
        kitchen: true,
        commodity: true,
        orders: {
          include: { supplier: true },
        },
      },
    });

    if (!demand) {
      throw new NotFoundException({
        code: 'DEMAND_NOT_FOUND',
        message: 'Permintaan bahan tidak ditemukan',
      });
    }

    // 1. Ambil Pengaturan Sistem
    const weights = await this.settingsService.getMatchingWeights();
    const maxRadiusKm = await this.settingsService.getSetting<number>(
      'matching.maxRadiusKm',
      50,
    );
    const maxSharePerSupplier = await this.settingsService.getSetting<number>(
      'matching.maxSharePerSupplier',
      0.6,
    );
    const minSupplierQualitySetting = await this.settingsService.getSetting<number>(
      'matching.minSupplierQuality',
      60,
    );

    const minScoreThreshold = Math.max(
      minSupplierQualitySetting,
      demand.minQualityScore,
    );

    // 2. Ambil Harga Acuan Wilayah Dapur
    const priceRef = await this.prisma.priceReference.findFirst({
      where: {
        commodityId: demand.commodityId,
        regionId: demand.kitchen.regionId,
        validTo: null,
      },
      orderBy: { validFrom: 'desc' },
    });

    const referencePrice = priceRef ? Number(priceRef.referencePrice) : 8000;
    const floorPrice = priceRef ? Number(priceRef.floorPrice) : 0;

    // 3. Pemasok yang pernah menolak atau tawaran kedaluwarsa pada demand ini dikecualikan (docs/04 bagian 4.1 point 7)
    const excludedSupplierIds = new Set<string>();
    for (const ord of demand.orders) {
      if (
        ord.status === OrderStatus.REJECTED ||
        ord.status === OrderStatus.EXPIRED
      ) {
        excludedSupplierIds.add(ord.supplierId);
      }
    }

    // 4. Ambil seluruh SupplyOffer aktif untuk komoditas yang sama
    const offers = await this.prisma.supplyOffer.findMany({
      where: {
        commodityId: demand.commodityId,
        status: OfferStatus.ACTIVE,
      },
      include: {
        supplier: {
          include: { user: true },
        },
      },
    });

    const neededDateObj = new Date(demand.neededDate);
    const demandQty = Number(demand.quantity);
    const capMax = demandQty * maxSharePerSupplier;

    const candidates: CandidatePreview[] = [];

    for (const offer of offers) {
      const supplier = offer.supplier;

      // 4.1 Filter: Pemasok harus ACTIVE dan belum dikecualikan
      if (supplier.user.status !== 'ACTIVE' || excludedSupplierIds.has(supplier.id)) {
        continue;
      }

      // 4.2 Filter: Stok bebas (available = quantityAvailable - quantityReserved > 0)
      const available = Math.max(
        0,
        Number(offer.quantityAvailable) - Number(offer.quantityReserved),
      );
      if (available <= 0) continue;

      // 4.3 Filter: Tanggal Panen harvestDate <= neededDate dan umur <= masa simpan komoditas
      const harvestDateObj = new Date(offer.harvestDate);
      const diffTime = neededDateObj.getTime() - harvestDateObj.getTime();
      const ageDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (harvestDateObj > neededDateObj || ageDays > demand.commodity.shelfLifeDays) {
        continue;
      }

      // 4.4 Filter: askingPrice <= maxPricePerUnit dan askingPrice >= floorPrice
      const askingPrice = Number(offer.askingPrice);
      if (askingPrice > Number(demand.maxPricePerUnit) || askingPrice < floorPrice) {
        continue;
      }

      // 4.5 Filter: qualityScore >= ambang batas minimal
      const qualityScore = Number(supplier.qualityScore);
      if (qualityScore < minScoreThreshold) continue;

      // 4.6 Hitung Jarak (gunakan testDistanceMap jika disediakan dalam pengujian, jika tidak gunakan Haversine)
      const distanceKm =
        testDistanceMap?.get(supplier.id) ??
        calculateHaversineDistance(
          supplier.latitude,
          supplier.longitude,
          demand.kitchen.latitude,
          demand.kitchen.longitude,
        );

      // Batas keras jarak: distanceKm <= maxRadiusKm * 2
      if (distanceKm > maxRadiusKm * 2) continue;

      // 4.7 Hitung Skor Kecocokan Komprehensif
      const reliabilityRate = Number(supplier.reliabilityRate);
      const scoreComponents = calculateMatchScore(
        distanceKm,
        maxRadiusKm,
        qualityScore,
        askingPrice,
        referencePrice,
        ageDays,
        demand.commodity.shelfLifeDays,
        reliabilityRate,
        weights,
      );

      const cappedQuantity = Math.min(available, capMax);
      const estimatedTotal = Math.round(cappedQuantity * askingPrice);

      candidates.push({
        offerId: offer.id,
        supplierId: supplier.id,
        supplierName: supplier.displayName,
        village: supplier.village,
        distanceKm,
        availableQuantity: available,
        harvestDate: offer.harvestDate.toISOString().split('T')[0],
        ageDays,
        askingPrice,
        qualityScore,
        reliabilityRate,
        scoreComponents,
        cappedQuantity,
        estimatedTotal,
      });
    }

    // Urutkan kandidat menurun berdasarkan matchScore (tie-break: jarak terdekat, lalu offerId)
    candidates.sort((a, b) => {
      if (b.scoreComponents.matchScore !== a.scoreComponents.matchScore) {
        return b.scoreComponents.matchScore - a.scoreComponents.matchScore;
      }
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return a.offerId.localeCompare(b.offerId);
    });

    return {
      demand,
      candidates,
      referencePrice,
    };
  }

  /**
   * Menjalankan alokasi greedy dengan batas cap 60% dalam satu transaksi atomik
   * docs/04 bagian 4.3 & docs/09 bagian 6
   */
  async matchAndAllocate(
    demandId: string,
    userId: string,
    userRole: Role,
    testDistanceMap?: Map<string, number>,
    ipAddress?: string,
  ) {
    const { demand, candidates } = await this.findCandidates(
      demandId,
      testDistanceMap,
    );

    if (
      demand.status !== DemandStatus.OPEN &&
      demand.status !== DemandStatus.PARTIALLY_FULFILLED &&
      demand.status !== DemandStatus.MATCHING
    ) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Hanya permintaan OPEN atau PARTIALLY_FULFILLED yang dapat dicocokkan',
      });
    }

    // 1. Hitung sisa kebutuhan yang belum dialokasikan ke order aktif
    const activeOrders = demand.orders.filter(
      (o: any) =>
        o.status !== OrderStatus.REJECTED &&
        o.status !== OrderStatus.EXPIRED &&
        o.status !== OrderStatus.CANCELLED,
    );

    const allocatedQuantity = activeOrders.reduce(
      (sum: number, o: any) => sum + Number(o.quantity),
      0,
    );

    let remaining = Math.max(0, Number(demand.quantity) - allocatedQuantity);

    if (remaining <= 0) {
      return {
        message: 'Permintaan bahan sudah terpenuhi penuh',
        createdOrders: [],
      };
    }

    if (candidates.length === 0) {
      // Tidak ada kandidat pemasok yang memenuhi syarat: status tetap OPEN (docs/03 bagian 8)
      return {
        message: 'Tidak ada kandidat pasokan yang memenuhi kriteria saat ini',
        createdOrders: [],
      };
    }

    // 2. Ambil parameter waktu tanggap tawaran (default: 12 jam)
    const responseWindowHours = await this.settingsService.getSetting<number>(
      'order.responseWindowHours',
      12,
    );

    const maxSharePerSupplier = await this.settingsService.getSetting<number>(
      'matching.maxSharePerSupplier',
      0.6,
    );

    const capMax = Number(demand.quantity) * maxSharePerSupplier;
    const now = new Date();
    const offerExpiresAt = new Date(now.getTime() + responseWindowHours * 60 * 60 * 1000);

    const createdOrders: any[] = [];

    // 3. Jalankan Alokasi Greedy dalam Transaksi Database Atomik
    await this.prisma.$transaction(async (tx) => {
      for (const cand of candidates) {
        if (remaining <= 0) break;

        // Ambil penawaran terbaru untuk mengunci kuantitas terkini
        const currentOffer = await tx.supplyOffer.findUnique({
          where: { id: cand.offerId },
        });

        if (!currentOffer || currentOffer.status !== OfferStatus.ACTIVE) {
          continue;
        }

        const freshAvailable = Math.max(
          0,
          Number(currentOffer.quantityAvailable) - Number(currentOffer.quantityReserved),
        );

        if (freshAvailable <= 0) continue;

        // Rumus Alokasi: alloc = min(remaining, available, cap)
        const alloc = Math.min(remaining, freshAvailable, capMax);
        if (alloc <= 0) continue;

        // Generate nomor order unik (Format: ORD-YYYYMMDD-XXXX)
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
        const orderNo = `ORD-${dateStr}-${randomHex}`;

        // Buat Order berstatus PROPOSED
        const newOrder = await tx.order.create({
          data: {
            orderNo,
            demandId: demand.id,
            offerId: currentOffer.id,
            supplierId: cand.supplierId,
            kitchenId: demand.kitchenId,
            commodityId: demand.commodityId,
            quantity: alloc,
            pricePerUnit: cand.askingPrice,
            matchScore: cand.scoreComponents.matchScore,
            status: OrderStatus.PROPOSED,
            offerExpiresAt,
          },
          include: {
            supplier: true,
            commodity: true,
          },
        });

        // Naikkan kuantitas tereservasi pada penawaran stok
        await tx.supplyOffer.update({
          where: { id: currentOffer.id },
          data: {
            quantityReserved: { increment: alloc },
          },
        });

        remaining -= alloc;
        createdOrders.push(newOrder);

        // Kirim notifikasi tawaran pesanan baru ke pemasok
        if (this.notificationsService && cand.supplierId) {
          const supProfile = await tx.supplierProfile.findUnique({
            where: { id: cand.supplierId },
            select: { userId: true },
          });
          if (supProfile?.userId) {
            await this.notificationsService.createNotification(
              {
                userId: supProfile.userId,
                type: 'ORDER_PROPOSED',
                title: 'Tawaran Pesanan Baru Masuk!',
                body: `Dapur ${demand.kitchen?.name || ''} membutuhkan ${alloc} kg ${demand.commodity?.name || ''} (@ Rp ${cand.askingPrice.toLocaleString('id-ID')}). Silakan tanggapi dalam 12 jam.`,
                link: '/supplier/orders',
              },
              tx,
            );
          }
        }
      }

      // Perbarui status DemandRequest: jika order berhasil dibuat, transisi ke MATCHING
      if (createdOrders.length > 0) {
        await tx.demandRequest.update({
          where: { id: demand.id },
          data: {
            status: DemandStatus.MATCHING,
          },
        });
      }
    });

    await this.auditService.log({
      action: 'MATCHING_ALLOCATED',
      entity: 'DemandRequest',
      entityId: demand.id,
      userId,
      ipAddress,
      meta: {
        demandId: demand.id,
        createdOrdersCount: createdOrders.length,
        orders: createdOrders.map((o) => ({
          orderNo: o.orderNo,
          supplier: o.supplier.displayName,
          quantity: Number(o.quantity),
          price: Number(o.pricePerUnit),
          matchScore: Number(o.matchScore),
        })),
      },
    });

    return {
      message: `Berhasil mengalokasikan ${createdOrders.length} pesanan ke pemasok lokal`,
      remainingQuantity: remaining,
      createdOrders,
    };
  }
}
