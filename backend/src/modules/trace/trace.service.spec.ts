import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TraceService } from './trace.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('TraceService - M9 QR & Certificate', () => {
  let service: TraceService;
  let prisma: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@orvana.test',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    regionId: 'reg-1',
    tokenVersion: 0,
  };

  const mockBatch = {
    id: 'batch-1',
    batchCode: 'BAT-202610-001',
    originVillage: 'Sukamaju',
    harvestDate: new Date('2026-10-12'),
    shippedQuantity: 30,
    receivedQuantity: 30,
    receivedAt: new Date('2026-10-13T08:00:00Z'),
    order: {
      commodity: { name: 'Bayam Organik', unit: 'kg', category: 'SAYURAN_DAUN' },
      kitchen: { name: 'Dapur Gizi Pusat', code: 'KIT-01' },
      supplier: {
        displayName: 'Kelompok Tani Berkah',
        publicName: true,
        type: 'INDIVIDUAL_FARMER',
        village: 'Sukamaju',
        region: { name: 'Kabupaten Sleman' },
        user: { name: 'Pak Tani' },
      },
      shipment: {
        coordinator: { user: { name: 'Koordinator Sleman' } },
      },
      ledger: [],
    },
    qualityChecks: [
      {
        score: 95,
        result: 'PASS',
        acceptedQuantity: 30,
        rejectedQuantity: 0,
        checklistScores: { freshness: 95, cleanliness: 95 },
        notes: 'Sangat segar dan memenuhi standar',
        checkedAt: new Date('2026-10-13T09:00:00Z'),
        inspector: { name: 'Ahli Gizi Mutu' },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      batch: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TraceService>(TraceService);
  });

  it('generateQrCode menghasilkan buffer PNG yang valid', async () => {
    prisma.batch.findFirst.mockResolvedValue({ id: 'batch-1', batchCode: 'BAT-202610-001' });

    const result = await service.generateQrCode('BAT-202610-001', mockAdmin);
    expect(result.batchCode).toBe('BAT-202610-001');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(100);
  });

  it('generateQrCode melempar NotFoundException jika batch tidak ditemukan', async () => {
    prisma.batch.findFirst.mockResolvedValue(null);

    await expect(service.generateQrCode('NON-EXISTENT', mockAdmin)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('generateCertificatePdf menghasilkan buffer PDF yang valid dengan filename yang tepat', async () => {
    prisma.batch.findFirst.mockResolvedValue(mockBatch);

    const result = await service.generateCertificatePdf('batch-1', mockAdmin);
    expect(result.filename).toBe('Sertifikat-Batch-BAT-202610-001.pdf');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(500);
  });
});
