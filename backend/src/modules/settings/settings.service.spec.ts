import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_SYSTEM_SETTINGS } from './settings.constants';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      systemSetting: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        upsert: jest.fn().mockImplementation(({ create, update }: any) => ({
          ...create,
          ...update,
        })),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('getAllSettings', () => {
    it('harus mengembalikan konfigurasi default jika basis data kosong', async () => {
      const settings = await service.getAllSettings();
      expect(settings['matching.maxRadiusKm']).toBe(50);
      expect(settings['matching.weights']).toEqual(DEFAULT_SYSTEM_SETTINGS['matching.weights']);
    });
  });

  describe('updateSetting', () => {
    it('harus menolak bobot pencocokan jika jumlahnya tidak sama dengan 1.0', async () => {
      const invalidWeights = {
        distance: 0.3,
        quality: 0.3,
        price: 0.2,
        freshness: 0.1,
        reliability: 0.2, // total = 1.1 != 1.0
      };

      await expect(
        service.updateSetting(
          { key: 'matching.weights', value: invalidWeights },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak bobot jika ada nilai negatif atau bukan angka', async () => {
      const invalidWeights = {
        distance: -0.1,
        quality: 0.4,
        price: 0.3,
        freshness: 0.2,
        reliability: 0.2,
      };

      await expect(
        service.updateSetting(
          { key: 'matching.weights', value: invalidWeights },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus berhasil memperbarui bobot pencocokan jika jumlah tepat 1.0 dan mencatat AuditLog', async () => {
      const validWeights = {
        distance: 0.35,
        quality: 0.25,
        price: 0.20,
        freshness: 0.10,
        reliability: 0.10, // total = 1.00
      };

      const result = await service.updateSetting(
        { key: 'matching.weights', value: validWeights },
        'admin-id',
        '127.0.0.1',
      );

      expect(result.value).toEqual(validWeights);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-id',
          action: 'SETTING_UPDATED',
          entity: 'SystemSetting',
          entityId: 'matching.weights',
        }),
      );
    });
  });
});
