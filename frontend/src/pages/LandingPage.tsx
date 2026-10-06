import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { formatRupiah, formatKg } from '../lib/format';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Logo } from '../components/ui/Logo';
import { SupplyChain3DHero } from '../features/landing/SupplyChain3DHero';
import { ScrollStorytellingActor } from '../features/landing/ScrollStorytellingActor';
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

  // Scroll Spy Active Section & Scrolled Navbar Glass State
  const [activeSection, setActiveSection] = useState<string>('');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Refs for smooth animated sliding pill indicator
  const navContainerRef = React.useRef<HTMLDivElement | null>(null);
  const navItemRefs = React.useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const [pillStyle, setPillStyle] = useState<{
    left: number;
    width: number;
    top: number;
    height: number;
    opacity: number;
    isHovered: boolean;
  }>({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    opacity: 0,
    isHovered: false,
  });

  // Update animated sliding pill position based on hovered link or active section
  React.useEffect(() => {
    const targetKey = hoveredNav || activeSection;
    if (targetKey && navItemRefs.current[targetKey] && navContainerRef.current) {
      const targetEl = navItemRefs.current[targetKey]!;
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      setPillStyle({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
        top: targetRect.top - containerRect.top,
        height: targetRect.height,
        opacity: 1,
        isHovered: !!hoveredNav,
      });
    } else {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [hoveredNav, activeSection]);

  React.useEffect(() => {
    const sections = ['alur', 'kalkulator', 'nlp-demo', 'dampak'];
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      const scrollY = currentScrollY + 120;
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
      if (currentScrollY < 200) {
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
      const res: any = await apiClient.post('/public/parse-text', { text: nlpSampleText.trim() });
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
      
      {/* FLOATING GLASS DOCK / ISLAND NAVBAR */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 py-3 transition-all duration-300 pointer-events-none">
        <div
          className={`max-w-7xl mx-auto rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 pointer-events-auto transition-all duration-300 ${
            isScrolled
              ? 'bg-white/85 backdrop-blur-xl border border-stone-200/90 shadow-lg shadow-stone-900/5'
              : 'bg-white/60 backdrop-blur-md border border-stone-200/60 shadow-xs'
          }`}
        >
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

          {/* Nav Links: Ramping, Bersih, Lega dengan highlight pill halus */}
          <nav
            ref={navContainerRef}
            onMouseLeave={() => setHoveredNav(null)}
            className="hidden lg:flex items-center relative text-xs font-medium text-stone-600 px-1 py-1"
          >
            {/* Soft Organic Floating Highlight Pill */}
            <div
              className="absolute rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                top: pillStyle.top,
                height: pillStyle.height,
                opacity: pillStyle.opacity,
                backgroundColor: 'rgba(20, 78, 55, 0.08)',
                border: '1px solid rgba(20, 78, 55, 0.15)',
              }}
            />

            {[
              { id: 'alur', label: 'Alur Kerja' },
              { id: 'kalkulator', label: 'Kalkulator' },
              { id: 'nlp-demo', label: 'Asisten AI', isAi: true },
              { id: 'dampak', label: 'Dampak' },
            ].map((nav) => {
              const isCurrentActive = activeSection === nav.id;
              const isCurrentHovered = hoveredNav === nav.id;
              const isHighlighted = isCurrentHovered || (!hoveredNav && isCurrentActive);

              return (
                <a
                  key={nav.id}
                  ref={(el) => {
                    navItemRefs.current[nav.id] = el;
                  }}
                  href={`#${nav.id}`}
                  onMouseEnter={() => setHoveredNav(nav.id)}
                  className={`relative z-10 px-4 py-2 rounded-full transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    isHighlighted
                      ? 'text-emerald-950 font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {nav.isAi && (
                    <Sparkles
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isHighlighted ? 'text-amber-500 scale-110' : 'text-amber-600/70'
                      }`}
                    />
                  )}
                  <span>{nav.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Quick Actions (Cek Batch, Masuk, Daftar) - Bersih & Rapi */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/trace"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900/90 hover:text-emerald-950 px-3 py-1.5 rounded-full hover:bg-emerald-100/60 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cek Batch</span>
            </Link>

            <Link
              to="/login"
              className="text-xs font-semibold text-stone-700 hover:text-stone-950 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors"
            >
              Masuk
            </Link>

            <Link to="/register">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-full bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
              >
                Daftar Mitra
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION ULTRA-CREATIVE DENGAN SPLIT DESIGN & FLOATING DOCK */}
      <section className="relative z-10 pt-4 sm:pt-7 pb-20 overflow-hidden border-b border-stone-200/80">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Sisi Kiri Hero: Value Proposition & Search Bar */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300/80 text-xs font-bold text-emerald-950 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Inovasi Rantai Pasok Pangan Bergizi Massal & Mandiri</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold text-stone-950 tracking-tight leading-[1.1]">
                Mencocokkan Menu Dapur dengan <br className="hidden sm:inline" />
                <span className="text-emerald-900 italic font-medium relative underline decoration-amber-500/80 decoration-wavy decoration-2">
                  Panen Petani Lokal.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-xl">
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

            {/* Sisi Kanan Hero: Visual Interactive 3D Supply Chain Showcase & Engine */}
            <div className="lg:col-span-6 flex justify-center items-center w-full">
              <SupplyChain3DHero />
            </div>

          </div>
        </div>

        {/* Ambient Infinite Supply Chain Logistics Ribbon (Pita Animasi Mengalir Halus) */}
        <div className="w-full mt-10 border-t border-b border-stone-200/80 bg-white/60 backdrop-blur-md py-3 overflow-hidden select-none">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            {[1, 2].map((loopIdx) => (
              <div key={loopIdx} className="flex items-center gap-8 shrink-0 text-xs font-mono text-stone-600">
                <span className="flex items-center gap-2 text-emerald-950 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ALIRAN INTEGRASI DIGITAL
                </span>
                <span className="text-stone-300">/</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-semibold">🌾 Petik Panen Desa</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Cap 60%</span>
                </span>
                <span className="text-stone-400">➔</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-semibold">🚚 Logistik Suhu Dingin</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">+4°C</span>
                </span>
                <span className="text-stone-400">➔</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-semibold">🔍 Uji Mutu Ahli Gizi</span>
                  <span className="text-[10px] text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded font-bold">QC 100%</span>
                </span>
                <span className="text-stone-400">➔</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-semibold">🍳 Dapur Gizi Massal</span>
                  <span className="text-[10px] text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded font-bold">1.000 Porsi</span>
                </span>
                <span className="text-stone-400">➔</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-900 font-semibold">🔒 Pencairan Escrow Instan</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Real-time</span>
                </span>
                <span className="text-stone-300">/</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 3D SCROLL-TELLING PRESENTATION DOCK (Peti Panen Meluncur Mengikuti Scroll) */}
      <ScrollStorytellingActor />

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

      {/* 8. ALUR KERJA 4 PERAN LAPANGAN (INTERACTIVE ROLE ECOSYSTEM) */}
      <section id="alur" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        
        {/* Header Bagian */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3.5 py-1.5 rounded-full border border-emerald-300/80 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-emerald-800" />
              <span>Sinergi Ekosistem 4 Peran Lapangan</span>
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950 tracking-tight">
              Bagaimana Alur Kerja 4 Peran Lapangan?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Jelajahi simulasi tanggung jawab dan tampilan interaksi setiap aktor pengadaan dari dapur gizi hingga petani lokal dalam satu siklus terpadu.
            </p>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-xs">
              {[
                { id: 'kitchen', step: '01', label: 'Pengelola Dapur', roleDesc: 'Perencana Menu & Kebutuhan', icon: Building2 },
                { id: 'farmer', step: '02', label: 'Petani / Nelayan', roleDesc: 'Penyedia Panen & Pasokan', icon: Leaf },
                { id: 'coordinator', step: '03', label: 'Koordinator', roleDesc: 'Konsolidasi & Logistik', icon: Truck },
                { id: 'inspector', step: '04', label: 'Pengawas Mutu', roleDesc: 'Inspeksi QC & Escrow', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTabRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabRole(tab.id as any)}
                    className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-950 text-white shadow-md shadow-emerald-950/20 ring-1 ring-emerald-800'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-emerald-800/80 text-amber-300' : 'bg-stone-100 text-stone-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-amber-400' : 'text-stone-400'}`}>
                          {tab.step}
                        </span>
                        <p className="text-xs font-bold truncate leading-tight">{tab.label}</p>
                      </div>
                      <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-emerald-200' : 'text-stone-400'}`}>
                        {tab.roleDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Role Showcase Container */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg shadow-stone-900/5">
            {activeTabRole === 'kitchen' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 text-xs font-mono font-bold border border-emerald-200">
                    <span>LANGKAH 01</span>
                    <span>•</span>
                    <span>DEMAND PLANNING & FORECASTING</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    Dapur Menyusun Rencana Menu Terjadwal
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Pengelola dapur memasukkan rencana menu bergizi massal 1–2 minggu sebelum jadwal masak (mis. Resep R1 untuk 1.000 porsi penerima manfaat). Sistem ORVANA secara matematis mengonversi resep menjadi kebutuhan bahan baku kotor lengkap dengan toleransi susut masak.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      ✓ Formula Baku Resep R1–R5
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-stone-700 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                      ✓ Toleransi Susut Otomatis (+15%)
                    </span>
                  </div>
                </div>
                
                {/* Visual Simulation Card */}
                <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-5 shadow-xl border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-stone-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      DEMAND GENERATED
                    </span>
                    <span>DAPUR-01</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Target Menu:</span>
                      <span className="font-bold text-white">Resep R1 (1.000 Porsi)</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Kebutuhan Bayam:</span>
                      <span className="font-bold text-amber-400 text-sm">69,0 kg (+15% susut)</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Batas Harga Acuan:</span>
                      <span className="font-bold text-emerald-400">Rp 10.000 / kg</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-stone-800 pt-2 text-[11px]">
                      <span className="text-stone-400">Status Alokasi:</span>
                      <span className="text-emerald-400">Mencocokkan Panen Lokal...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'farmer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-mono font-bold border border-amber-200">
                    <span>LANGKAH 02</span>
                    <span>•</span>
                    <span>GUARANTEED CONTRACT & SMART ESCROW</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    Petani Menerima Alokasi Kuota & Jaminan Pasar
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Petani dan nelayan lokal di pedesaan menerima kuota pesanan pasti langsung melalui notifikasi. Begitu tawaran disanggupi, dana pesanan langsung dicadangkan [HOLD] ke rekening penampung resmi (*escrow*) sehingga produsen terlindungi dari risiko gagal bayar.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-mono font-semibold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                      ✓ Batas Waktu Respon 12 Jam
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      ✓ Dana Terkunci Aman [HOLD]
                    </span>
                  </div>
                </div>

                {/* Visual Simulation Card */}
                <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-5 shadow-xl border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-stone-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      ORDER ALLOCATED
                    </span>
                    <span>FARMER-S1</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Nama Produsen:</span>
                      <span className="font-bold text-white">Pak Sugeng (Poktan Makmur)</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Alokasi Pasokan:</span>
                      <span className="font-bold text-amber-400 text-sm">40,0 kg @ Rp 8.000</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Total Nilai Hak:</span>
                      <span className="font-bold text-white">Rp 320.000</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-stone-800 pt-2 text-[11px]">
                      <span className="text-stone-400">Status Saldo Escrow:</span>
                      <span className="text-amber-400 font-bold">DICADANGKAN [HOLD]</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'coordinator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 text-xs font-mono font-bold border border-blue-200">
                    <span>LANGKAH 03</span>
                    <span>•</span>
                    <span>CONSOLIDATION & QR TRACEABILITY</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    Koordinator Mengonsolidasi & Memberi Label Batch
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Koordinator wilayah menjemput panen dari kelompok tani dalam radius pendek (&lt; 25 km), mencatat timbangan susut transit secara digital, dan menerbitkan kode batch QR resmi yang menghubungkan data produsen desa dengan dapur penerima.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      ✓ Penimbangan Digital Anti-Kecurangan
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-stone-700 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                      ✓ Cetak Paspor Batch QR Otomatis
                    </span>
                  </div>
                </div>

                {/* Visual Simulation Card */}
                <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-5 shadow-xl border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-stone-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      LOGISTICS IN TRANSIT
                    </span>
                    <span>EXP-JKT-01</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Nomor Batch:</span>
                      <span className="font-bold text-blue-300">ORV-20261014-DPR01-0001</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Total Muatan:</span>
                      <span className="font-bold text-white text-sm">69,0 kg (2 Titik Desa)</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Radius Jarak:</span>
                      <span className="font-bold text-white">8,57 km</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-stone-800 pt-2 text-[11px]">
                      <span className="text-stone-400">Sertifikasi Batch:</span>
                      <span className="text-blue-400">QR Paspor Siap Di-scan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'inspector' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 text-xs font-mono font-bold border border-purple-200">
                    <span>LANGKAH 04</span>
                    <span>•</span>
                    <span>QC INSPECTION & AUTOMATIC SETTLEMENT</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    Inspeksi Ahli Gizi & Pencairan Dana Seketika
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Pengawas mutu dan ahli gizi memeriksa bahan pangan yang tiba di dapur menggunakan instrumen checklist standar dinas. Begitu status mutu dinyatakan Lolos Prima [PASS], sistem otomatis mengeksekusi pencairan saldo [RELEASE] langsung ke rekening petani secara transparan.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-mono font-semibold text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                      ✓ Audit Mutu PASS / PARTIAL / FAIL
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      ✓ Pencairan Dana Tuntas [RELEASE]
                    </span>
                  </div>
                </div>

                {/* Visual Simulation Card */}
                <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-5 shadow-xl border border-stone-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-stone-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      QC VERIFIED & SETTLED
                    </span>
                    <span>INSPECTOR-01</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Skor Mutu Uji Fisik:</span>
                      <span className="font-bold text-emerald-400 text-sm">90 / 100 [PASS]</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Kondisi Bahan:</span>
                      <span className="font-bold text-white">Segar, Bersih, Higienis</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-stone-400">Tindakan Pembayaran:</span>
                      <span className="font-bold text-white">Rp 320.000 [RELEASE]</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-stone-800 pt-2 text-[11px]">
                      <span className="text-stone-400">Buku Besar Audit:</span>
                      <span className="text-emerald-400 font-bold">TERCATAT APPEND-ONLY</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
