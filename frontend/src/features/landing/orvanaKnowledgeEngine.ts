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
 * Normalizes input text: lowercases, handles repeated characters, common typos,
 * and conversational slang.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/(.)\1{2,}/g, '$1') // Collapse repeated characters e.g. "halooo" -> "halo", "benerrr" -> "bener"
    .replace(/ornava/g, 'orvana') // Typo auto-fix
    .replace(/applikasi/g, 'aplikasi')
    .replace(/apakah/g, 'apa')
    .replace(/gimana/g, 'bagaimana')
    .replace(/beneran/g, 'benar')
    .replace(/jelasin/g, 'jelaskan')
    .replace(/klo/g, 'kalau')
    .replace(/yg/g, 'yang')
    .replace(/sy/g, 'saya')
    .replace(/dgn/g, 'dengan');
}

function tokenize(text: string): string[] {
  const norm = normalizeText(text);
  return norm
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Intelligent grounded query matcher for ORVANA Knowledge Base.
 * Guaranteed to match greetings, informal queries, questions about the system,
 * and business rules without hallucinating.
 */
export function queryOrvanaKnowledge(userQuery: string): CopilotResponse {
  const rawClean = userQuery.trim();
  const normalizedQuery = normalizeText(rawClean);
  const queryTokens = tokenize(normalizedQuery);

  if (!rawClean || queryTokens.length === 0) {
    return {
      answer:
        'Halo! Saya Asisten AI Resmi ORVANA. Silakan tanyakan hal seputar alur pengadaan pangan, batas kuota 60%, kalkulasi porsi menu dapur, sistem pembayaran escrow, atau penelusuran paspor QR.',
      category: 'BANTUAN',
      confidence: 1,
      suggestedFollowUps: [
        'Sebenarnya ORVANA ini apa sih?',
        'Apa itu aturan kuota 60% per pemasok?',
        'Bagaimana cara kepastian pembayaran petani?',
        'Bagaimana cara melacak batch pangan dengan QR?',
      ],
    };
  }

  // 1. GREETING & CASUAL OPENINGS (E.g. "halo", "halooo", "selamat siang", "halo selamat siang", "pagi bro", "hai")
  const greetingKeywords = [
    'halo',
    'hai',
    'hello',
    'hi',
    'pagi',
    'siang',
    'sore',
    'malam',
    'assalamualaikum',
    'permisi',
    'tes',
  ];

  const isGreetingQuery =
    greetingKeywords.some((g) => normalizedQuery === g || normalizedQuery.includes(g)) &&
    !normalizedQuery.includes('apa') &&
    !normalizedQuery.includes('bagaimana') &&
    !normalizedQuery.includes('kenapa') &&
    !normalizedQuery.includes('berapa') &&
    !normalizedQuery.includes('jelaskan');

  if (isGreetingQuery) {
    const greetingItem = knowledgeItems.find((item) => item.category.includes('SAPAAN'));
    return {
      answer: greetingItem
        ? greetingItem.answer
        : 'Halo! Selamat datang di Layanan Informasi Resmi ORVANA. Senang sekali bisa membantu Anda!\n\nSaya memegang seluruh data dan regulasi sistem rantai pasok pangan dapur gizi massal ORVANA. Silakan tanyakan hal yang ingin Anda ketahui!',
      category: 'SAPAAN RESMI',
      confidence: 1,
      suggestedFollowUps: [
        'Sebenarnya ORVANA ini apa sih?',
        'Apa itu aturan kuota 60% per pemasok?',
        'Bagaimana petani menerima pembayaran?',
        'Bagaimana cara melacak batch pangan dengan QR?',
      ],
    };
  }

  // 2. DEFINITION CHECK: "ORVANA ini apa sih", "jelasin dong", "apa itu ORVANA"
  const isAskingDefinition =
    (normalizedQuery.includes('orvana') || normalizedQuery.includes('aplikasi') || normalizedQuery.includes('sistem')) &&
    (normalizedQuery.includes('apa sih') ||
      normalizedQuery.includes('apa itu') ||
      normalizedQuery.includes('jelaskan') ||
      normalizedQuery.includes('sebenarnya') ||
      normalizedQuery.includes('bahasa sederhana') ||
      normalizedQuery.includes('pengertian') ||
      normalizedQuery.includes('tentang') ||
      normalizedQuery.includes('maksud'));

  if (isAskingDefinition) {
    const defItem = knowledgeItems.find((item) => item.topic.includes('Definisi'));
    if (defItem) {
      return {
        answer: defItem.answer,
        category: defItem.category,
        matchedTopic: defItem.topic,
        confidence: 0.99,
        actionLink: defItem.actionLink,
        suggestedFollowUps: [
          'Apa bedanya ORVANA dengan marketplace biasa?',
          'Apa itu aturan kuota 60% anti monopoli?',
          'Bagaimana petani menerima pembayaran?',
        ],
      };
    }
  }

  // 3. SCORING KNOWLEDGE BASE RECORDS
  let bestScore = 0;
  let bestMatch: KnowledgeItem | null = null;

  for (const item of knowledgeItems) {
    let score = 0;
    const itemQuestionNorm = normalizeText(item.question);
    const itemQuestionTokens = tokenize(item.question);
    const itemKeywords = item.keywords.split(';').map((k) => normalizeText(k.trim()));
    const itemTopicNorm = normalizeText(item.topic);
    const itemTopicTokens = tokenize(item.topic);

    // Exact Substring Match with sample question
    if (normalizedQuery.includes(itemQuestionNorm) || itemQuestionNorm.includes(normalizedQuery)) {
      score += 45;
    }

    // Exact Topic Match
    if (normalizedQuery.includes(itemTopicNorm)) {
      score += 30;
    }

    // Keyword Match (High value)
    for (const kw of itemKeywords) {
      if (normalizedQuery.includes(kw)) {
        score += 18;
      }
    }

    // Token Overlap
    for (const token of queryTokens) {
      // Ignore common neutral stopwords
      if (['ini', 'itu', 'dong', 'sih', 'ke', 'saya', 'apa', 'yang', 'dan', 'di', 'pada', 'untuk'].includes(token)) {
        continue;
      }

      if (itemQuestionTokens.includes(token)) {
        score += 7;
      }
      if (itemTopicTokens.includes(token)) {
        score += 9;
      }
      if (itemKeywords.some((kw) => kw.includes(token))) {
        score += 8;
      }
      if (normalizeText(item.answer).includes(token)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // If match found with score >= 7
  if (bestMatch && bestScore >= 7) {
    const followUps: string[] = [];
    if (bestMatch.category.includes('BISNIS') || bestMatch.category.includes('FORMULA')) {
      followUps.push('Apa rumus skor pencocokan matching score?');
      followUps.push('Bagaimana jika hasil QC di bawah 70?');
    } else if (bestMatch.category.includes('PERAN')) {
      followUps.push('Bagaimana cara daftar mitra baru?');
      followUps.push('Apa tugas pengawas mutu (QC)?');
    } else if (bestMatch.category.includes('PENELUSURAN')) {
      followUps.push('Bagaimana struktur format kode batch ORVANA?');
      followUps.push('Apakah cek QR perlu download aplikasi?');
    } else {
      followUps.push('Apa itu aturan kuota 60% anti monopoli?');
      followUps.push('Bagaimana cara petani menerima pembayaran?');
    }

    return {
      answer: bestMatch.answer,
      category: bestMatch.category,
      matchedTopic: bestMatch.topic,
      confidence: Math.min(1, bestScore / 30),
      actionLink: bestMatch.actionLink,
      suggestedFollowUps: followUps,
    };
  }

  // Grounded Guidance Fallback (Never Hallucinate / Mengarang)
  return {
    answer:
      'Pertanyaan Anda sangat menarik. Agar informasi yang saya berikan 100% akurat sesuai dokumen regulasi resmi ORVANA, silakan pilih salah satu topik resmi yang Anda butuhkan di bawah ini, atau gunakan kata kunci pencarian seperti: *kuota 60%*, *pembayaran petani*, *resep dapur*, *mutu QC*, atau *paspor QR*:',
    category: 'PANDUAN INFORMASI RESMI',
    confidence: 0.35,
    suggestedFollowUps: [
      'Sebenarnya ORVANA ini apa sih?',
      'Apa itu aturan kuota 60% per pemasok?',
      'Bagaimana cara kepastian pembayaran petani?',
      'Bagaimana cara melacak batch pangan dengan QR?',
    ],
  };
}
