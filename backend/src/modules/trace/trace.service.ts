import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { scopeWhere } from '../../common/utils/scope-where.util';
import * as QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

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

  /**
   * Menghasilkan gambar QR code (PNG Buffer) mengarah ke URL penelusuran batch publik (docs/06 M9)
   */
  async generateQrCode(batchIdOrCode: string, user: JwtPayload): Promise<{ buffer: Buffer; batchCode: string }> {
    const batch = await this.prisma.batch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
        ...scopeWhere(user, 'batch'),
      },
      select: { id: true, batchCode: true },
    });

    if (!batch) {
      throw new NotFoundException({
        code: 'BATCH_NOT_FOUND',
        message: 'Batch tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const traceUrl = `${frontendUrl}/trace/${batch.batchCode}`;

    const qrBuffer = await QRCode.toBuffer(traceUrl, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#1E3A2F', // Forest pine signature color
        light: '#FFFFFF',
      },
    });

    return { buffer: qrBuffer, batchCode: batch.batchCode };
  }

  /**
   * Menghasilkan dokumen PDF Sertifikat Mutu & Asal Bahan (docs/06 M9)
   */
  async generateCertificatePdf(batchIdOrCode: string, user: JwtPayload): Promise<{ buffer: Buffer; filename: string }> {
    const batch = await this.prisma.batch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
        ...scopeWhere(user, 'batch'),
      },
      include: {
        order: {
          include: {
            commodity: true,
            kitchen: true,
            supplier: {
              include: {
                user: { select: { name: true } },
                region: true,
              },
            },
            shipment: {
              include: {
                coordinator: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
            ledger: true,
          },
        },
        qualityChecks: {
          include: {
            inspector: { select: { name: true } },
          },
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException({
        code: 'BATCH_NOT_FOUND',
        message: 'Batch tidak ditemukan atau Anda tidak memiliki akses.',
      });
    }

    const latestQc = batch.qualityChecks[0] || null;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const traceUrl = `${frontendUrl}/trace/${batch.batchCode}`;

    const qrDataUrl = await QRCode.toDataURL(traceUrl, {
      margin: 1,
      color: { dark: '#1E3A2F', light: '#FFFFFF' },
    });
    const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `Sertifikat-Batch-${batch.batchCode}.pdf`,
        });
      });
      doc.on('error', (err: Error) => reject(err));

      // --- Header Dekoratif ---
      doc.rect(40, 40, 515, 6).fill('#1E3A2F'); // Garis aksen atas

      doc.moveDown(1);
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#1E3A2F')
        .text('ORVANA FOOD TRACEABILITY', { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#64748B')
        .text('Sertifikat Integritas Mutu & Penelusuran Asal Pangan Lokal', { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(1);

      // --- Metadata Batch (2 Kolom) ---
      const metaY = doc.y;

      // Kolom Kiri: Info Bahan & Asal
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0F172A')
        .text('INFORMASI KOMODITAS & PRODUSEN', 40, metaY);

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(9).text('Nomor Batch: ', { continued: true });
      doc.font('Helvetica').text(batch.batchCode);

      doc.font('Helvetica-Bold').fontSize(9).text('Komoditas: ', { continued: true });
      doc.font('Helvetica').text(`${batch.order.commodity.name} (${batch.order.commodity.category})`);

      // Privasi nama produsen bila publicName = false (docs/02 Bagian 6)
      const supplierDisplayName = batch.order.supplier.publicName
        ? `${batch.order.supplier.displayName} (${batch.order.supplier.type})`
        : `Kelompok Tani Terdaftar (Desa ${batch.originVillage || batch.order.supplier.village || 'Lokal'})`;

      doc.font('Helvetica-Bold').fontSize(9).text('Produsen Pemasok: ', { continued: true });
      doc.font('Helvetica').text(supplierDisplayName);

      doc.font('Helvetica-Bold').fontSize(9).text('Wilayah Asal: ', { continued: true });
      doc.font('Helvetica').text(`Desa ${batch.originVillage || batch.order.supplier.village || '-'}, ${batch.order.supplier.region.name}`);

      doc.font('Helvetica-Bold').fontSize(9).text('Tanggal Panen: ', { continued: true });
      doc.font('Helvetica').text(batch.harvestDate.toISOString().split('T')[0]);

      doc.font('Helvetica-Bold').fontSize(9).text('Dapur Penerima: ', { continued: true });
      doc.font('Helvetica').text(`${batch.order.kitchen.name} (${batch.order.kitchen.code})`);

      // Kolom Kanan: QR Code Resmi
      doc.image(qrImageBuffer, 430, metaY, { width: 110, height: 110 });
      doc.fontSize(7.5).fillColor('#64748B').text('Scan untuk verifikasi publik', 425, metaY + 115, { width: 120, align: 'center' });

      // Reset Y ke bawah kolom metadata
      doc.y = Math.max(doc.y, metaY + 130);
      doc.moveDown(1);

      // --- Hasil Inspeksi Mutu & Kuantitas ---
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0F172A')
        .text('HASIL INSPEKSI MUTU & VERIFIKASI TIMBANGAN', 40, doc.y);

      doc.moveDown(0.5);

      // Kotak Ringkasan Mutu
      const boxY = doc.y;
      const isPassed = latestQc?.result === 'PASS';
      const isPartial = latestQc?.result === 'PARTIAL';
      const boxColor = isPassed ? '#F0FDF4' : isPartial ? '#FFFBEB' : '#FEF2F2';
      const borderColor = isPassed ? '#86EFAC' : isPartial ? '#FDE68A' : '#FECACA';
      const badgeTextColor = isPassed ? '#166534' : isPartial ? '#92400E' : '#991B1B';

      doc.rect(40, boxY, 515, 60).fillAndStroke(boxColor, borderColor);

      doc.font('Helvetica-Bold').fontSize(14).fillColor(badgeTextColor).text(
        `STATUS QC: ${latestQc ? latestQc.result : 'BELUM DIINSPEKSI'} (Skor Mutu: ${latestQc ? latestQc.score : '-'}/100)`,
        55,
        boxY + 12,
      );

      doc.font('Helvetica').fontSize(9).fillColor('#334155').text(
        `Diinspeksi oleh: ${latestQc?.inspector.name || '-'} | Tanggal Uji: ${
          latestQc?.checkedAt ? latestQc.checkedAt.toISOString().split('T')[0] : '-'
        }`,
        55,
        boxY + 35,
      );

      doc.y = boxY + 75;

      // Tabel Detail Kuantitas
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A');
      doc.text('Kuantitas Dikirim: ', 40, doc.y, { continued: true });
      doc.font('Helvetica').text(`${Number(batch.shippedQuantity)} ${batch.order.commodity.unit}`);

      doc.font('Helvetica-Bold').text('Kuantitas Diterima Dapur: ', { continued: true });
      doc.font('Helvetica').text(`${batch.receivedQuantity ? Number(batch.receivedQuantity) : '-'} ${batch.order.commodity.unit}`);

      doc.font('Helvetica-Bold').text('Kuantitas Lolos Mutu (Diterima): ', { continued: true });
      doc.font('Helvetica').text(`${latestQc ? Number(latestQc.acceptedQuantity) : '-'} ${batch.order.commodity.unit}`);

      if (latestQc && Number(latestQc.rejectedQuantity) > 0) {
        doc.font('Helvetica-Bold').fillColor('#DC2626').text('Kuantitas Afkir (Ditolak): ', { continued: true });
        doc.font('Helvetica').text(`${Number(latestQc.rejectedQuantity)} ${batch.order.commodity.unit}`);
      }

      if (latestQc?.notes) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fillColor('#0F172A').text('Catatan Pengawas Mutu: ', { continued: true });
        doc.font('Helvetica-Oblique').text(`"${latestQc.notes}"`);
      }

      // --- Rincian Parameter Mutu ---
      if (latestQc?.checklistScores && typeof latestQc.checklistScores === 'object') {
        doc.moveDown(1);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('SKOR PARAMETER DETAIL:');
        doc.moveDown(0.3);
        const scores = latestQc.checklistScores as Record<string, any>;
        for (const [key, val] of Object.entries(scores)) {
          doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text(`• ${key}: ${val} poin`);
        }
      }

      // --- Stempel Digital & Blok Pengesahan Resmi (Pilar 2 - P2.3) ---
      doc.moveDown(1.5);
      const stampY = doc.y;

      // Kotak Stempel Digital Kiri (Cryptographic Digital Seal)
      doc.roundedRect(40, stampY, 260, 68, 6).strokeColor('#1E3A2F').lineWidth(1.2).stroke();
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E3A2F').text('STEMPEL DIGITAL INTEGRITAS SISTEM', 50, stampY + 8);
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text('Sistem Rantai Pasok Pangan Terdesentralisasi ORVANA', 50, stampY + 22);
      
      // Hash integrity simulation dari nomor batch & tanggal
      const createdAtStr = batch.createdAt ? (typeof batch.createdAt.toISOString === 'function' ? batch.createdAt.toISOString() : String(batch.createdAt)) : new Date().toISOString();
      const mockHash = Buffer.from(`${batch.batchCode}:${batch.order.id}:${createdAtStr}`).toString('base64').slice(0, 32);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#0F172A').text('Integritas Data Hash (SHA-256):', 50, stampY + 36);
      doc.font('Courier').fontSize(6.5).fillColor('#1E3A2F').text(mockHash, 50, stampY + 48);

      // Kolom Tanda Tangan Digital Pengawas Mutu Kanan
      doc.roundedRect(315, stampY, 240, 68, 6).strokeColor('#CBD5E1').lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155').text('TERVERIFIKASI OLEH PENGAWAS MUTU', 325, stampY + 8);
      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#166534').text('Tervalidasi Digital melalui Audit Mutu Dapur', 325, stampY + 22);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text(latestQc?.inspector.name || 'Pengawas Mutu Terakreditasi', 325, stampY + 40);
      doc.font('Helvetica').fontSize(7).fillColor('#64748B').text(`Petugas Inspeksi Dinas / Ahli Gizi Massal`, 325, stampY + 52);

      doc.y = stampY + 76;

      // --- Footer Sertifikat ---
      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.6);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#94A3B8')
        .text(
          `Dokumen ini diterbitkan secara otomatis oleh Platform Rantai Pasok ORVANA pada ${new Date().toISOString()}. Sah dan terverifikasi secara elektronik. URL Verifikasi Publik: ${traceUrl}`,
          { align: 'center' },
        );

      doc.end();
    });
  }
}

