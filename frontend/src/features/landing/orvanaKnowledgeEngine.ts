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
 * Normalizes input text: lowercases, handles common Indonesian typos (ornava -> orvana),
 * and breaks into tokens.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ornava/g, 'orvana') // Auto-fix typo "ornava" -> "orvana"
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
 * Robust to conversational Indonesian, slang, typo "ornava", and multi-intent queries.
 */
export function queryOrvanaKnowledge(userQuery: string): CopilotResponse {
  const rawClean = userQuery.trim();
  const normalizedQuery = normalizeText(rawClean);
  const queryTokens = tokenize(normalizedQuery);

  if (!rawClean || queryTokens.length === 0) {
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

  // Conversational Greetings
  const greetings = [
    'halo',
    'hai',
    'hello',
    'hi',
    'selamat pagi',
    'selamat siang',
    'selamat sore',
    'selamat malam',
    'assalamualaikum',
    'pagi',
    'siang',
    'malam',
  ];
  if (greetings.some((g) => normalizedQuery === g || normalizedQuery.startsWith(g + ' '))) {
    // If it's pure greeting
    if (queryTokens.length <= 2) {
      return {
        answer: 'Halo! Senang bisa membantu Anda. Saya adalah Asisten Cerdas Rantai Pasok Pangan ORVANA yang memegang basis data resmi sistem. Ada yang ingin Anda ketahui tentang alur kerja dapur gizi, pendaftaran petani, atau kepastian pembayaran?',
        category: 'SAPAAN RESMI',
        confidence: 1,
        suggestedFollowUps: [
          'Sebenarnya ORVANA ini apa sih?',
          'Bagaimana sistem jaminan escrow untuk petani?',
          'Apa itu aturan kuota 60% anti monopoli?',
        ],
      };
    }
  }

  // 1. Direct General Definition check (e.g. "orvana ini apa sih", "apa itu orvana", "jelasin ke saya menggunakan bahasa sederhana")
  const isAskingWhatIsOrvana =
    (normalizedQuery.includes('orvana') || normalizedQuery.includes('aplikasi') || normalizedQuery.includes('sistem')) &&
    (normalizedQuery.includes('apa sih') ||
      normalizedQuery.includes('apa itu') ||
      normalizedQuery.includes('jelaskan') ||
      normalizedQuery.includes('sebenarnya') ||
      normalizedQuery.includes('bahasa sederhana') ||
      normalizedQuery.includes('pengertian') ||
      normalizedQuery.includes('fungsi'));

  if (isAskingWhatIsOrvana) {
    const definitionItem = knowledgeItems.find((item) => item.topic.includes('Definisi'));
    if (definitionItem) {
      return {
        answer: definitionItem.answer,
        category: definitionItem.category,
        matchedTopic: definitionItem.topic,
        confidence: 0.98,
        actionLink: definitionItem.actionLink,
        suggestedFollowUps: [
          'Apa bedanya ORVANA dengan marketplace biasa?',
          'Apa saja 6 peran pengguna di ORVANA?',
          'Bagaimana petani menerima pembayaran?',
        ],
      };
    }
  }

  // 2. Score each knowledge record
  let bestScore = 0;
  let bestMatch: KnowledgeItem | null = null;

  for (const item of knowledgeItems) {
    let score = 0;
    const itemQuestionNorm = normalizeText(item.question);
    const itemQuestionTokens = tokenize(item.question);
    const itemKeywords = item.keywords.split(';').map((k) => normalizeText(k.trim()));
    const itemTopicNorm = normalizeText(item.topic);
    const itemTopicTokens = tokenize(item.topic);

    // Exact Substring Match with question
    if (normalizedQuery.includes(itemQuestionNorm) || itemQuestionNorm.includes(normalizedQuery)) {
      score += 40;
    }

    // Exact Topic Substring
    if (normalizedQuery.includes(itemTopicNorm)) {
      score += 25;
    }

    // Keyword Match (High Priority)
    for (const kw of itemKeywords) {
      if (normalizedQuery.includes(kw)) {
        score += 15;
      }
    }

    // Token Overlap
    for (const token of queryTokens) {
      // Don't give too much weight to stop words
      if (['ini', 'itu', 'dong', 'sih', 'ke', 'saya', 'apa', 'yang', 'dan', 'di'].includes(token)) {
        continue;
      }

      if (itemQuestionTokens.includes(token)) {
        score += 6;
      }
      if (itemTopicTokens.includes(token)) {
        score += 8;
      }
      if (itemKeywords.some((kw) => kw.includes(token))) {
        score += 7;
      }
      if (normalizeText(item.answer).includes(token)) {
        score += 1.5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // If match found with decent score (threshold lowered from 12 to 8 because of normalized filtering)
  if (bestMatch && bestScore >= 7) {
    const followUps: string[] = [];
    if (bestMatch.category.includes('BISNIS') || bestMatch.category.includes('FORMULA')) {
      followUps.push('Apa rumus skor pencocokan matching score?');
      followUps.push('Bagaimana jika hasil QC di bawah 70?');
    } else if (bestMatch.category.includes('PERAN')) {
      followUps.push('Bagaimana cara daftar mitra baru?');
      followUps.push('Apa tugas pengawas mutu (QC)?');
    } else if (bestMatch.category.includes('PENELUSURAN')) {
      followUps.push('Bagaimana struktur kode batch ORVANA?');
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
    answer: 'Pertanyaan Anda sangat bagus. Agar informasi yang saya berikan 100% akurat sesuai dokumen regulasi resmi ORVANA, silakan pilih topik terkait yang ingin Anda ketahui di bawah ini, atau gunakan kata kunci seperti: *kuota 60%*, *pembayaran petani*, *resep dapur*, *mutu QC*, atau *paspor QR*:',
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
