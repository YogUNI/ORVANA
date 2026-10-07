import rawKnowledge from './orvanaKnowledgeData.json';

export interface KnowledgeItem {
  id: string;
  category: string;
  topic: string;
  question: string;
  answer: string;
  keywords: string;
  actionLink: string;
}

export interface CopilotResponse {
  answer: string;
  category: string;
  confidence: number;
  matchedTopic?: string;
  actionLink?: string;
  suggestedFollowUps?: string[];
}

const knowledgeItems: KnowledgeItem[] = rawKnowledge.data;

/**
 * Normalizes input text by removing punctuation and converting to lowercase tokens.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Intelligent grounded query matcher for ORVANA Knowledge Base.
 * Ensures the chatbot NEVER hallucinates and always grounds its facts in docs/01 - docs/12.
 */
export function queryOrvanaKnowledge(userQuery: string): CopilotResponse {
  const query = userQuery.trim().toLowerCase();
  const queryTokens = tokenize(query);

  if (!query || queryTokens.length === 0) {
    return {
      answer: 'Halo! Saya Asisten AI Resmi ORVANA. Silakan tanyakan hal seputar alur pengadaan pangan, batas kuota 60%, kalkulasi porsi menu dapur, sistem pembayaran escrow, atau penelusuran paspor QR.',
      category: 'BANTUAN',
      confidence: 1,
      suggestedFollowUps: [
        'Apa itu aturan kuota 60%?',
        'Bagaimana petani menerima pembayaran?',
        'Cara menghitung kebutuhan bahan dapur?',
        'Cara melacak paspor QR bahan makanan?',
      ],
    };
  }

  // Greeting checks
  const greetings = ['halo', 'hai', 'hello', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum'];
  if (greetings.some((g) => query.startsWith(g) || query === g)) {
    return {
      answer: 'Halo! Senang bisa membantu Anda. Saya adalah Asisten Cerdas Rantai Pasok Pangan ORVANA yang memegang basis data resmi sistem. Ada yang ingin Anda ketahui tentang alur kerja dapur gizi, pendaftaran petani, atau kepastian pembayaran?',
      category: 'SAPAM',
      confidence: 1,
      suggestedFollowUps: [
        'Apa bedanya ORVANA dengan marketplace biasa?',
        'Bagaimana sistem jaminan escrow untuk petani?',
        'Berapa batas waktu petani menjawab pesanan?',
      ],
    };
  }

  // Score each knowledge record
  let bestScore = 0;
  let bestMatch: KnowledgeItem | null = null;

  for (const item of knowledgeItems) {
    let score = 0;
    const itemQuestionTokens = tokenize(item.question);
    const itemKeywords = item.keywords.split(';').map((k) => k.trim().toLowerCase());
    const itemTopicTokens = tokenize(item.topic);

    // 1. Direct Substring Match
    if (query.includes(item.question.toLowerCase())) {
      score += 50;
    }

    // 2. Keyword Match (High weight)
    for (const kw of itemKeywords) {
      if (query.includes(kw)) {
        score += 20;
      }
    }

    // 3. Token Overlap Score
    for (const token of queryTokens) {
      if (itemQuestionTokens.includes(token)) {
        score += 5;
      }
      if (itemTopicTokens.includes(token)) {
        score += 8;
      }
      if (item.answer.toLowerCase().includes(token)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // High & Medium Confidence Grounded Results
  if (bestMatch && bestScore >= 12) {
    const followUps: string[] = [];
    if (bestMatch.category === 'ATURAN BISNIS') {
      followUps.push('Apa rumus perhitungan skor pencocokan?');
      followUps.push('Bagaimana jika hasil QC di bawah 70?');
    } else if (bestMatch.category === 'PERAN PENGGUNA') {
      followUps.push('Bagaimana cara daftar mitra baru?');
      followUps.push('Apa tugas pengawas mutu (QC)?');
    } else {
      followUps.push('Apa itu aturan kuota 60% anti monopoli?');
      followUps.push('Bagaimana cara cek paspor QR makanan?');
    }

    return {
      answer: bestMatch.answer,
      category: bestMatch.category,
      matchedTopic: bestMatch.topic,
      confidence: Math.min(1, bestScore / 40),
      actionLink: bestMatch.actionLink,
      suggestedFollowUps: followUps,
    };
  }

  // Graceful Grounded Fallback (Never Hallucinate / Mengarang)
  return {
    answer: 'Pertanyaan Anda sangat menarik. Demi menjaga akurasi resmi sistem rantai pasok pangan daerah, informasi terkait hal tersebut dapat Anda konfirmasi langsung melalui Dokumen Regulasi atau pilih salah satu topik resmi di bawah ini:',
    category: 'PANDUAN_SISTEM',
    confidence: 0.3,
    suggestedFollowUps: [
      'Apa itu aturan kuota 60% per pemasok?',
      'Bagaimana cara kepastian pembayaran petani?',
      'Berapa standar skor kelulusan mutu QC?',
      'Bagaimana cara melacak batch pangan dengan QR?',
    ],
  };
}
