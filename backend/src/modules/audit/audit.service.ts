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
}
