import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerStage, Role } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { scopeWhere } from '../../common/utils/scope-where.util';

export interface RecordLedgerParams {
  orderId: string;
  stage: LedgerStage;
  amount: number;
  note?: string;
  userId?: string;
  ipAddress?: string;
}

export interface LedgerSummary {
  orderId: string;
  orderNo: string;
  holdAmount: number;
  totalReleased: number;
  totalVoid: number;
  totalAdjustment: number;
  effectiveReleased: number;
  effectiveVoid: number;
  isBalanced: boolean;
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Mencatat mutasi ledger dengan pemeriksaan invarian bisnis ketat
   * Sesuai docs/04 bagian 7:
   * HOLD = Σ RELEASE + Σ VOID
   * effectiveReleased = Σ RELEASE + Σ ADJUSTMENT >= 0
   * effectiveVoid = Σ VOID - Σ ADJUSTMENT >= 0
   * effectiveReleased + effectiveVoid === HOLD
   * Bersifat APPEND-ONLY
   */
  async record(
    params: RecordLedgerParams,
    externalTx?: any,
  ) {
    const { orderId, stage, amount, note, userId, ipAddress } = params;

    const executeInTransaction = async (tx: any) => {
      // 1. Verifikasi Order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          ledger: true,
        },
      });

      if (!order) {
        throw new NotFoundException({
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        });
      }

      const existingEntries = order.ledger;
      const roundedAmount = Math.round(amount);

      if (stage !== LedgerStage.ADJUSTMENT && roundedAmount <= 0) {
        throw new BadRequestException({
          code: 'INVALID_LEDGER_AMOUNT',
          message: 'Jumlah nominal ledger harus lebih besar dari 0',
        });
      }

      // Hitung agregat mutasi yang sudah ada
      let currentHold = 0;
      let currentRelease = 0;
      let currentVoid = 0;
      let currentAdjustment = 0;

      for (const entry of existingEntries) {
        const entryAmount = Number(entry.amount);
        if (entry.stage === LedgerStage.HOLD) currentHold += entryAmount;
        else if (entry.stage === LedgerStage.RELEASE) currentRelease += entryAmount;
        else if (entry.stage === LedgerStage.VOID) currentVoid += entryAmount;
        else if (entry.stage === LedgerStage.ADJUSTMENT) currentAdjustment += entryAmount;
      }

      // Validasi Invarian Berdasarkan Tahapan Mutasi
      if (stage === LedgerStage.HOLD) {
        if (currentHold > 0) {
          throw new BadRequestException({
            code: 'HOLD_ALREADY_EXISTS',
            message: 'Order ini sudah memiliki entri pencadangan dana (HOLD)',
          });
        }
      } else {
        // Untuk tahap RELEASE, VOID, dan ADJUSTMENT, harus sudah ada entri HOLD terlebih dahulu
        if (currentHold === 0) {
          throw new BadRequestException({
            code: 'HOLD_ENTRY_REQUIRED',
            message: 'Tidak dapat mencatat mutasi sebelum dana dicadangkan (HOLD)',
          });
        }

        const nextRelease = currentRelease + (stage === LedgerStage.RELEASE ? roundedAmount : 0);
        const nextVoid = currentVoid + (stage === LedgerStage.VOID ? roundedAmount : 0);
        const nextAdjustment = currentAdjustment + (stage === LedgerStage.ADJUSTMENT ? roundedAmount : 0);

        // Periksa invarian batas penarikan dana
        if (nextRelease + nextVoid > currentHold) {
          throw new BadRequestException({
            code: 'LEDGER_INVARIANT_VIOLATION',
            message: `Total penarikan (RELEASE: Rp ${nextRelease} + VOID: Rp ${nextVoid}) tidak boleh melebihi HOLD (Rp ${currentHold})`,
          });
        }

        // Periksa batasan saldo efektif setelah penyesuaian (ADJUSTMENT)
        const effectiveReleased = nextRelease + nextAdjustment;
        const effectiveVoid = nextVoid - nextAdjustment;

        if (effectiveReleased < 0) {
          throw new BadRequestException({
            code: 'LEDGER_NEGATIVE_RELEASE',
            message: 'Penyesuaian menyebabkan saldo pencairan efektif menjadi negatif',
          });
        }

        if (effectiveVoid < 0) {
          throw new BadRequestException({
            code: 'LEDGER_NEGATIVE_VOID',
            message: 'Penyesuaian menyebabkan saldo pembatalan efektif menjadi negatif',
          });
        }
      }

      // Buat entri baru (Append-only)
      const createdEntry = await tx.ledgerEntry.create({
        data: {
          orderId,
          stage,
          amount: roundedAmount,
          note: note || null,
        },
      });

      if (userId) {
        await this.auditService.log({
          action: `LEDGER_${stage}`,
          entity: 'LedgerEntry',
          entityId: createdEntry.id,
          userId,
          ipAddress,
          meta: {
            orderId,
            stage,
            amount: roundedAmount,
            note,
          },
        });
      }

      return createdEntry;
    };

    if (externalTx) {
      return executeInTransaction(externalTx);
    }

    return this.prisma.$transaction(executeInTransaction);
  }

  /**
   * Mengambil ringkasan saldo ledger satu order
   */
  async getSummary(orderId: string): Promise<LedgerSummary> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { ledger: true },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan',
      });
    }

    let holdAmount = 0;
    let totalReleased = 0;
    let totalVoid = 0;
    let totalAdjustment = 0;

    for (const entry of order.ledger) {
      const amt = Number(entry.amount);
      if (entry.stage === LedgerStage.HOLD) holdAmount += amt;
      else if (entry.stage === LedgerStage.RELEASE) totalReleased += amt;
      else if (entry.stage === LedgerStage.VOID) totalVoid += amt;
      else if (entry.stage === LedgerStage.ADJUSTMENT) totalAdjustment += amt;
    }

    const effectiveReleased = totalReleased + totalAdjustment;
    const effectiveVoid = totalVoid - totalAdjustment;
    const isBalanced =
      holdAmount > 0 &&
      totalReleased + totalVoid === holdAmount &&
      effectiveReleased >= 0 &&
      effectiveVoid >= 0;

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      holdAmount,
      totalReleased,
      totalVoid,
      totalAdjustment,
      effectiveReleased,
      effectiveVoid,
      isBalanced,
    };
  }

  /**
   * Daftar entri ledger dengan scoping peran
   */
  async findAll(user: JwtPayload, query: { orderId?: string; stage?: LedgerStage; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    let profileIds: any = {};
    if (user.role === Role.SUPPLIER) {
      const sup = await this.prisma.supplierProfile.findUnique({
        where: { userId: user.sub },
      });
      profileIds.supplierProfileId = sup?.id;
    }

    const baseWhere = scopeWhere(user, 'ledgerEntry', profileIds);
    const where: any = {
      ...baseWhere,
    };

    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.stage) {
      where.stage = query.stage;
    }

    const [total, entries] = await Promise.all([
      this.prisma.ledgerEntry.count({ where }),
      this.prisma.ledgerEntry.findMany({
        where,
        include: {
          order: {
            include: {
              commodity: true,
              kitchen: true,
              supplier: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Jika pengguna adalah AUDITOR, anonimkan data sensitif (docs/02 & docs/06)
    const sanitizedEntries = entries.map((entry) => {
      if (user.role === Role.AUDITOR) {
        return {
          id: entry.id,
          orderId: entry.orderId,
          orderNo: entry.order.orderNo,
          stage: entry.stage,
          amount: Number(entry.amount),
          note: entry.note,
          createdAt: entry.createdAt,
          commodityName: entry.order.commodity.name,
          regionId: entry.order.kitchen.regionId,
          // Sembunyikan nama terang supplier dan detail rekening
          supplierName: 'Pemasok Terdaftar',
          kitchenName: entry.order.kitchen.name,
        };
      }

      return {
        ...entry,
        amount: Number(entry.amount),
        order: {
          ...entry.order,
          quantity: Number(entry.order.quantity),
          pricePerUnit: Number(entry.order.pricePerUnit),
          matchScore: Number(entry.order.matchScore),
        },
      };
    });

    return {
      data: sanitizedEntries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil ringkasan global mutasi ledger per rentang waktu (docs/06 M7)
   */
  async getGlobalSummary(query: { from?: string; to?: string; isAuditor?: boolean }) {
    const where: any = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: {
        order: {
          include: {
            supplier: true,
          },
        },
      },
    });

    let totalHold = 0;
    let totalReleased = 0;
    let totalVoid = 0;
    let totalAdjustment = 0;

    const supplierMap = new Map<string, { name: string; hold: number; released: number; voided: number }>();

    for (const e of entries) {
      const amt = Number(e.amount);
      if (e.stage === LedgerStage.HOLD) totalHold += amt;
      else if (e.stage === LedgerStage.RELEASE) totalReleased += amt;
      else if (e.stage === LedgerStage.VOID) totalVoid += amt;
      else if (e.stage === LedgerStage.ADJUSTMENT) totalAdjustment += amt;

      const supId = e.order.supplierId;
      const supName = query.isAuditor ? 'Pemasok Terdaftar' : e.order.supplier.displayName;
      if (!supplierMap.has(supId)) {
        supplierMap.set(supId, { name: supName, hold: 0, released: 0, voided: 0 });
      }
      const supStats = supplierMap.get(supId)!;
      if (e.stage === LedgerStage.HOLD) supStats.hold += amt;
      else if (e.stage === LedgerStage.RELEASE) supStats.released += amt;
      else if (e.stage === LedgerStage.VOID) supStats.voided += amt;
    }

    const effectiveReleased = totalReleased + totalAdjustment;
    const remainingHold = totalHold - totalReleased - totalVoid;

    return {
      totalHold,
      totalReleased,
      totalVoid,
      totalAdjustment,
      effectiveReleased,
      remainingHold,
      supplierBreakdown: Array.from(supplierMap.entries()).map(([id, stats]) => ({
        supplierId: query.isAuditor ? 'MASKED' : id,
        supplierName: stats.name,
        hold: stats.hold,
        released: stats.released,
        voided: stats.voided,
      })),
    };
  }
}
