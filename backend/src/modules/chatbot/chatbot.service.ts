import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatbotResponse {
  chatLogId?: string;
  answer: string;
  category: string;
  actionLink?: string;
  suggestedFollowUps?: string[];
  modelUsed: string;
}

const SYSTEM_KNOWLEDGE_PROMPT = `
Anda adalah "ORVANA Agritech AI Assistant" — asisten kecerdasan buatan resmi untuk platform ORVANA (Sistem Rantai Pasok Pangan Lokal Dapur Gizi Massal / Program Makan Bergizi Gratis).

SIFAT DAN GAYA KOMUNIKASI ANDA:
1. SANGAT ADAPTIF TERHADAP KEDALAMAN (ADAPTIVE DEPTH & CONVERSATIONAL PACING):
   - JIKA PERTANYAAN SANTAI / AWAL / TIDAK MINTA DETAIL (misal: "apa itu orvana?", "gimana cara kerjanya?", "kuota 60% itu apa?", "halo"):
     * JANGAN LANGSUNG MENULIS TEKS PANJANG ATAU ESAI LEBAR.
     * Berikan penjelasan ringkas, padat, dan renyah (cukup 2 hingga 4 kalimat / 1-2 paragraf pendek).
     * Selalu tutup respons dengan penawaran eksplorasi interaktif, contohnya:
       "Mau tahu lebih dalam soal alur pembagian uang DP-nya, atau penasaran gimana cara ngecek mutu sayurnya di dapur?"
       atau
       "Apakah kamu mau kita bedah lebih teknis langkah demi langkahnya?"
   - JIKA PERTANYAAN MINTA RINCIAN / TEKNIS / MENDALAM (misal: "jelasin detail rumus kuota 60%", "bagaimana alur ledger step by step", "apa saja kriteria QC rejected?"):
     * Berikan penjelasan komprehensif, terstruktur dengan poin-poin jelas dan contoh kasus konkret.
   - JIKA PENGGUNA MENJAWAB YA / LANJUTKAN (misal: "mau dong", "jelasin lebih dalam", "gimana detailnya?"):
     * Lanjutkan dengan detail bertahap yang menarik dan mudah dipahami.

2. PENYESUAIAN GAYA BAHASA (TONE MATCHING):
   - Jika pengguna santai/gaul ("bro", "min", "gan", "halo bro", "gimana tuh"), tanggapi dengan gaya santai, akrab, dan bersahabat ("Halo bro! Gini gampangnya...").
   - Jika pengguna formal, formalitas dinas/akademik, tanggapi dengan bahasa Indonesia yang formal, sopan, dan elegan.
   - Hindari gaya kaku seperti robot template lama. Setiap percakapan harus terasa hidup, ramah, dan mengalir seperti mengobrol dengan asisten cerdas nyata.

3. GROUNDED (BERDASARKAN FAKTA RESMI ORVANA):
   - APA ITU ORVANA: Platform digital multi-peran yang menghubungkan kebutuhan terencana dapur gizi massal (SPPG/dapur umum) dengan petani, peternak, dan nelayan lokal. Mengotomatisasi jadwal kebutuhan (demand), ketersediaan panen (supply), kontrol mutu (QC), logistik koordinator, pembayaran bertahap (ledger), dan ketertelusuran transparan (/trace/:batchCode).
   - ATURAN KUOTA LOKAL 60%: Minimal 60% pasokan bahan pangan wajib diserap dari petani/produsen lokal dalam radius operasional terdekat guna mendongkrak ekonomi rakyat dan kedaulatan pangan wilayah. Maksimal 40% diperbolehkan dari agregator/distributor luar jika darurat.
   - SKEMA PEMBAYARAN BERTAHAP (TWO-STAGE ESCROW):
     * DP 30% ditransfer di awal (saat Purchase Order disepakati) untuk modal petik, panen, packing, dan bahan bakar logistik produsen.
     * Pelunasan 70% cair otomatis maksimal 24 jam setelah bahan lolos inspeksi mutu (QC PASSED) di dapur gizi.
   - SISTEM QUALITY CONTROL (QC):
     * Bahan dicek saat serah terima oleh Ahli Gizi / Quality Inspector.
     * Status QC: PASSED (Lolos penuh), CONDITIONALLY_ACCEPTED (Lolos bersyarat dengan penyesuaian harga), REJECTED (Ditolak).
     * Toleransi susut berat maksimal 2-5% tergantung komoditas. Jika grade reject, sistem membuka opsi retur atau sengketa adil.
   - TRANSPARANSI & PASPOR QR CODE (/trace/:batchCode):
     * Setiap keranjang/batch pasokan memiliki QR Code unik.
     * Siapa pun (termasuk masyarakat umum, orang tua siswa penerima makan, atau auditor dinas) dapat memindai QR Code untuk melihat sertifikat digital: nama petani asal, tanggal panen, skor kesegaran, foto saat QC, hingga status pembayaran petani.
   - 6 PERAN PENGGUNA (ROLES):
     1. ADMIN: Dinas ketahanan pangan, mengatur master komoditas, plafon harga, dan pantau regional.
     2. KITCHEN_MANAGER: Pengelola dapur gizi, susun menu mingguan, ajukan PO, terima bahan.
     3. SUPPLIER: Petani, peternak, nelayan lokal yang input kapasitas panen & terima DP/pelunasan.
     4. COORDINATOR: Pengepul/kurir agregasi yang mengatur pengelompokan muatan & rute kirim.
     5. QUALITY_INSPECTOR: Ahli gizi atau petugas laboratorium pemeriksa kesegaran & standar higienis.
     6. AUDITOR: Auditor independen/publik yang memantau aliran kas dan kepatuhan kuota tanpa hak ubah.
   - TOLERANSI TYPO & SLANG:
     * Jika user mengetik "ornava", maksudnya adalah ORVANA.

4. BATASAN RUANG LINGKUP (OUT-OF-SCOPE BOUNDARY GUARD):
   - Jika pengguna menanyakan hal yang sama sekali di luar topik rantai pasok pangan, pertanian, dapur gizi, atau platform ORVANA (misalnya: resep masakan luar negeri, ramalan zodiak, kode pemrograman Python/C++, politik praktis, matematika murni):
     * Tolak secara sopan, ramah, dan ringkas.
     * Jelaskan bahwa Anda adalah asisten khusus ekosistem ketahanan pangan dan rantai pasok lokal ORVANA.
     * Arahkan kembali pengguna ke topik pangan, aturan kuota, atau transparansi dapur gizi.

5. FORMAT OUTPUT:
   - Gunakan format markdown (**bold** untuk kata kunci/istilah penting) agar rapi dibaca.
   - Sertakan penawaran interaktif di akhir kalimat.
   - Di baris paling akhir respons, sediakan 2 sampai 3 saran follow-up yang sangat cocok dengan opsi berikutnya:
     [FOLLOW_UPS: Pilihan 1 | Pilihan 2 | Pilihan 3]
`;

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly geminiApiKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.geminiApiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      '';
  }

  // Cache in-memory berumur 10 menit untuk pertanyaan umum identik (mengurangi latensi & hemat kuota)
  private readonly queryCache = new Map<string, { res: ChatbotResponse; expires: number }>();

  async processQuery(
    message: string,
    history?: Array<{ role: 'user' | 'model'; text: string }>,
    ipAddress?: string,
  ): Promise<ChatbotResponse> {
    const trimmed = message.trim();
    const cacheKey = trimmed.toLowerCase();
    const startTime = Date.now();

    // Cek cache untuk pertanyaan single-turn tanpa history
    if (!history || history.length === 0) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        return cached.res;
      }
    }

    let result: ChatbotResponse;

    // 1. Coba panggil Gemini API dengan model generasi cepat
    if (this.geminiApiKey) {
      try {
        const response = await this.callGeminiApi(trimmed, history);
        if (response) {
          result = response;
        } else {
          result = this.fallbackAdaptiveIntelligence(trimmed);
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed, falling back to local intelligence: ${err.message}`);
        result = this.fallbackAdaptiveIntelligence(trimmed);
      }
    } else {
      // 2. Fallback cerdas adaptif jika API offline/limit
      result = this.fallbackAdaptiveIntelligence(trimmed);
    }

    const latencyMs = Date.now() - startTime;

    // 3. Simpan Telemetri ke Database ChatLog (untuk Active Learning Loop)
    try {
      const log = await this.prisma.chatLog.create({
        data: {
          userQuery: trimmed,
          botAnswer: result.answer,
          category: result.category,
          modelUsed: result.modelUsed,
          latencyMs,
          ipAddress: ipAddress || null,
        },
      });
      result.chatLogId = log.id;
    } catch (err: any) {
      this.logger.error(`Gagal mencatat chat telemetry ke database: ${err.message}`);
    }

    if (!history || history.length === 0) {
      this.queryCache.set(cacheKey, { res: result, expires: Date.now() + 10 * 60 * 1000 });
    }

    return result;
  }

  /**
   * Catat feedback pengguna (👍 Thumbs Up = 1, 👎 Thumbs Down = -1)
   */
  async recordFeedback(chatLogId: string, rating: number, note?: string) {
    return this.prisma.chatLog.update({
      where: { id: chatLogId },
      data: {
        feedbackRating: rating,
        feedbackNote: note || null,
      },
    });
  }

  /**
   * Ambil ringkasan telemetri untuk Active Learning (Pertanyaan yang butuh perhatian kurasi)
   */
  async getActiveLearningTelemetry() {
    const totalChats = await this.prisma.chatLog.count();
    const thumbsUp = await this.prisma.chatLog.count({ where: { feedbackRating: 1 } });
    const thumbsDown = await this.prisma.chatLog.count({ where: { feedbackRating: -1 } });

    // Pertanyaan yang mendapat jempol ke bawah (kandidat pembelajaran/klarifikasi)
    const needsReview = await this.prisma.chatLog.findMany({
      where: { feedbackRating: -1 },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Pengetahuan aktif yang sudah dikurasi
    const activeKnowledge = await this.prisma.aiKnowledgeEntry.findMany({
      where: { isVerified: true },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      stats: { totalChats, thumbsUp, thumbsDown },
      needsReview,
      activeKnowledge,
    };
  }

  /**
   * Mengambil pengetahuan tambahan yang sudah diverifikasi dan menyusunnya ke dalam prompt
   */
  private async getDynamicKnowledgeContext(query: string): Promise<string> {
    try {
      const entries = await this.prisma.aiKnowledgeEntry.findMany({
        where: { isVerified: true },
      });
      if (entries.length === 0) return '';

      const lower = query.toLowerCase();
      // Cocokkan kata kunci jika ada yang relevan
      const relevant = entries.filter((e) =>
        e.keywords.some((k) => lower.includes(k.toLowerCase())),
      );

      const itemsToInject = relevant.length > 0 ? relevant : entries.slice(0, 5);
      return `\n\nPENGETAHUAN TAMBAHAN RESMI TERVERIFIKASI ORVANA:\n${itemsToInject
        .map((i) => `- [${i.topic}]: ${i.factContent}`)
        .join('\n')}`;
    } catch {
      return '';
    }
  }

  private async callGeminiApi(
    userMessage: string,
    history?: Array<{ role: 'user' | 'model'; text: string }>,
  ): Promise<ChatbotResponse | null> {
    // Model sequence: prioritaskan flash-lite tercepat untuk chat UI real-time
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest',
    ];

    const contents: any[] = [];

    // Sisipkan history jika ada
    if (history && history.length > 0) {
      const recent = history.slice(-6);
      for (const h of recent) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
    }

    // Tambahkan pertanyaan saat ini
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const dynamicKnowledge = await this.getDynamicKnowledgeContext(userMessage);
    const systemPrompt = SYSTEM_KNOWLEDGE_PROMPT + dynamicKnowledge;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

      try {
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!fetchRes.ok) {
          const errText = await fetchRes.text();
          this.logger.warn(`Model ${model} returned ${fetchRes.status}: ${errText}`);
          continue;
        }

        const data: any = await fetchRes.json();
        const candidate = data.candidates?.[0];
        const rawParts = candidate?.content?.parts || [];
        const rawReply = rawParts.map((p: any) => p.text || '').join('').trim();

        if (rawReply) {
          return this.parseGeminiOutput(rawReply, model);
        }
      } catch (e: any) {
        this.logger.warn(`Failed with model ${model}: ${e.message}`);
      }
    }

    return null;
  }

  private parseGeminiOutput(rawReply: string, modelName: string): ChatbotResponse {
    let cleanAnswer = rawReply.trim();
    let followUps: string[] = [];

    // Parse [FOLLOW_UPS: A | B | C]
    const followUpMatch = cleanAnswer.match(/\[FOLLOW_UPS:\s*([^\]]+)\]/i);
    if (followUpMatch) {
      const items = followUpMatch[1]
        .split('|')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (items.length > 0) {
        followUps = items.slice(0, 3);
      }
      cleanAnswer = cleanAnswer.replace(followUpMatch[0], '').trim();
    }

    // Tentukan kategori & link aksi otomatis
    const lower = cleanAnswer.toLowerCase();
    let category = 'KECERDASAN BUATAN ORVANA';
    let actionLink: string | undefined = undefined;

    if (lower.includes('kuota') || lower.includes('60%')) {
      category = 'REGULASI KUOTA LOKAL';
      actionLink = '#kuota';
    } else if (lower.includes('dp') || lower.includes('pembayaran') || lower.includes('escrow') || lower.includes('70%')) {
      category = 'SISTEM KEUANGAN & PEMBAYARAN';
      actionLink = '#alur-kerja';
    } else if (lower.includes('qc') || lower.includes('mutu') || lower.includes('inspeksi')) {
      category = 'KONTROL MUTU & GIZI';
      actionLink = '#alur-kerja';
    } else if (lower.includes('qr') || lower.includes('trace') || lower.includes('lacak')) {
      category = 'PENELUSURAN & PASPOR QR';
      actionLink = '#trace';
    } else if (lower.includes('dapur') || lower.includes('petani') || lower.includes('koordinator')) {
      category = 'EKOSISTEM & PERAN';
      actionLink = '#peran';
    }

    if (followUps.length === 0) {
      followUps = [
        'Bagaimana pembagian DP 30% dan 70%?',
        'Mengapa kuota lokal dipatok 60%?',
        'Apa peran koordinator di desa?',
      ];
    }

    return {
      answer: cleanAnswer,
      category,
      actionLink,
      suggestedFollowUps: followUps,
      modelUsed: `Google Gemini (${modelName})`,
    };
  }

  private fallbackAdaptiveIntelligence(userMessage: string): ChatbotResponse {
    const text = userMessage.toLowerCase();

    if (text.includes('halo') || text.includes('pagi') || text.includes('siang') || text.includes('sore') || text.includes('malam') || text.includes('hai')) {
      return {
        answer: 'Halo! Salam hangat. Saya Asisten AI Resmi ORVANA. Saya siap membantu Anda memahami tata kelola rantai pasok pangan lokal, perhitungan kuota 60%, audit pembayaran petani, hingga penelusuran batch mutu. Ada hal menarik yang ingin Anda diskusikan hari ini?',
        category: 'ASISTEN RESMI',
        actionLink: '#alur-kerja',
        suggestedFollowUps: [
          'Bagaimana sistem ini membantu petani lokal?',
          'Apa itu aturan kuota 60%?',
          'Bagaimana cara kerja DP 30% dan pelunasan 70%?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    return {
      answer: `Terima kasih atas pertanyaannya! Di ekosistem ORVANA, setiap alur dari peramalan kebutuhan dapur, pencocokan stok petani, jaminan DP 30%, QC mutu, hingga paspor QR pangan saling terhubung secara transparan dan akuntabel. Ada bagian spesifik yang ingin Anda ketahui lebih detail?`,
      category: 'PUSAT INFORMASI ORVANA',
      actionLink: '#alur-kerja',
      suggestedFollowUps: [
        'Jelaskan cara verifikasi mutu QC',
        'Bagaimana cara mendaftar jadi pemasok?',
        'Bisa lihat sertifikat penelusuran batch?',
      ],
      modelUsed: 'ORVANA Adaptive Neural Fallback',
    };
  }
}
