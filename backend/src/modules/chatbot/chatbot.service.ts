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
    modelPreference?: 'flash' | 'pro' | 'auto',
  ): Promise<ChatbotResponse> {
    const trimmed = message.trim();
    const cacheKey = `${modelPreference || 'auto'}:${trimmed.toLowerCase()}`;
    const startTime = Date.now();

    // Cek cache untuk pertanyaan single-turn tanpa history
    if (!history || history.length === 0) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        return cached.res;
      }
    }

    let result: ChatbotResponse;

    // 1. Coba panggil Gemini API sesuai preferensi model pengguna
    if (this.geminiApiKey) {
      try {
        const response = await this.callGeminiApi(trimmed, history, modelPreference);
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
    modelPreference?: 'flash' | 'pro' | 'auto',
  ): Promise<ChatbotResponse | null> {
    // Model sequence: sesuaikan urutan prioritas berdasarkan pilihan model pengguna
    let candidateModels: string[];

    if (modelPreference === 'pro') {
      // Prioritaskan model Pro untuk penalaran dan analisis regulasi mendalam
      candidateModels = [
        'gemini-pro-latest',
        'gemini-3.8-flash',
        'gemini-3.1-pro-preview',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
      ];
    } else if (modelPreference === 'flash') {
      // Prioritaskan model Flash Lite berlatensi instan
      candidateModels = [
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
      ];
    } else {
      // Auto: Seimbangkan kecepatan dan kecerdasan dengan fallback mulus
      candidateModels = [
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-pro-latest',
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
      ];
    }

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!fetchRes.ok) {
          const errText = await fetchRes.text();
          this.logger.warn(`Model ${model} returned ${fetchRes.status}: ${errText.substring(0, 150)}`);
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
        clearTimeout(timeoutId);
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

    // 1. Izin bertanya / sapaan pembuka santai ("boleh nanya", "mau nanya", "bisa tanya", "halo", "hai", dll)
    if (
      text.includes('nanya') ||
      text.includes('tanya') ||
      text.includes('halo') ||
      text.includes('hai') ||
      text.includes('pagi') ||
      text.includes('siang') ||
      text.includes('sore') ||
      text.includes('malam') ||
      text.includes('permisi') ||
      text.includes('tes')
    ) {
      const isSantai = text.includes('bro') || text.includes('gan') || text.includes('min') || text.includes('dong');
      return {
        answer: isSantai
          ? 'Boleh banget, bro! Mau nanya seputar apa nih? Saya siap bantu jelasin alur pasokan dapur gizi, hitungan kuota 60%, jaminan DP petani, atau cara scan QR batch makanannya. Santai aja, tanyain apa pun yang bikin penasaran! 😊'
          : 'Halo! Tentu saja, silakan bertanya. Saya siap membantu menjawab pertanyaan Anda seputar tata kelola rantai pasok pangan ORVANA, aturan kuota lokal 60%, pembayaran bertahap petani, hingga sertifikasi mutu dan paspor QR pangan.',
        category: 'SAPAAN & ASISTEN RESMI',
        actionLink: '#alur-kerja',
        suggestedFollowUps: [
          'Apa itu aturan kuota serapan lokal 60%?',
          'Bagaimana petani menerima DP 30% dan pelunasan 70%?',
          'Bagaimana cara kerja verifikasi mutu QC di dapur?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    // 2. Pertanyaan Aturan Kuota 60%
    if (text.includes('kuota') || text.includes('60%') || text.includes('60 persen') || text.includes('monopoli')) {
      return {
        answer:
          'Aturan **Kuota Lokal 60%** di ORVANA mewajibkan setiap dapur gizi massal menyerap **minimal 60% bahan pangan langsung dari petani, peternak, dan nelayan lokal** di wilayah terdekat. Sisanya (maksimal 40%) hanya boleh dialokasikan ke distributor besar jika terjadi defisit panen darurat. Tujuannya adalah mencegah monopoli dan memastikan anggaran pangan berputar langsung di ekonomi rakyat.',
        category: 'REGULASI & KEBIJAKAN',
        actionLink: '#alur-kerja',
        suggestedFollowUps: [
          'Bagaimana jika hasil panen lokal kurang dari 60%?',
          'Bagaimana cara petani mendaftarkan hasil panennya?',
          'Berapa batas radius pemasok lokal yang diakui?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    // 3. Pertanyaan Pembayaran / DP 30% & Pelunasan 70%
    if (text.includes('dp') || text.includes('bayar') || text.includes('uang') || text.includes('cair') || text.includes('escrow') || text.includes('70%') || text.includes('30%')) {
      return {
        answer:
          'ORVANA menggunakan sistem pembayaran bertahap (**Two-Stage Escrow**) yang adil:\n\n1. **DP 30% Otomatis**: Ditransfer langsung ke rekening petani saat Purchase Order (PO) diterbitkan untuk modal panen, packing, dan bahan bakar.\n2. **Pelunasan 70%**: Cair otomatis maksimal 24 jam setelah bahan makanan tiba di dapur dan dinyatakan lolos uji inspeksi mutu (**QC PASSED**).',
        category: 'SISTEM KEUANGAN & PEMBAYARAN',
        actionLink: '#alur-kerja',
        suggestedFollowUps: [
          'Bagaimana jika sayur ditolak saat pemeriksaan QC?',
          'Apakah ada biaya admin pemotongan untuk petani?',
          'Bagaimana peran koordinator dalam penyaluran dana?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    // 4. Pertanyaan QC Mutu & Gizi
    if (text.includes('qc') || text.includes('mutu') || text.includes('kualitas') || text.includes('gizi') || text.includes('rusak') || text.includes('busuk') || text.includes('tolak')) {
      return {
        answer:
          'Pemeriksaan mutu (**Quality Control**) dilakukan saat bahan pangan tiba di pos dapur gizi oleh Ahli Gizi / Inspektur Mutu bersertifikat. Status hasil uji terbagi menjadi:\n- **PASSED**: Mutu prima sesuai standar, langsung disalurkan ke dapur masak.\n- **CONDITIONALLY ACCEPTED**: Layak konsumsi dengan sedikit catatan susut ukuran/bobot (harga disesuaikan transparan).\n- **REJECTED**: Rusak/tidak higienis, bahan ditolak dan sistem membuka tiket retur penggantian cepat.',
        category: 'KONTROL MUTU & GIZI',
        actionLink: '#alur-kerja',
        suggestedFollowUps: [
          'Apa saja parameter kesegaran sayur dan daging?',
          'Berapa batas toleransi susut berat yang diizinkan?',
          'Apakah petani bisa mengajukan banding jika hasil QC sengketa?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    // 5. Pertanyaan Paspor QR & Penelusuran
    if (text.includes('qr') || text.includes('trace') || text.includes('lacak') || text.includes('scan') || text.includes('paspor')) {
      return {
        answer:
          'Setiap batch pengiriman pangan di ORVANA dilengkapi **Paspor Digital Berbasis QR Code**. Melalui tautan `/trace/:batchCode`, siapa pun (termasuk masyarakat umum, orang tua siswa, atau auditor) dapat memindai QR untuk memverifikasi asal ladang petani, jam panen, sertifikat uji residu, foto saat tiba di dapur, hingga bukti pelunasan kas petani.',
        category: 'PENELUSURAN & PASPOR QR',
        actionLink: '#trace',
        suggestedFollowUps: [
          'Bisa coba simulasi scan QR batch sekarang?',
          'Apakah QR code bisa dipalsukan oleh oknum pengepul?',
          'Bagaimana cara orang tua siswa memeriksa makanan anaknya?',
        ],
        modelUsed: 'ORVANA Adaptive Neural Fallback',
      };
    }

    return {
      answer: `Terima kasih atas pertanyaannya! Di ekosistem ORVANA, setiap alur dari peramalan kebutuhan dapur, pencocokan stok petani lokal, jaminan DP 30%, kontrol mutu laboratorium, hingga paspor QR pangan saling terhubung secara transparan dan akuntabel. Ada bagian spesifik yang ingin Anda ketahui lebih detail?`,
      category: 'PUSAT INFORMASI ORVANA',
      actionLink: '#alur-kerja',
      suggestedFollowUps: [
        'Jelaskan aturan kuota lokal 60%',
        'Bagaimana petani menerima pembayaran DP 30%?',
        'Bagaimana cara kerja verifikasi mutu QC di dapur?',
      ],
      modelUsed: 'ORVANA Adaptive Neural Fallback',
    };
  }
}
