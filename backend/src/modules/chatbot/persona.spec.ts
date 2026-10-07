import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaService } from '../prisma/prisma.service';

describe('ChatbotService - Persona Blind Test & Boundary Guard (T-AI-05)', () => {
  let service: ChatbotService;

  const mockPrismaService = {
    chatLog: {
      create: jest.fn().mockResolvedValue({ id: 'mock-log-id' }),
      update: jest.fn().mockResolvedValue({ id: 'mock-log-id' }),
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([]),
    },
    aiKnowledgeEntry: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(5),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') {
                return process.env.GEMINI_API_KEY || '';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('P-01: Persona Santai/Gen-Z - Harus merespons luwes, santai, analogis, dan renyah', async () => {
    const query = 'bro ini ornava apaan dah, jelasin singkat dong pake bahasa tongkrongan';
    const res = await service.processQuery(query);

    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const lower = res.answer.toLowerCase();
    // Nada santai atau akrab
    expect(lower.includes('bro') || lower.includes('nih') || lower.includes('jadi') || lower.includes('santai')).toBe(true);
    // Tidak menulis esai berlebihan untuk kueri singkat
    expect(res.answer.length).toBeLessThan(1200);
  }, 25000);

  it('P-02: Persona Pejabat/Dinas - Harus merespons formal, profesional, dan berbasis regulasi', async () => {
    const query =
      'Mohon penjelasan komprehensif terkait mekanisme kepatuhan kuota serapan lokal minimal 60 persen pada platform ini.';
    const res = await service.processQuery(query);

    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const lower = res.answer.toLowerCase();
    // Menyebut regulasi kuota
    expect(lower.includes('60%') || lower.includes('60 persen') || lower.includes('kuota')).toBe(true);
    // Nada profesional & akuntabel
    expect(lower.includes('petani') || lower.includes('pangan') || lower.includes('daerah') || lower.includes('lokal')).toBe(true);
  }, 25000);

  it('P-03: Persona Petani Desa - Harus merespons hangat dan menjelaskan kepastian bayar serta alur panen', async () => {
    const query =
      'Saya petani cabe di desa, gimana cara jual hasil panen kesini dan kapan uangnya cair ke rekening saya?';
    const res = await service.processQuery(query);

    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const lower = res.answer.toLowerCase();
    // Membahas DP atau pelunasan atau QC
    expect(lower.includes('dp') || lower.includes('30%') || lower.includes('70%') || lower.includes('panen') || lower.includes('cair')).toBe(true);
  }, 25000);

  it('P-04: Persona Auditor - Harus menekankan integritas pembukuan kas dan transparansi QR batch', async () => {
    const query =
      'Bagaimana sistem memastikan integritas catatan kas agar tidak dimanipulasi serta pembuktian riwayat batch komoditas?';
    const res = await service.processQuery(query);

    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const lower = res.answer.toLowerCase();
    expect(lower.includes('ledger') || lower.includes('transparan') || lower.includes('qr') || lower.includes('trace') || lower.includes('audit')).toBe(true);
  }, 25000);

  it('P-05: Out-of-Scope Boundary Guard - Harus menolak halus topik non-pangan/luar negeri', async () => {
    const query = 'Bisa buatin kode Python machine learning untuk klasifikasi citra satelit NASA?';
    const res = await service.processQuery(query);

    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const lower = res.answer.toLowerCase();
    // Harus menolak atau mengarahkan kembali ke ORVANA / pangan lokal
    expect(
      lower.includes('orvana') ||
        lower.includes('pangan') ||
        lower.includes('fokus') ||
        lower.includes('khusus') ||
        lower.includes('rantai pasok'),
    ).toBe(true);
  }, 25000);
});
