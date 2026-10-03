import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Berhasil terhubung ke basis data PostgreSQL.');
    } catch (error) {
      this.logger.warn(
        'Koneksi awal ke basis data belum aktif. Pastikan PostgreSQL berjalan saat melakukan transaksi.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Koneksi ke basis data diputus.');
  }
}
