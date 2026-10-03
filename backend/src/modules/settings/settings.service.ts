import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { DEFAULT_SYSTEM_SETTINGS } from './settings.constants';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Inisialisasi pengaturan default saat modul pertama kali dimuat
   */
  async onModuleInit() {
    await this.seedDefaultSettings();
  }

  /**
   * Mengambil semua pengaturan sistem
   */
  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const settings = await this.prisma.systemSetting.findMany();
      const result: Record<string, any> = { ...DEFAULT_SYSTEM_SETTINGS };

      for (const s of settings) {
        result[s.key] = s.value;
      }

      return result;
    } catch (e: any) {
      this.logger.warn(`Basis data belum dapat diakses, menggunakan pengaturan default: ${e.message}`);
      return DEFAULT_SYSTEM_SETTINGS;
    }
  }

  /**
   * Mengambil satu nilai pengaturan dengan fallback default
   */
  async getSetting<T = any>(key: string): Promise<T> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });

      if (setting && setting.value !== undefined) {
        return setting.value as T;
      }
    } catch (e: any) {
      this.logger.warn(`Gagal mengambil setting ${key}, menggunakan fallback.`);
    }

    return DEFAULT_SYSTEM_SETTINGS[key] as T;
  }

  /**
   * Memperbarui satu pengaturan sistem dengan validasi bisnis ketat
   */
  async updateSetting(dto: UpdateSettingDto, userId: string, ipAddress?: string) {
    // 1. Validasi khusus jika kunci adalah matching.weights
    if (dto.key === 'matching.weights') {
      this.validateMatchingWeights(dto.value);
    }

    // 2. Ambil nilai lama untuk audit
    let oldValue: any = DEFAULT_SYSTEM_SETTINGS[dto.key];
    try {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: dto.key },
      });
      if (existing) {
        oldValue = existing.value;
      }
    } catch (e) {
      // Abaikan jika tabel belum siap
    }

    // 3. Simpan perubahan ke basis data
    const updated = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
        updatedById: userId,
      },
      update: {
        value: dto.value,
        updatedById: userId,
      },
    });

    // 4. Catat ke AuditLog
    await this.auditService.log({
      userId,
      action: 'SETTING_UPDATED',
      entity: 'SystemSetting',
      entityId: dto.key,
      meta: {
        key: dto.key,
        oldValue,
        newValue: dto.value,
      },
      ipAddress,
    });

    return updated;
  }

  /**
   * Validasi jumlah bobot pencocokan harus tepat 1.0 (docs/04 bagian 0)
   */
  private validateMatchingWeights(weights: any) {
    if (!weights || typeof weights !== 'object') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Format bobot pencocokan tidak valid.',
      });
    }

    const { distance, quality, price, freshness, reliability } = weights;

    const components = [distance, quality, price, freshness, reliability];
    for (const c of components) {
      if (typeof c !== 'number' || isNaN(c) || c < 0 || c > 1) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Setiap komponen bobot harus berupa angka antara 0 dan 1.',
        });
      }
    }

    const totalWeight = components.reduce((acc, curr) => acc + curr, 0);

    // Toleransi komputasi floating point 0.0001
    if (Math.abs(totalWeight - 1.0) > 0.0001) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Jumlah seluruh bobot pencocokan harus tepat 1.0 (saat ini ${totalWeight.toFixed(4)}).`,
      });
    }
  }

  /**
   * Penyemaian idempoten pengaturan default ke database
   */
  async seedDefaultSettings() {
    try {
      for (const [key, value] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
        await this.prisma.systemSetting.upsert({
          where: { key },
          create: {
            key,
            value,
          },
          update: {}, // Jangan timpa jika sudah ada
        });
      }
      this.logger.log('Penyemaian pengaturan sistem default selesai.');
    } catch (e: any) {
      this.logger.warn(`Penyemaian pengaturan sistem ditunda: ${e.message}`);
    }
  }
}
