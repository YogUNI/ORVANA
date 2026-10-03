import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommodityCategory } from '@prisma/client';
import { MasterDataService } from './master-data.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('MasterDataService', () => {
  let service: MasterDataService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([{ id: 'reg-1', name: 'Kabupaten Demo' }]),
      },
      commodity: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      qualityStandard: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      recipe: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      recipeItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      priceReference: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterDataService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MasterDataService>(MasterDataService);
  });

  describe('setQualityStandard', () => {
    it('harus menolak bila jumlah bobot kriteria checklist tidak sama dengan 100', async () => {
      prisma.commodity.findUnique.mockResolvedValue({ id: 'c1', name: 'Bayam' });

      const invalidChecklist = [
        { key: 'freshness', label: 'Kesegaran', weight: 40 },
        { key: 'physical', label: 'Kondisi fisik', weight: 25 },
        // total = 65 != 100
      ];

      await expect(
        service.setQualityStandard(
          'c1',
          { passScore: 70, checklist: invalidChecklist },
          'inspector-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus berhasil bila jumlah bobot tepat 100', async () => {
      prisma.commodity.findUnique.mockResolvedValue({ id: 'c1', name: 'Bayam' });
      prisma.qualityStandard.upsert.mockResolvedValue({ id: 'qs-1', passScore: 70 });

      const validChecklist = [
        { key: 'freshness', label: 'Kesegaran', weight: 40 },
        { key: 'physical', label: 'Kondisi fisik', weight: 25 },
        { key: 'uniformity', label: 'Keseragaman', weight: 15 },
        { key: 'cleanliness', label: 'Kebersihan', weight: 10 },
        { key: 'handling', label: 'Penanganan', weight: 10 }, // total = 100
      ];

      const res = await service.setQualityStandard(
        'c1',
        { passScore: 70, checklist: validChecklist },
        'inspector-1',
      );

      expect(res.id).toBe('qs-1');
      expect(prisma.qualityStandard.upsert).toHaveBeenCalled();
    });
  });

  describe('createPriceReference', () => {
    it('harus menolak jika floorPrice > referencePrice', async () => {
      await expect(
        service.createPriceReference(
          {
            commodityId: 'c1',
            regionId: 'r1',
            floorPrice: 9000,
            referencePrice: 8000, // floor > ref -> invalid
            ceilingPrice: 12000,
            validFrom: '2026-01-01',
          },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak jika referencePrice > ceilingPrice', async () => {
      await expect(
        service.createPriceReference(
          {
            commodityId: 'c1',
            regionId: 'r1',
            floorPrice: 6000,
            referencePrice: 13000,
            ceilingPrice: 12000, // ref > ceiling -> invalid
            validFrom: '2026-01-01',
          },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus berhasil jika floorPrice <= referencePrice <= ceilingPrice dan menutup validTo entri sebelumnya', async () => {
      prisma.priceReference.findFirst.mockResolvedValue({
        id: 'old-ref',
        validFrom: new Date('2025-01-01'),
        validTo: null,
      });

      prisma.priceReference.create.mockResolvedValue({
        id: 'new-ref',
        floorPrice: 6000,
        referencePrice: 8000,
        ceilingPrice: 12000,
        validFrom: new Date('2026-01-01'),
      });

      const res = await service.createPriceReference(
        {
          commodityId: 'c1',
          regionId: 'r1',
          floorPrice: 6000,
          referencePrice: 8000,
          ceilingPrice: 12000,
          validFrom: '2026-01-01',
        },
        'admin-1',
      );

      expect(res.id).toBe('new-ref');
      // Verifikasi entri sebelumnya ditutup
      expect(prisma.priceReference.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'old-ref' },
          data: expect.objectContaining({ validTo: expect.any(Date) }),
        }),
      );
    });
  });
});
