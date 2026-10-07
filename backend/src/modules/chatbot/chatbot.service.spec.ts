import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import * as dotenv from 'dotenv';
dotenv.config();

describe('ChatbotService & ChatbotController - AI Agent Suite (T-AI-04)', () => {
  let service: ChatbotService;
  let controller: ChatbotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [
        ChatbotService,
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
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    service = module.get<ChatbotService>(ChatbotService);
    controller = module.get<ChatbotController>(ChatbotController);
  });

  it('TC-01: harus merespons sapaan santai dengan ramah dan interaktif', async () => {
    const res = await service.processQuery('halo bro selamat siang');
    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    expect(res.answer.length).toBeGreaterThan(15);
    expect(res.suggestedFollowUps).toBeDefined();
    expect(res.suggestedFollowUps?.length).toBeGreaterThan(0);
  }, 20000);

  it('TC-02: harus toleran terhadap typo ekstrem ("ornava" -> ORVANA)', async () => {
    const res = await service.processQuery('apa sih keunggulan ornavaaa dibanding platform konvensional?');
    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    // Harus memahami konteks ORVANA
    const textLower = res.answer.toLowerCase();
    expect(textLower.includes('orvana') || textLower.includes('dapur') || textLower.includes('petani')).toBe(true);
  }, 20000);

  it('TC-03: harus grounded pada aturan kuota lokal 60%', async () => {
    const res = await service.processQuery('jelasin aturan kuota serapan lokal 60%');
    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const textLower = res.answer.toLowerCase();
    expect(textLower.includes('60%') || textLower.includes('60 persen') || textLower.includes('lokal')).toBe(true);
  }, 20000);

  it('TC-04: harus grounded pada skema pembayaran DP 30% dan pelunasan 70%', async () => {
    const res = await service.processQuery('kapan dan bagaimana skema pembayaran diterima petani?');
    expect(res).toBeDefined();
    expect(res.answer).toBeDefined();
    const textLower = res.answer.toLowerCase();
    expect(textLower.includes('30%') || textLower.includes('70%') || textLower.includes('dp') || textLower.includes('qc')).toBe(true);
  }, 20000);

  it('TC-05: harus mendukung multi-turn conversation history', async () => {
    const history = [
      { role: 'user' as const, text: 'apa itu orvana?' },
      { role: 'model' as const, text: 'ORVANA adalah platform rantai pasok dapur gizi massal.' },
    ];
    const res = await service.processQuery('jelasin lebih dalam alurnya dong', history);
    expect(res).toBeDefined();
    expect(res.answer.length).toBeGreaterThan(20);
  }, 20000);

  it('TC-06: harus menyediakan fallback adaptif jika terjadi blackout jaringan atau API offline', async () => {
    // Paksa instance service tanpa API key untuk menguji resiliensi fallback offline
    const offlineService = new ChatbotService({
      get: () => '',
    } as any);

    const res = await offlineService.processQuery('halo bro, sistem ini buat apa?');
    expect(res).toBeDefined();
    expect(res.modelUsed).toContain('Fallback');
    expect(res.answer).toBeDefined();
    expect(res.suggestedFollowUps?.length).toBeGreaterThan(0);
  });

  it('TC-07: ChatbotController endpoint harus membungkus output dalam format { data }', async () => {
    const result = await controller.query({ message: 'halo orvana' });
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.answer).toBeDefined();
  }, 20000);
});
