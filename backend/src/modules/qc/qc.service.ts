import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  OrderStatus,
  QcResult,
  LedgerStage,
  Role,
} from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ReceiveOrderDto, SubmitQualityCheckDto } from './dto/qc.dto';

@Injectable()
export class QcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    private readonly ledgerService: LedgerService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Pengelola Dapur menerima barang yang tiba (POST /orders/:id/receive)
   * Mengubah status order IN_TRANSIT -> RECEIVED, mencatat Batch.receivedQuantity
   * docs/06 M6 & docs/04 bagian 6
   */
  async receiveOrder(
    orderId: string,
    dto: ReceiveOrderDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    if (user.role !== Role.KITCHEN_MANAGER && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya pengelola dapur atau admin yang dapat mencatat penerimaan pesanan',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          kitchen: true,
          batch: true,
        },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      // Validasi scoping dapur
      if (user.role === Role.KITCHEN_MANAGER && order.kitchen.managerId !== user.sub) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_RESOURCE',
          message: 'Anda tidak berhak menerima pesanan untuk dapur lain',
        });
      }

      // Validasi status: order harus IN_TRANSIT
      if (order.status !== OrderStatus.IN_TRANSIT) {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Hanya pesanan berstatus IN_TRANSIT yang dapat diterima di dapur (status saat ini: ${order.status})`,
        });
      }

      if (!order.batch) {
        throw new BadRequestException({
          code: 'BATCH_NOT_FOUND',
          message: 'Batch pengiriman untuk pesanan ini belum terbit',
        });
      }

      // Pemeriksaan toleransi selisih penerimaan (default 2% - docs/04 bagian 0 & 8)
      const discrepancyTolerancePct = await this.settingsService.getSetting<number>(
        'receive.discrepancyTolerancePct',
        2,
      );

      const shippedQty = Number(order.batch.shippedQuantity);
      const receivedQty = Number(dto.receivedQuantity);
      const diffPct = Math.abs((receivedQty - shippedQty) / shippedQty) * 100;

      if (diffPct > discrepancyTolerancePct && (!dto.note || dto.note.trim().length < 5)) {
        throw new BadRequestException({
          code: 'DISCREPANCY_NOTE_REQUIRED',
          message: `Selisih penerimaan (${diffPct.toFixed(1)}%) melebihi batas toleransi ${discrepancyTolerancePct}%. Catatan serah terima wajib diisi minimal 5 karakter.`,
        });
      }

      const now = new Date();

      // 1. Update Batch: receivedQuantity, receivedAt, receiveNote, receivePhotoUrls
      const updatedBatch = await tx.batch.update({
        where: { id: order.batch.id },
        data: {
          receivedQuantity: receivedQty,
          receivedAt: now,
          receiveNote: dto.note || null,
          receivePhotoUrls: dto.photoUrls || [],
        },
      });

      // 2. Update status Order menjadi RECEIVED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.RECEIVED,
        },
      });

      await this.auditService.log({
        action: 'ORDER_RECEIVED',
        entity: 'Order',
        entityId: order.id,
        userId: user.sub,
        ipAddress,
        meta: {
          orderNo: order.orderNo,
          batchCode: order.batch.batchCode,
          shippedQuantity: shippedQty,
          receivedQuantity: receivedQty,
          diffPct: Number(diffPct.toFixed(2)),
          note: dto.note,
        },
      });

      return {
        message: 'Penerimaan pesanan berhasil dicatat. Batch siap untuk pemeriksaan mutu (QC).',
        order: updatedOrder,
        batch: updatedBatch,
      };
    });
  }

  /**
   * Mengambil antrean batch yang menunggu pemeriksaan mutu
   * Endpoint: GET /quality-queue (docs/06 M6)
   */
  async getQualityQueue(user: JwtPayload) {
    if (user.role !== Role.QUALITY_INSPECTOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya pengawas mutu atau admin yang dapat mengakses antrean pemeriksaan mutu',
      });
    }

    const regionFilter = user.regionId
      ? { order: { kitchen: { regionId: user.regionId } } }
      : {};

    const batches = await this.prisma.batch.findMany({
      where: {
        order: {
          status: OrderStatus.RECEIVED,
        },
        qualityChecks: {
          none: {}, // Belum pernah diinspeksi
        },
        ...regionFilter,
      },
      include: {
        order: {
          include: {
            commodity: {
              include: { qualityStandard: true },
            },
            kitchen: true,
            supplier: true,
          },
        },
      },
      orderBy: { receivedAt: 'asc' },
    });

    return batches.map((b) => ({
      id: b.id,
      batchCode: b.batchCode,
      orderId: b.orderId,
      orderNo: b.order.orderNo,
      commodityId: b.order.commodityId,
      commodityName: b.order.commodity.name,
      kitchenName: b.order.kitchen.name,
      supplierName: b.order.supplier.displayName,
      originVillage: b.originVillage,
      harvestDate: b.harvestDate,
      shippedQuantity: Number(b.shippedQuantity),
      receivedQuantity: Number(b.receivedQuantity),
      receivedAt: b.receivedAt,
      qualityStandard: b.order.commodity.qualityStandard,
    }));
  }

  /**
   * Mengambil detail satu Batch beserta standar mutu dan riwayat QC
   * Endpoint: GET /batches/:id
   */
  async getBatchById(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            commodity: {
              include: { qualityStandard: true },
            },
            kitchen: true,
            supplier: true,
          },
        },
        qualityChecks: {
          include: {
            inspector: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException({
        code: 'BATCH_NOT_FOUND',
        message: 'Batch tidak ditemukan',
      });
    }

    return {
      ...batch,
      shippedQuantity: Number(batch.shippedQuantity),
      receivedQuantity: batch.receivedQuantity ? Number(batch.receivedQuantity) : null,
      order: {
        ...batch.order,
        quantity: Number(batch.order.quantity),
        pricePerUnit: Number(batch.order.pricePerUnit),
      },
      qualityChecks: batch.qualityChecks.map((qc) => ({
        ...qc,
        receivedQuantity: Number(qc.receivedQuantity),
        acceptedQuantity: Number(qc.acceptedQuantity),
        rejectedQuantity: Number(qc.rejectedQuantity),
      })),
    };
  }

  /**
   * Pengawas Mutu menyerahkan hasil inspeksi kontrol mutu (QC)
   * Endpoint: POST /batches/:id/quality-checks (docs/06 M6 & docs/04 bagian 6)
   * Menjalankan:
   * 1. Hitung skor checklist berbobot
   * 2. Evaluasi hasil: PASS, PARTIAL, atau FAIL
   * 3. Satu transaksi atomik: QualityCheck, transisi OrderStatus, entri Ledger, pembaruan skor mutu pemasok
   */
  async submitQualityCheck(
    batchId: string,
    dto: SubmitQualityCheckDto,
    user: JwtPayload,
    ipAddress?: string,
  ) {
    if (user.role !== Role.QUALITY_INSPECTOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_RESOURCE',
        message: 'Hanya pengawas mutu atau admin yang dapat mengirimkan hasil kontrol mutu',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Ambil Batch dan Order
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        include: {
          qualityChecks: true,
          order: {
            include: {
              commodity: {
                include: { qualityStandard: true },
              },
              kitchen: true,
              supplier: true,
              ledger: true,
            },
          },
        },
      });

      if (!batch) {
        throw new NotFoundException({
          code: 'BATCH_NOT_FOUND',
          message: 'Batch pengiriman tidak ditemukan',
        });
      }

      // Kriteria Penerimaan: Satu QC final per batch (QC ganda ditolak 409 docs/06 M6)
      if (batch.qualityChecks.length > 0) {
        throw new ConflictException({
          code: 'QC_ALREADY_SUBMITTED',
          message: 'Batch ini sudah selesai diperiksa mutu dan tidak dapat diubah.',
        });
      }

      if (batch.order.status !== OrderStatus.RECEIVED) {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Hanya batch berstatus RECEIVED yang dapat diperiksa mutu (saat ini ${batch.order.status})`,
        });
      }

      const receivedQty = Number(batch.receivedQuantity);
      const acceptedQty = Number(dto.acceptedQuantity);
      const rejectedQty = Number(dto.rejectedQuantity);

      // Kriteria Penerimaan: accepted + rejected = received (docs/06 M6)
      if (Math.abs(acceptedQty + rejectedQty - receivedQty) > 0.001) {
        throw new BadRequestException({
          code: 'QUANTITY_SUM_MISMATCH',
          message: `Jumlah kuantitas diterima (${acceptedQty} kg) + ditolak (${rejectedQty} kg) harus tepat sama dengan kuantitas tiba di dapur (${receivedQty} kg).`,
        });
      }

      // Kriteria Penerimaan: ditolak > 0 wajib catatan minimal 10 karakter (docs/04 bagian 6.2 & docs/06 M6)
      if (rejectedQty > 0 && (!dto.notes || dto.notes.trim().length < 10)) {
        throw new BadRequestException({
          code: 'REJECTION_NOTE_REQUIRED',
          message: 'Setiap penolakan bahan pangan wajib disertai catatan alasan minimal 10 karakter.',
        });
      }

      // 2. Ambil Standar Mutu Komoditas
      const standard = batch.order.commodity.qualityStandard;
      const passScore = standard?.passScore ?? 70;
      const checklistItems: any[] = (standard?.checklist as any[]) || [
        { key: 'freshness', weight: 40 },
        { key: 'physicalCondition', weight: 25 },
        { key: 'sizeUniformity', weight: 15 },
        { key: 'cleanliness', weight: 10 },
        { key: 'handlingTemperature', weight: 10 },
      ];

      // 3. Hitung Skor Checklist Terbobot di Sisi Server (docs/04 bagian 6.1)
      let calculatedScore = 0;
      for (const item of checklistItems) {
        const itemVal = dto.checklistScores[item.key] ?? 0;
        calculatedScore += (itemVal * item.weight) / 100;
      }
      calculatedScore = Math.round(calculatedScore);

      // Kriteria Penerimaan: skor < passScore dan ditolak 0 dilarang (docs/04 bagian 6.2 & docs/06 M6)
      if (calculatedScore < passScore && rejectedQty === 0) {
        throw new UnprocessableEntityException({
          code: 'SCORE_BELOW_PASS_REQUIRES_REJECTION',
          message: `Skor mutu (${calculatedScore}) berada di bawah ambang kelulusan (${passScore}). Wajib menolak sebagian atau seluruh kuantitas bahan.`,
        });
      }

      // 4. Tentukan Hasil QC dan Status Order
      let qcResult: QcResult;
      let targetOrderStatus: OrderStatus;

      if (rejectedQty === 0 && calculatedScore >= passScore) {
        qcResult = QcResult.PASS;
        targetOrderStatus = OrderStatus.QC_PASSED;
      } else if (acceptedQty > 0 && rejectedQty > 0) {
        qcResult = QcResult.PARTIAL;
        targetOrderStatus = OrderStatus.QC_PARTIAL;
      } else {
        qcResult = QcResult.FAIL;
        targetOrderStatus = OrderStatus.QC_FAILED;
      }

      // 5. Simpan Record QualityCheck
      const createdQc = await tx.qualityCheck.create({
        data: {
          batchId: batch.id,
          inspectorId: user.sub,
          score: calculatedScore,
          checklistScores: dto.checklistScores,
          receivedQuantity: receivedQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: rejectedQty,
          result: qcResult,
          notes: dto.notes || null,
          photoUrls: dto.photoUrls || [],
        },
      });

      // 6. Efek Buku Besar (Ledger) Sesuai docs/04 Bagian 7 & Vektor Uji docs/09 Bagian 6
      const pricePerUnit = Number(batch.order.pricePerUnit);
      const holdEntry = batch.order.ledger.find((l) => l.stage === LedgerStage.HOLD);
      const holdAmount = holdEntry ? Number(holdEntry.amount) : Math.round(Number(batch.order.quantity) * pricePerUnit);

      if (qcResult === QcResult.PASS) {
        // PASS: RELEASE penuh sebesar ROUND(accepted * price)
        const releaseAmount = Math.round(acceptedQty * pricePerUnit);
        await this.ledgerService.record(
          {
            orderId: batch.order.id,
            stage: LedgerStage.RELEASE,
            amount: releaseAmount,
            note: `Pencairan pembayaran penuh hasil QC Lolos (Batch ${batch.batchCode})`,
            userId: user.sub,
            ipAddress,
          },
          tx,
        );
        // Setelah RELEASE tercatat, status order langsung PAID (docs/04 bagian 7)
        targetOrderStatus = OrderStatus.PAID;
      } else if (qcResult === QcResult.PARTIAL) {
        // PARTIAL: RELEASE = accepted * price, VOID = HOLD - RELEASE (docs/04 bagian 7 & docs/09 bagian 6)
        const releaseAmount = Math.round(acceptedQty * pricePerUnit);
        const voidAmount = holdAmount - releaseAmount;

        await this.ledgerService.record(
          {
            orderId: batch.order.id,
            stage: LedgerStage.RELEASE,
            amount: releaseAmount,
            note: `Pencairan sebagian ${acceptedQty} kg (Batch ${batch.batchCode})`,
            userId: user.sub,
            ipAddress,
          },
          tx,
        );

        if (voidAmount > 0) {
          await this.ledgerService.record(
            {
              orderId: batch.order.id,
              stage: LedgerStage.VOID,
              amount: voidAmount,
              note: `Pembatalan sisa ${rejectedQty} kg yang ditolak QC (Batch ${batch.batchCode})`,
              userId: user.sub,
              ipAddress,
            },
            tx,
          );
        }
        // Setelah RELEASE tercatat, order berstatus PAID
        targetOrderStatus = OrderStatus.PAID;
      } else {
        // FAIL: VOID seluruh nilai HOLD
        await this.ledgerService.record(
          {
            orderId: batch.order.id,
            stage: LedgerStage.VOID,
            amount: holdAmount,
            note: `Pembatalan seluruh dana akibat QC Ditolak Total (Batch ${batch.batchCode})`,
            userId: user.sub,
            ipAddress,
          },
          tx,
        );
        targetOrderStatus = OrderStatus.QC_FAILED;
      }

      // 7. Update Status Order
      await tx.order.update({
        where: { id: batch.order.id },
        data: { status: targetOrderStatus },
      });

      // 8. Pembaruan Skor Mutu Pemasok via EMA (docs/04 bagian 6.3)
      const alpha = await this.settingsService.getSetting<number>(
        'supplier.qualityEmaAlpha',
        0.2,
      );
      const oldQuality = Number(batch.order.supplier.qualityScore);
      const newQuality = Number(
        ((1 - alpha) * oldQuality + alpha * calculatedScore).toFixed(2),
      );

      await tx.supplierProfile.update({
        where: { id: batch.order.supplierId },
        data: { qualityScore: newQuality },
      });

      // 9. Catat Audit Log
      await this.auditService.log({
        action: 'QC_SUBMITTED',
        entity: 'QualityCheck',
        entityId: createdQc.id,
        userId: user.sub,
        ipAddress,
        meta: {
          batchCode: batch.batchCode,
          orderNo: batch.order.orderNo,
          score: calculatedScore,
          result: qcResult,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: rejectedQty,
          newQualityScore: newQuality,
        },
      });

      // 10. Kirim Notifikasi ke Dapur & Pemasok (docs/03 Bagian 6)
      if (this.notificationsService) {
        // Notifikasi ke Pengelola Dapur
        if (batch.order.kitchen?.managerId) {
          await this.notificationsService.createNotification(
            {
              userId: batch.order.kitchen.managerId,
              type: 'QC_COMPLETED',
              title: `Hasil QC: ${qcResult === QcResult.PASS ? 'Lolos Penuh' : qcResult === QcResult.PARTIAL ? 'Lolos Sebagian' : 'Ditolak'} (${calculatedScore})`,
              body: `Inspeksi mutu batch ${batch.batchCode} (${batch.order.commodity.name}): ${acceptedQty} kg diterima, ${rejectedQty} kg ditolak.`,
              link: `/kitchen/receiving`,
            },
            tx,
          );
        }

        // Notifikasi ke Pemasok
        if (batch.order.supplier?.userId) {
          await this.notificationsService.createNotification(
            {
              userId: batch.order.supplier.userId,
              type: 'QC_COMPLETED',
              title: `Hasil Mutu Panen: ${qcResult} (${calculatedScore} Poin)`,
              body: `Pesanan ${batch.order.orderNo} (${batch.order.commodity.name}) telah diperiksa: ${acceptedQty} kg disetujui untuk dicairkan. Skor mutu Anda kini ${newQuality}.`,
              link: `/supplier/payments`,
            },
            tx,
          );
        }
      }

      return {
        message: `Inspeksi mutu selesai dengan hasil ${qcResult} (Skor: ${calculatedScore}). Status pembayaran telah disesuaikan di buku besar.`,
        qualityCheck: createdQc,
        orderStatus: targetOrderStatus,
        newSupplierQualityScore: newQuality,
      };
    });
  }
}
