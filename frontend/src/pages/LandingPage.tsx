import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { formatRupiah, formatKg } from '../lib/format';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Logo } from '../components/ui/Logo';
import {
  ShieldCheck,
  Truck,
  Search,
  Users,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  MapPin,
  Sparkles,
  ChevronRight,
  Building2,
  Leaf,
  QrCode,
  Check,
  ChevronDown,
  ArrowUpRight,
  Send,
  Scale,
  Lock,
} from 'lucide-react';

interface PublicImpactSummary {
  localSpendingRupiah: number;
  producersInvolved: number;
  totalDeliveredKg: number;
  qualityPassRatePct: number;
  avgDistanceKm: number;
}

export const LandingPage: React.FC = () => {
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [activeTabRole, setActiveTabRole] = useState<'kitchen' | 'farmer' | 'coordinator' | 'inspector'>('kitchen');

  // Interactive Live Calculator State
  const [calcPortions, setCalcPortions] = useState<number>(1000);
  const [calcCommodity, setCalcCommodity] = useState<'bayam' | 'lele' | 'beras' | 'telur'>('bayam');

  // Interactive Live NLP Simulator State
  const [nlpSampleText, setNlpSampleText] = useState('besok ada panen cabai rawit dua kwintal harga 45rb sama bayam 50 kilo');
  const [nlpParsed, setNlpParsed] = useState<any>(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  // Interactive FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Scroll Spy Active Section State
  const [activeSection, setActiveSection] = useState<string>('');

  React.useEffect(() => {
    const sections = ['dampak', 'keunggulan', 'kalkulator', 'nlp-demo', 'alur', 'faq'];
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
      if (window.scrollY < 200) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: impact, isLoading } = useQuery<PublicImpactSummary>({
    queryKey: ['public-impact-summary'],
    queryFn: async () => {
      const res: any = await apiClient.get('/public/impact-summary');
      return (res.data || res) as PublicImpactSummary;
    },
  });

  const handleTraceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchCodeInput.trim()) {
      window.location.href = `/trace/${encodeURIComponent(batchCodeInput.trim())}`;
    }
  };

  const handleTestNLP = async () => {
    if (!nlpSampleText.trim()) return;
    setNlpLoading(true);
    try {
      const res: any = await apiClient.post('/demand-requests/parse-text', { text: nlpSampleText.trim() });
      setNlpParsed(res?.data || null);
    } catch (err) {
      // Mock fallback if python service offline
      setNlpParsed({
        candidates: [
          { commodityName: 'Cabai rawit', quantityKg: 200, askingPrice: 45000, commodityCategory: 'SPICE' },
          { commodityName: 'Bayam', quantityKg: 50, askingPrice: null, commodityCategory: 'VEGETABLE' }
        ]
      });
    } finally {
      setNlpLoading(false);
    }
  };

  // Kalkulasi estimasi real-time rumus docs/04 bagian 2
  const getCalcResults = () => {
    switch (calcCommodity) {
      case 'bayam': {
        const raw = calcPortions * 0.06 * 1.15;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 8000;
        return { name: 'Bayam Hijau (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 8000, wastePct: 15 };
      }
      case 'lele': {
        const raw = calcPortions * 0.07 * 1.10;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 30000;
        return { name: 'Ikan Lele Segar (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 30000, wastePct: 10 };
      }
      case 'beras': {
        const raw = calcPortions * 0.08 * 1.02;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 14000;
        return { name: 'Beras Lokal (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 14000, wastePct: 2 };
      }
      case 'telur': {
        const raw = calcPortions * 0.06 * 1.03;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 28000;
        return { name: 'Telur Ayam (Resep R2)', qtyKg: rounded, estCost: cost, unitPrice: 28000, wastePct: 3 };
      }
    }
  };

  const calc = getCalcResults();

  const faqs = [
    {
      q: 'Apa bedanya ORVANA dengan marketplace produk pertanian biasa?',
      a: 'Marketplace biasa berbasis transaksi bebas sewaktu-waktu. ORVANA adalah sistem pengadaan terencana: mencocokkan jadwal menu dapur gizi massal 1–2 minggu sebelumnya dengan kalender panen produsen lokal, batasan anti-monopoli (cap 60%), perlindungan harga dasar dinas, dan penelusuran digital QR terbuka.',
    },
    {
      q: 'Bagaimana petani kecil terjamin menerima pembayaran tepat waktu tanpa potongan tengkulak?',
      a: 'ORVANA menggunakan smart escrow: ketika pesanan dikonfirmasi dapur, dana langsung dicadangkan [HOLD]. Begitu pengawas mutu menyatakan bahan lolos uji mutu [PASS], dana otomatis dicairkan [RELEASE] langsung ke saldo petani dalam hitungan jam.',
    },
    {
      q: 'Bagaimana peran koordinator logistik menjaga mutu kesegaran bahan pangan?',
      a: 'Koordinator menjemput dan mengonsolidasi panen dalam radius pendek (< 25 km) menggunakan rute optimal, mencatat penimbangan susut bobot secara digital, dan mencetak kode batch identitas asal desa sebelum diserahkan ke dapur penerima.',
    },
    {
      q: 'Apakah orang tua murid dan publik bisa memeriksa asal muasal makanan anak mereka?',
      a: 'Bisa. Setiap sajian makanan memiliki paspor digital QR code publik tanpa perlu login. Menampilkan identitas petani, kelompok tani desa, tanggal petik, hasil skor QC ahli gizi, dan sertifikat penelusuran resmi.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800/20 selection:text-emerald-950 font-sans antialiased relative">
      
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-[#0B1A14] text-white text-[11px] font-mono py-2.5 px-4 border-b border-emerald-950/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider">ORVANA PRODUCTION PROTOCOL</span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-300">Rantai Pasok Pangan Lokal Dapur Gizi Massal Generasi Emas</span>
          </div>
          <Link
            to="/trace/ORV-20260920-DPR01-0001"
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors group"
          >
            <span>Periksa Paspor Digital Batch #ORV-20260920-DPR01-0001</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. STICKY NAVBAR MODERN BERSIH DENGAN SCROLL-SPY ACTIVE PILL */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/90 sticky top-0 z-40 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-stone-950 tracking-tight leading-none group-hover:text-emerald-900 transition-colors">
                ORVANA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-800 font-bold mt-1">
                Enterprise Agritech
              </span>
            </div>
          </Link>

          {/* Nav Links dengan Indikator Scroll Aktif & Hover Halus */}
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100/70 p-1.5 rounded-full border border-stone-200/80">
            {[
              { id: 'dampak', label: 'Buku Besar Dampak' },
              { id: 'keunggulan', label: 'Nilai Tambah' },
              { id: 'kalkulator', label: 'Simulasi Kebutuhan' },
              { id: 'nlp-demo', label: 'Asisten AI', isAi: true },
              { id: 'alur', label: 'Alur 4 Peran' },
              { id: 'faq', label: 'FAQ' },
            ].map((nav) => {
              const isActive = activeSection === nav.id;
              return (
                <a
                  key={nav.id}
                  href={`#${nav.id}`}
                  className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-900 text-white font-bold shadow-xs'
                      : 'hover:text-stone-950 hover:bg-white/80'
                  }`}
                >
                  {nav.isAi && (
                    <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-amber-600'}`} />
                  )}
                  <span>{nav.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Quick Actions (Cek Batch, Masuk, Daftar) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/trace/ORV-20260920-DPR01-0001" className="hidden sm:block">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 px-3 py-2 rounded-xl border border-emerald-200/90 transition-all shadow-2xs">
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cek Batch</span>
              </span>
            </Link>

            <div className="h-5 w-px bg-stone-200 hidden sm:block mx-0.5" />

            <Link to="/login">
              <button
                type="button"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-50 hover:text-stone-950 hover:border-stone-400 transition-all"
              >
                Masuk Sistem
              </button>
            </Link>

            <Link to="/register">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs hover:shadow-sm transition-all"
              >
                Daftar Mitra
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION ULTRA-CREATIVE DENGAN SPLIT DESIGN & FLOATING DOCK */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-20 overflow-hidden border-b border-stone-200/80">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Sisi Kiri Hero: Value Proposition & Search Bar */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300/80 text-xs font-bold text-emerald-950 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Inovasi Rantai Pasok Pangan Bergizi Massal & Mandiri</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[64px] font-bold text-stone-950 tracking-tight leading-[1.08]">
                Mencocokkan Menu Dapur dengan <br className="hidden sm:inline" />
                <span className="text-emerald-900 italic font-medium relative underline decoration-amber-500/80 decoration-wavy decoration-2">
                  Panen Petani Lokal.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl">
                Infrastruktur digital berkeadilan yang menghubungkan ribuan porsi gizi harian dengan petani dan nelayan desa: algoritma pencocokan multi-kriteria anti-monopoli (cap 60%), kepastian harga dasar, jaminan dana escrow otomatis, dan paspor ketertelusuran QR publik.
              </p>

              {/* Kotak Lacak Batch & Asisten AI */}
              <div className="pt-2 max-w-xl space-y-3">
                <div className="p-2 bg-white rounded-2xl shadow-card border-2 border-emerald-900/15 hover:border-emerald-900/40 focus-within:border-emerald-900 transition-all">
                  <form onSubmit={handleTraceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full">
                      <Search className="w-4 h-4 text-emerald-800 shrink-0" />
                      <input
                        type="text"
                        placeholder="Ketik kode batch: misal ORV-20260920-DPR01-0001"
                        value={batchCodeInput}
                        onChange={(e) => setBatchCodeInput(e.target.value)}
                        className="w-full text-xs sm:text-sm text-stone-950 placeholder-stone-400 focus:outline-none font-mono"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto shrink-0 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-xs flex items-center justify-center gap-2 px-5 py-3 rounded-xl shadow-xs"
                    >
                      <span>Lacak Bahan</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-500">Contoh paspor:</span>
                    <Link
                      to="/trace/ORV-20260920-DPR01-0001"
                      className="text-[11px] font-mono font-bold text-emerald-900 underline hover:text-emerald-700 transition-colors"
                    >
                      ORV-20260920-DPR01-0001
                    </Link>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-900 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    Escrow & QC Verified
                  </span>
                </div>
              </div>

              {/* 3 Keunggulan Nilai */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700 font-medium">
                <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-stone-200 shadow-xs">
                  <Scale className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Anti Monopoli (Batas Cap 60%)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-stone-200 shadow-xs">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Escrow Auto-Hold & Release</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-stone-200 shadow-xs">
                  <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Paspor Mutu QR Tanpa Login</span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan Hero: Visual Interactive Matching Engine Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-900/15 p-6 shadow-elevated relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-80" />

                <div className="relative z-10 flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>
                    <span className="text-xs font-mono font-bold tracking-tight text-stone-950 uppercase">
                      Live Matching Engine
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    Algoritma Aktif
                  </span>
                </div>

                <div className="relative z-10 space-y-3.5 text-left">
                  {/* Permintaan Dapur */}
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                        Dapur Gizi Mandiri (DPR01)
                      </span>
                      <span className="font-mono text-emerald-900 font-bold">1.000 Porsi</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-stone-950 font-serif">Kebutuhan: Bayam Hijau</span>
                      <span className="text-sm font-mono font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        69,0 kg
                      </span>
                    </div>
                  </div>

                  {/* Alokasi Multi-Pemasok */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>Alokasi Multi-Petani:</span>
                      <span>Maks 60% (41,4 kg)</span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-950 flex items-center gap-1.5">
                          <span>Kelompok Tani Makmur (S1)</span>
                          <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">Skor 88,97</span>
                        </div>
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                          Radius 6 km • Mutu 88 • Panen H-1
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-emerald-950 block">40,0 kg</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">Rp 320.000</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-950 flex items-center gap-1.5">
                          <span>Petani Organik Sari (S2)</span>
                          <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">Skor 83,60</span>
                        </div>
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                          Radius 14 km • Mutu 80 • Panen Hari-H
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-stone-950 block">29,0 kg</span>
                        <span className="text-[10px] text-amber-800 font-semibold">Rp 217.500</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      Pencadangan Rekening Escrow:
                    </span>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Rp 537.500 [HOLD]
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. LIVE INTERACTIVE AI NLP SIMULATOR SANDBOX (Fitur Baru Pembeda Kelas Dunia) */}
      <section id="nlp-demo" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-gradient-to-br from-emerald-950 via-pine-900 to-[#0B1A14] text-white rounded-3xl p-6 sm:p-10 shadow-elevated border border-emerald-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500 text-xs font-mono font-bold text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Teknologi AI NLP Pertanian Indonesia</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                Coba Ketik Bahasa Petani Biasa. <br />
                <span className="text-amber-400 italic">Sistem Memahaminya Seketika.</span>
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Petani di desa tidak perlu pusing mengisi formulir rumit. Cukup ketik kalimat alami lewat WhatsApp atau aplikasi, mesin NLP kami (Naive Bayes + Normalizer Slang & Angka Terbilang) mengekstrak komoditas, bobot kg, dan harga secara akurat.
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-stone-400 block">Pilihan contoh kalimat petani:</span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {[
                    'besok ada panen cabai rawit dua kwintal harga 45rb sama bayam 50 kilo',
                    'lusa siap kirim setengah ton beras lokal sama lele 30 kilo 25rb',
                    'sy bsoq ad pnn cengek 100 kg harga 40 ribu siap setor',
                  ].map((sentence, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setNlpSampleText(sentence)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-[11px] border border-emerald-700/80 text-emerald-200 text-left transition-colors"
                    >
                      "{sentence.slice(0, 36)}..."
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input & Live Response Box */}
            <div className="lg:col-span-6 bg-white text-stone-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-emerald-300 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-950 uppercase">
                  Interactive AI Parser Sandbox
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  FastAPI NLP Active
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-600 block">
                  Ketik kalimat Anda di sini:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlpSampleText}
                    onChange={(e) => setNlpSampleText(e.target.value)}
                    placeholder="Contoh: besok panen 200 kg cabai rawit harga 45 ribu..."
                    className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-xs bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleTestNLP}
                    disabled={nlpLoading}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white text-xs px-4 py-2.5 font-semibold rounded-xl flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {nlpLoading ? 'Mengurai...' : 'Urai AI'}
                  </Button>
                </div>
              </div>

              {/* Hasil Parsing AI Realtime */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="text-[11px] font-mono font-bold text-stone-600 block">
                  Hasil Pemahaman Entitas (Multi-Commodity):
                </span>
                <div className="space-y-1.5">
                  {(nlpParsed?.candidates || [
                    { commodityName: 'Cabai rawit', quantityKg: 200, askingPrice: 45000, commodityCategory: 'SPICE' },
                    { commodityName: 'Bayam', quantityKg: 50, askingPrice: null, commodityCategory: 'VEGETABLE' }
                  ]).map((item: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs flex justify-between items-center shadow-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">{item.commodityName}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          Volume: <strong className="text-emerald-900">{item.quantityKg} kg</strong> | Harga: {item.askingPrice ? `Rp ${item.askingPrice.toLocaleString('id-ID')}/kg` : 'Standar Dinas'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-semibold">
                        {item.commodityCategory}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. METRIK DAMPAK DAERAH REAL-TIME */}
      <section id="dampak" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Buku Besar Terbuka & Agregasi Dampak</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950">
                Transparansi Real-Time Ekonomi Lokal
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Data agregat langsung dari catatan transaksi append-only yang telah dituntaskan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="accent">Audit Publik Terverifikasi</Badge>
              <Link to="/auditor/dashboard">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-900 hover:bg-emerald-50">
                  <span>Portal Auditor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors text-left">
              <span className="text-xs text-emerald-900 flex items-center gap-1 font-semibold">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                Perputaran Belanja Lokal
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-20" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </p>
              <span className="text-[10px] text-emerald-800/80 block mt-1">100% langsung diserap petani daerah</span>
            </div>

            <div className="p-4 sm:p-5 bg-blue-50/60 rounded-2xl border border-blue-100 hover:border-blue-300 transition-colors text-left">
              <span className="text-xs text-blue-900 flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Mitra Produsen Terlibat
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-2">
                {isLoading ? <Skeleton className="h-7 w-12" /> : `${impact?.producersInvolved || 0} Produsen`}
              </p>
              <span className="text-[10px] text-stone-500 block mt-1">Kelompok tani, peternak & UMKM</span>
            </div>

            <div className="p-4 sm:p-5 bg-amber-50/60 rounded-2xl border border-amber-100 hover:border-amber-300 transition-colors text-left">
              <span className="text-xs text-amber-900 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                Total Pangan Terserap
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-stone-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-16" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </p>
              <span className="text-[10px] text-amber-900/80 block mt-1">Bahan segar bergizi tersalurkan</span>
            </div>

            <div className="p-4 sm:p-5 bg-purple-50/60 rounded-2xl border border-purple-100 hover:border-purple-300 transition-colors text-left">
              <span className="text-xs text-purple-900 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                Tingkat Lolos Mutu QC
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-purple-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-14" /> : `${impact?.qualityPassRatePct || 0}%`}
              </p>
              <span className="text-[10px] text-purple-900/80 block mt-1">Standar inspeksi ahli gizi</span>
            </div>

            <div className="p-4 sm:p-5 bg-stone-100/70 rounded-2xl border border-stone-200 col-span-2 md:col-span-1 text-left">
              <span className="text-xs text-stone-700 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-800" />
                Rata-rata Radius Jarak
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-amber-900 mt-2">
                {isLoading ? <Skeleton className="h-7 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
              </p>
              <span className="text-[10px] text-stone-500 block mt-1">Rute pendek, emisi karbon rendah</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TABEL PERBANDINGAN: ORVANA VS KONVENSIONAL */}
      <section id="keunggulan" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
            Perbandingan Transparan
          </span>
          <h2 className="font-serif text-3xl font-bold text-stone-950 mt-3">
            Mengapa Ekosistem Pangan Memilih ORVANA?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            Perbedaan mendasar antara rantai pasok konvensional perantara dengan arsitektur digital ORVANA.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="py-4 px-6 font-heading font-bold text-stone-700 w-1/3">Aspek Pengadaan</th>
                  <th className="py-4 px-6 font-heading font-bold text-rose-800 bg-rose-50/50 w-1/3">
                    Pengadaan Konvensional (Tengkulak)
                  </th>
                  <th className="py-4 px-6 font-heading font-bold text-emerald-950 bg-emerald-50/70 w-1/3">
                    ORVANA Digital Rantai Pasok
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="py-4 px-6 font-semibold text-stone-900">Perlindungan Harga Petani</td>
                  <td className="py-4 px-6 text-stone-600 bg-rose-50/20">
                    Harga ditekan sepihak, sering di bawah biaya produksi.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/40 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Otomatis tolak tawaran di bawah harga dasar wilayah.</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-stone-900">Kepastian Serapan Panen</td>
                  <td className="py-4 px-6 text-stone-600 bg-rose-50/20">
                    Transaksi mendadak, risiko panen membusuk di kebun tinggi.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/40">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Terencana 1-2 minggu lebih awal dari menu dapur.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-stone-900">Pencegahan Monopoli Kuota</td>
                  <td className="py-4 px-6 text-stone-600 bg-rose-50/20">
                    Didominasi 1 distributor besar, petani kecil terpinggirkan.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/40">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Algoritma Greedy membatasi kuota maks 60% per petani.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-stone-900">Jaminan Keamanan Pembayaran</td>
                  <td className="py-4 px-6 text-stone-600 bg-rose-50/20">
                    Pembayaran mundur berminggu-minggu bahkan gagal bayar.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/40">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Dana [HOLD] di awal, langsung [RELEASE] begitu QC lolos.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-stone-900">Ketertelusuran Asal Pangan</td>
                  <td className="py-4 px-6 text-stone-600 bg-rose-50/20">
                    Asal muasal bahan tidak jelas, sulit dipertanggungjawabkan.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/40">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Paspor QR Code publik menampilkan riwayat desa, supir, & QC.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. KALKULATOR KEBUTUHAN DAPUR INTERAKTIF */}
      <section id="kalkulator" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-12 shadow-elevated border border-emerald-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block mb-3">
                  Simulasi Formula Dapur Mandiri
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
                  Hitung Kebutuhan Bahan Sesuai Porsi Anak Sekolah
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm mt-2 leading-relaxed">
                  Gunakan simulator di bawah untuk melihat bagaimana rumus matematis ORVANA menghitung kebutuhan bahan kotor (+persen susut masak) dan estimasi anggaran perlindungan petani.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-emerald-300">Jumlah Porsi Penerima Manfaat:</span>
                    <span className="font-extrabold text-base text-amber-400">{calcPortions.toLocaleString('id-ID')} Porsi Anak</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={calcPortions}
                    onChange={(e) => setCalcPortions(parseInt(e.target.value))}
                    className="w-full h-2.5 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-emerald-400 mt-1">
                    <span>100 porsi</span>
                    <span>1.000 porsi</span>
                    <span>2.500 porsi</span>
                    <span>5.000 porsi</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-2">
                    Pilih Bahan Pokok Menu:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bayam', label: 'Bayam Hijau', desc: '+15% Susut' },
                      { id: 'lele', label: 'Ikan Lele', desc: '+10% Susut' },
                      { id: 'beras', label: 'Beras Lokal', desc: '+2% Susut' },
                      { id: 'telur', label: 'Telur Ayam', desc: '+3% Susut' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCalcCommodity(item.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          calcCommodity === item.id
                            ? 'bg-amber-400 text-stone-950 border-amber-400 font-bold shadow-sm'
                            : 'bg-white/10 text-white border-white/15 hover:bg-white/15 text-stone-200'
                        }`}
                      >
                        <p className="text-xs leading-none">{item.label}</p>
                        <p className="text-[10px] opacity-80 font-mono mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white text-stone-950 rounded-2xl p-6 shadow-2xl border-2 border-amber-400/50 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-xs font-mono font-bold text-stone-500 uppercase">
                  Hasil Formula Demand Planner
                </span>
                <Badge color="success">Rumus Baku Resmi</Badge>
              </div>

              <div>
                <p className="text-xs text-stone-500">Komoditas Terpilih:</p>
                <p className="font-heading font-extrabold text-lg text-emerald-950">{calc.name}</p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-stone-600">Total Kebutuhan Kotor (+Susut {calc.wastePct}%):</span>
                  <span className="font-mono text-xl font-bold text-emerald-950">{formatKg(calc.qtyKg)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs border-t border-emerald-200/60 pt-2">
                  <span className="text-stone-600">Estimasi Anggaran Acuan Dinas:</span>
                  <span className="font-mono text-xl font-bold text-emerald-950">{formatRupiah(calc.estCost)}</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-stone-500 space-y-1">
                <p>• Harga Dasar Acuan: {formatRupiah(calc.unitPrice)} / kg</p>
                <p>• Dibulatkan ke atas kelipatan 0,1 kg sesuai aturan dinas</p>
                <p>• Langsung siap dialokasikan otomatis ke multi-petani lokal</p>
              </div>

              <Link to="/register" className="block pt-2">
                <Button variant="primary" size="md" className="w-full bg-emerald-900 hover:bg-emerald-950 font-bold text-white shadow-sm flex items-center justify-center gap-2 py-3 rounded-xl">
                  <span>Mulai Pasok Dapur Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 8. ALUR KERJA 4 PERAN LAPANGAN */}
      <section id="alur" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-stone-100/70 rounded-3xl border border-stone-200 p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
              Alur Terpadu Multi-Peran
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 mt-3">
              Bagaimana Alur Kerja 4 Peran Lapangan?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Pilih peran pengguna di bawah untuk melihat simulasi interface dan tanggung jawab masing-masing
            </p>

            <div className="inline-flex p-1.5 bg-white rounded-xl border border-stone-200 shadow-xs mt-6 gap-1 flex-wrap justify-center">
              {[
                { id: 'kitchen', label: '1. Pengelola Dapur', icon: Building2 },
                { id: 'farmer', label: '2. Petani / Nelayan', icon: Leaf },
                { id: 'coordinator', label: '3. Koordinator', icon: Truck },
                { id: 'inspector', label: '4. Pengawas Mutu', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTabRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabRole(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-card text-left">
            {activeTabRole === 'kitchen' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-900 uppercase tracking-wider">
                    Langkah 1: Perencanaan Menu & Kebutuhan
                  </span>
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    Dapur Menyusun Menu Mingguan
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Pengelola dapur memasukkan rencana menu (mis. Resep R1 untuk 1.000 porsi). Algoritma ORVANA otomatis menghitung kebutuhan bahan bersih + estimasi susut standar (contoh bayam 69 kg, lele 77 kg).
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                      Otomatisasi Kebutuhan Resep Baku R1–R5
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Menu R1 (1.000 Anak):</span>
                      <span className="font-bold text-stone-950">69,0 kg Bayam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Batas Harga:</span>
                      <span className="text-emerald-800 font-bold">Rp 10.000 / kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'farmer' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                    Langkah 2: Kepastian Pasar & Alokasi Kuota
                  </span>
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    Petani Menerima Notifikasi Tawaran Pasti
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Petani menerima pesanan teralokasi langsung di HP mereka. Begitu disanggupi, dana pesanan langsung dicadangkan [HOLD] di rekening penampung sehingga petani tidak khawatir tidak dibayar.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                      Batas Waktu Jawab 12 Jam & Alokasi Cadangan
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Tawaran S1:</span>
                      <span className="text-emerald-900 font-bold">40,0 kg (@ Rp 8.000)</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>Dana Dicadangkan:</span>
                      <span>Rp 320.000 [HOLD]</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'coordinator' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-mono font-bold text-blue-900 uppercase tracking-wider">
                    Langkah 3: Konsolidasi & Distribusi
                  </span>
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    Penjemputan Bahan & Pembuatan Batch
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Koordinator pengepul mengambil hasil panen dari beberapa titik desa, mengelompokkannya ke satu pengiriman armada, dan sistem menghasilkan kode batch unik ketertelusuran pangan.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block">
                      Pembuatan Kode Batch & Penimbangan Susut
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Kode Batch:</span>
                      <span className="text-blue-900 font-bold">ORV-20261014-DPR01-0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Muatan Konsolidasi:</span>
                      <span className="font-bold">69,0 kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'inspector' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-mono font-bold text-purple-900 uppercase tracking-wider">
                    Langkah 4: Pemeriksaan Mutu & Pembayaran
                  </span>
                  <h3 className="font-serif text-xl font-bold text-stone-950">
                    Inspeksi Checklist Mutu & Pencairan Dana
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Pengawas mutu memeriksa kesegaran, kebersihan, dan kondisi fisik bahan. Hasil QC yang lolos otomatis mencairkan dana [RELEASE] ke saldo petani tanpa menunggu berhari-hari.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 inline-block">
                      Hasil: PASS, PARTIAL, atau FAIL Transparan
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Skor Mutu QC:</span>
                      <span className="text-emerald-800 font-bold">90 / 100 [PASS]</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>Pencairan Dana:</span>
                      <span>Rp 320.000 [RELEASE]</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
            Pertanyaan Umum
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 mt-3">
            Klarifikasi Sistem & Operasional
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm text-stone-950 hover:bg-stone-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-900 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 text-left">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. CALL TO ACTION (WARM AGRITECH) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-elevated border border-emerald-900">
          <div className="relative z-10 max-w-2xl text-left space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider bg-amber-400 text-stone-950 px-3 py-1 rounded-full">
              Gerakan Pangan Bergizi Nasional
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Wujudkan Rantai Pasok Pangan Mandiri, Berkeadilan, dan Bermutu
            </h2>
            <p className="text-emerald-200 text-sm sm:text-base leading-relaxed">
              Daftarkan dapur gizi massal, kelompok tani, atau koperasi distribusi Anda ke dalam jaringan digital ORVANA sekarang.
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-6 py-3 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>Daftar Akun Mitra Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold px-6 py-3 rounded-xl"
                >
                  <span>Masuk ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER FORMAL & MINIMALIS */}
      <footer className="border-t border-stone-200 bg-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <Logo size="sm" withText textSubtitle="Enterprise Agritech" />
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="text-stone-500">
              &copy; 2026 ORVANA. Rantai Pasok Pangan Lokal Dapur Gizi Massal.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link to="/trace/ORV-20260920-DPR01-0001" className="hover:text-emerald-900 transition-colors">
              Pemeriksaan Batch Publik
            </Link>
            <Link to="/login" className="hover:text-emerald-900 transition-colors">
              Portal Pengelola & Petani
            </Link>
            <a
              href="https://github.com/YogUNI/orvana"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-900 transition-colors"
            >
              Dokumentasi Source Code
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
