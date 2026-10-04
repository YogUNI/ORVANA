import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, any> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menulis entri log audit yang bersifat append-only.
   * Tidak ada data sensitif (password, secret token) yang boleh disertakan pada meta.
   */
  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      // Sanitasi meta: pastikan field sensitif tidak tercatat
      let sanitizedMeta = params.meta;
      if (sanitizedMeta) {
        const { password, passwordHash, token, refreshToken, ...safeMeta } = sanitizedMeta;
        sanitizedMeta = safeMeta;
      }

      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          meta: sanitizedMeta ?? undefined,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (error: any) {
      // Pencatatan audit log tidak boleh menggagalkan alur transaksi utama jika terjadi masalah jaringan
      this.logger.error(`Gagal menulis AuditLog (${params.action}): ${error.message}`);
    }
  }

  /**
   * Menampilkan daftar Audit Log dengan filter dan paginasi (docs/06 M12)
   */
  async findAll(query: {
    entity?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.entity) {
      where.entity = { contains: query.entity, mode: 'insensitive' };
    }
    if (query.entityId) {
      where.entityId = query.entityId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
