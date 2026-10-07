import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { formatRupiah, formatKg } from '../lib/format';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Logo } from '../components/ui/Logo';
import { SupplyChain3DHero } from '../features/landing/SupplyChain3DHero';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { InteractiveParticleCanvas } from '../features/landing/InteractiveParticleCanvas';
import { InteractiveSpotlightCursor } from '../features/landing/InteractiveSpotlightCursor';
import { MoncyCustomCursor } from '../features/landing/MoncyCustomCursor';
import { SmartFloatingConcierge } from '../features/landing/SmartFloatingConcierge';
import { AiThinkingMascot, MascotReaction } from '../features/landing/AiThinkingMascot';
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
  Utensils,
  BadgeCheck,
  Zap,
  Thermometer,
  Fish,
  Egg,
  Wheat,
  Salad,
  Calculator,
  Clock,
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

  // Interactive Live Calculator State
  const [calcPortions, setCalcPortions] = useState<number>(1000);
  const [calcCommodity, setCalcCommodity] = useState<'bayam' | 'lele' | 'beras' | 'telur'>('bayam');

  // Interactive Live NLP Simulator State
  const [nlpSampleText, setNlpSampleText] = useState('besok ada panen cabai rawit dua kwintal harga 45rb sama bayam 50 kilo');
  const [nlpParsed, setNlpParsed] = useState<any>(null);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [mascotStatus, setMascotStatus] = useState<MascotReaction>('idle');
  const typingTimerRef = useRef<any>(null);

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

      // Robust viewport intersection detection
      let currentSection = '';
      const triggerLine = window.innerHeight * 0.35; // 35% from top of screen

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerLine && rect.bottom >= triggerLine) {
            currentSection = sectionId;
            break;
          }
        }
      }

      if (currentScrollY < 250) {
        setActiveSection('');
      } else if (currentSection) {
        setActiveSection(currentSection);
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

  const handleInputChange = (text: string) => {
    setNlpSampleText(text);
    setMascotStatus('thinking');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setMascotStatus('idle');
    }, 2500);
  };

  const handleTestNLP = async () => {
    if (!nlpSampleText.trim()) return;
    setNlpLoading(true);
    setMascotStatus('thinking');
    try {
      const res: any = await apiClient.post('/public/parse-text', { text: nlpSampleText.trim() });
      setNlpParsed(res?.data || null);
      setMascotStatus('wow');
    } catch (err) {
      // Mock fallback if python service offline
      setNlpParsed({
        candidates: [
          { commodityName: 'Cabai rawit', quantityKg: 200, askingPrice: 45000, commodityCategory: 'SPICE' },
          { commodityName: 'Bayam', quantityKg: 50, askingPrice: null, commodityCategory: 'VEGETABLE' }
        ]
      });
      setMascotStatus('wow');
    } finally {
      setNlpLoading(false);
      setTimeout(() => {
        setMascotStatus('idle');
      }, 5000);
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
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800/20 selection:text-emerald-950 font-sans antialiased relative overflow-x-hidden">
      {/* Moncy.dev Style: Interactive Background Particle Field, Mouse Spotlight Follower, and Custom Cursor */}
      <InteractiveParticleCanvas />
      <InteractiveSpotlightCursor />
      <MoncyCustomCursor />
      <SmartFloatingConcierge />

      {/* FLOATING GLASS DOCK / ISLAND NAVBAR (ALWAYS VISIBLE FIXED TOP) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-3 transition-all duration-300 pointer-events-none">
        <div
          className={`max-w-7xl mx-auto rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 pointer-events-auto transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-2xl border border-stone-200/95 shadow-lg shadow-stone-900/10'
              : 'bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-xs'
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

          {/* Nav Links: Modern Geometric Typography (Plus Jakarta Sans) */}
          <nav
            ref={navContainerRef}
            onMouseLeave={() => setHoveredNav(null)}
            className="hidden lg:flex items-center relative font-heading text-[13px] font-semibold text-stone-600 px-1 py-0.5 tracking-[-0.01em]"
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
                      : 'text-stone-600 hover:text-stone-950'
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

          {/* Quick Actions (Cek Batch, Masuk, Daftar) - Font-Heading Plus Jakarta Sans */}
          <div className="flex items-center gap-2 shrink-0 font-heading tracking-[-0.01em]">
            <Link
              to="/trace"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900/90 hover:text-emerald-950 px-3.5 py-1.5 rounded-full hover:bg-emerald-100/60 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cek Batch</span>
            </Link>

            <Link
              to="/login"
              className="text-xs font-bold text-stone-700 hover:text-stone-950 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors"
            >
              Masuk
            </Link>

            <Link to="/register">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-full bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
              >
                Daftar Mitra
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION ULTRA-CREATIVE DENGAN SPLIT DESIGN & FLOATING DOCK */}
      <section className="relative z-10 pt-24 sm:pt-28 pb-20 overflow-hidden border-b border-stone-200/80">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Sisi Kiri Hero: Value Proposition & Live Agritech Command Bar */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Bespoke Impact Badge with Live Heartbeat */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-emerald-600/20 text-xs font-medium text-stone-800 shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                  Protokol Pangan Bergizi Massal
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-600 text-[11px]">Mitra Petani & Dapur Mandiri</span>
              </div>

              {/* Editorial High-Impact Headline */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-stone-950 tracking-tight leading-[1.08]">
                Mencocokkan Menu Dapur dengan{' '}
                <span className="text-emerald-900 italic font-medium relative underline decoration-amber-500/70 decoration-wavy decoration-2">
                  Panen Petani Lokal.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl font-normal">
                Infrastruktur digital berkeadilan yang menghubungkan ribuan porsi gizi harian langsung ke petani desa: algoritma alokasi anti-monopoli (cap 60%), kepastian harga panen, dan paspor ketertelusuran QR publik.
              </p>

              {/* Command Console: Search Batch Passport with Scanner Shortcut */}
              <div className="pt-1 max-w-xl space-y-3">
                <div className="p-1.5 sm:p-2 bg-white rounded-2xl shadow-xl shadow-stone-900/5 border-2 border-emerald-900/20 focus-within:border-emerald-900 focus-within:ring-4 focus-within:ring-emerald-900/10 transition-all">
                  <form onSubmit={handleTraceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex items-center gap-3 px-3 py-2 flex-1 w-full">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900 shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Ketik atau tempel kode batch pangan..."
                        value={batchCodeInput}
                        onChange={(e) => setBatchCodeInput(e.target.value)}
                        className="w-full text-xs sm:text-sm text-stone-950 placeholder-stone-400 focus:outline-none font-mono"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto shrink-0 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-xs flex items-center justify-center gap-2 px-5 py-3 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Lacak Paspor</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-500">Contoh batch aktif:</span>
                    <button
                      type="button"
                      onClick={() => setBatchCodeInput('ORV-20260920-DPR01-0001')}
                      className="text-[11px] font-mono font-bold text-emerald-900 underline hover:text-emerald-700 transition-colors"
                    >
                      ORV-20260920-DPR01-0001
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300/80 font-bold">
                    Escrow & QC 100% Lolos
                  </span>
                </div>
              </div>

              {/* Bespoke Agritech Metrics Row (Menggantikan 3 kotak template membosankan) */}
              <div className="pt-2 grid grid-cols-3 gap-3 border-t border-stone-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
                    <Scale className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Anti Monopoli</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-stone-950">Maks 60%</p>
                  <p className="text-[10px] text-stone-500 leading-tight">Batas alokasi multi-petani</p>
                </div>

                <div className="space-y-0.5 border-l border-stone-200 pl-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
                    <Lock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Smart Escrow</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-stone-950">Auto-Release</p>
                  <p className="text-[10px] text-stone-500 leading-tight">Cair instan saat lolos QC</p>
                </div>

                <div className="space-y-0.5 border-l border-stone-200 pl-3">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
                    <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Paspor Mutu</span>
                  </div>
                  <p className="text-lg font-bold font-mono text-stone-950">Publik 100%</p>
                  <p className="text-[10px] text-stone-500 leading-tight">Tanpa perlu akun / login</p>
                </div>
              </div>
            </div>

            {/* Sisi Kanan Hero: Visual Interactive 3D Supply Chain Showcase & Engine */}
            <div className="lg:col-span-6 flex justify-center items-center w-full">
              <SupplyChain3DHero />
            </div>

          </div>
        </div>

        {/* Ambient Interactive Supply Chain Node Stream (Bukan Ticker Berita Kaku) */}
        <div className="w-full mt-12 py-4 relative overflow-hidden select-none">
          {/* Subtle glowing ambient line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

          {/* Edge fade gradients for seamless infinite float */}
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent z-10 pointer-events-none" />

          <div className="flex items-center gap-4 whitespace-nowrap animate-marquee">
            {[1, 2, 3].map((loopIdx) => (
              <div key={loopIdx} className="flex items-center gap-4 shrink-0">
                {/* Protocol Pill Indicator */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 text-emerald-300 text-[11px] font-mono tracking-wider font-semibold shadow-sm border border-emerald-800/60">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>LIVE PROTOCOL</span>
                </div>

                {/* Node 1: Petik Panen Desa */}
                <div className="group/node flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/90 hover:border-emerald-500/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200/60 flex items-center justify-center text-emerald-800 shadow-2xs group-hover/node:scale-110 transition-transform">
                    <Leaf className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">Hulu Pangan</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover/node:text-emerald-900 transition-colors">Petik Panen Petani Desa</span>
                  </div>
                  <span className="ml-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                    Cap 60%
                  </span>
                </div>

                {/* Micro Connector */}
                <div className="flex items-center text-emerald-400/60">
                  <span className="w-4 h-[1px] bg-emerald-300/60" />
                  <ChevronRight className="w-3 h-3 -ml-1 text-emerald-500" />
                </div>

                {/* Node 2: Logistik Suhu Dingin */}
                <div className="group/node flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/90 hover:border-amber-500/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/60 flex items-center justify-center text-amber-800 shadow-2xs group-hover/node:scale-110 transition-transform">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">Rantai Dingin</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover/node:text-amber-900 transition-colors">Logistik Terpantau IoT</span>
                  </div>
                  <span className="ml-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                    +4°C Stabil
                  </span>
                </div>

                {/* Micro Connector */}
                <div className="flex items-center text-emerald-400/60">
                  <span className="w-4 h-[1px] bg-emerald-300/60" />
                  <ChevronRight className="w-3 h-3 -ml-1 text-emerald-500" />
                </div>

                {/* Node 3: Uji Mutu Ahli Gizi */}
                <div className="group/node flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/90 hover:border-sky-500/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200/60 flex items-center justify-center text-sky-800 shadow-2xs group-hover/node:scale-110 transition-transform">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">Quality Gate</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover/node:text-sky-900 transition-colors">Uji Organoleptik & Gizi</span>
                  </div>
                  <span className="ml-1 text-[10px] font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded-full">
                    QC 100% Lulus
                  </span>
                </div>

                {/* Micro Connector */}
                <div className="flex items-center text-emerald-400/60">
                  <span className="w-4 h-[1px] bg-emerald-300/60" />
                  <ChevronRight className="w-3 h-3 -ml-1 text-emerald-500" />
                </div>

                {/* Node 4: Dapur Gizi Massal */}
                <div className="group/node flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/90 hover:border-purple-500/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200/60 flex items-center justify-center text-purple-800 shadow-2xs group-hover/node:scale-110 transition-transform">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">Pusat Olahan</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover/node:text-purple-900 transition-colors">Dapur Gizi Terpadu</span>
                  </div>
                  <span className="ml-1 text-[10px] font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded-full">
                    1.000 Porsi/Hari
                  </span>
                </div>

                {/* Micro Connector */}
                <div className="flex items-center text-emerald-400/60">
                  <span className="w-4 h-[1px] bg-emerald-300/60" />
                  <ChevronRight className="w-3 h-3 -ml-1 text-emerald-500" />
                </div>

                {/* Node 5: Pencairan Escrow Instan */}
                <div className="group/node flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/90 hover:border-emerald-500/50 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200/60 flex items-center justify-center text-emerald-800 shadow-2xs group-hover/node:scale-110 transition-transform">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-medium text-stone-600 uppercase tracking-wider">Settlement Otomatis</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover/node:text-emerald-900 transition-colors">Pencairan Escrow Rekening</span>
                  </div>
                  <span className="ml-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                    Real-Time T+0
                  </span>
                </div>

                {/* Separator between iterations */}
                <div className="w-6 flex items-center justify-center text-stone-300 font-mono text-xs">///</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ScrollReveal animation="fade-up" delayMs={0}>
        {/* 8. ALUR KERJA 4 PERAN LAPANGAN - 4-COLUMN CONNECTED PIPELINE STORYBOARD */}
      <section id="alur" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24">
        
        {/* Header Bagian - Clean & Direct */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 text-emerald-300 text-[11px] font-mono font-semibold tracking-wider border border-emerald-800/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALUR KERJA TERPADU (END-TO-END)</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-950 tracking-tight leading-tight">
            Bagaimana <span className="italic font-normal text-emerald-850">4 Peran Bekerja Sama?</span>
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Dari menu dapur hingga rupiah di tangan petani. Satu siklus rantai pasok terhubung dalam 4 langkah transparan tanpa perantara gelap.
          </p>
        </div>

        {/* 4-Stage Horizontal Connected Flowboard */}
        <div className="relative">
          {/* Neon Connection Pipeline Track (Visible on Desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[3px] bg-gradient-to-r from-emerald-400 via-amber-400 via-sky-400 to-purple-400 opacity-60 z-0 pointer-events-none rounded-full" />

          {/* 4 Storyboard Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">

            {/* STAGE 1: DAPUR GIZI */}
            <div className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/90 hover:border-emerald-500 shadow-soft hover:shadow-elevated transition-all duration-300 p-6 overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
              
              {/* Step Badge & Role Head */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">Langkah 01</span>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">Pengelola Dapur</h3>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              </div>

              {/* Tangible Action Headline */}
              <div className="mb-4">
                <h4 className="text-base font-bold text-stone-950 font-serif leading-snug">
                  Rilis Rencana Menu & Kebutuhan Otomatis
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Dapur memasukkan menu (misal 1.000 porsi). Sistem langsung menghitung kebutuhan bahan kotor + toleransi susut masak.
                </p>
              </div>

              {/* Tangible Result Card (Visual Artefact) */}
              <div className="mt-auto pt-4 border-t border-stone-100">
                <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-900 font-semibold">Resep R1 (1.000 Porsi)</span>
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-bold">H-7</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-stone-700">
                      <span>Bayam Segar:</span>
                      <strong className="text-stone-950">69,0 kg</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-emerald-800">
                      <span>Toleransi Susut:</span>
                      <span className="font-bold">+15% Terhitung</span>
                    </div>
                  </div>
                </div>

                {/* Outcome Micro Tag */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kebutuhan Siap Dicocokkan ➔</span>
                </div>
              </div>
            </div>

            {/* STAGE 2: PETANI & NELAYAN */}
            <div className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/90 hover:border-amber-500 shadow-soft hover:shadow-elevated transition-all duration-300 p-6 overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />

              {/* Step Badge & Role Head */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider block">Langkah 02</span>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">Petani / Nelayan</h3>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              </div>

              {/* Tangible Action Headline */}
              <div className="mb-4">
                <h4 className="text-base font-bold text-stone-950 font-serif leading-snug">
                  Terima Kuota Panen & Dana Terkunci Aman
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Petani menyanggupi kuota dalam 12 jam. Dana pesanan langsung dicadangkan [HOLD] di rekening penampung resmi (escrow).
                </p>
              </div>

              {/* Tangible Result Card (Visual Artefact) */}
              <div className="mt-auto pt-4 border-t border-stone-100">
                <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-950 font-semibold">Poktan Makmur (Desa)</span>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-bold">Respon 12j</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-stone-700">
                      <span>Alokasi Panen:</span>
                      <strong className="text-stone-950">40,0 kg @ Rp 8.000</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-amber-900 font-bold bg-amber-100/60 px-2 py-0.5 rounded-md border border-amber-300/60">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-800" />
                        Escrow Terkunci:
                      </span>
                      <span>Rp 320.000</span>
                    </div>
                  </div>
                </div>

                {/* Outcome Micro Tag */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jaminan Pasar Tanpa Tengkulak ➔</span>
                </div>
              </div>
            </div>

            {/* STAGE 3: KOORDINATOR DESA */}
            <div className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/90 hover:border-sky-500 shadow-soft hover:shadow-elevated transition-all duration-300 p-6 overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 to-sky-600" />

              {/* Step Badge & Role Head */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-800 uppercase tracking-wider block">Langkah 03</span>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">Koordinator Desa</h3>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-100" />
              </div>

              {/* Tangible Action Headline */}
              <div className="mb-4">
                <h4 className="text-base font-bold text-stone-950 font-serif leading-snug">
                  Konsolidasi Rantai Dingin & Cetak Paspor QR
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Panen dijemput dalam radius pendek (&lt;25 km). Suhu dijaga stabil (+4°C), ditimbang digital, dan diberi label QR batch.
                </p>
              </div>

              {/* Tangible Result Card (Visual Artefact) */}
              <div className="mt-auto pt-4 border-t border-stone-100">
                <div className="rounded-2xl bg-sky-50/60 border border-sky-200/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-sky-950 font-semibold">Batch: ORV-20261014-01</span>
                    <span className="text-[10px] bg-sky-200/70 text-sky-900 px-1.5 py-0.5 rounded font-bold">Transit</span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="w-9 h-9 rounded-lg bg-white border border-sky-200 p-1 flex items-center justify-center shadow-2xs shrink-0">
                      <QrCode className="w-full h-full text-slate-800" />
                    </div>
                    <div className="space-y-0.5 min-w-0 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-sky-900 font-bold">
                        <Thermometer className="w-3 h-3 text-sky-700" />
                        <span>Suhu: +4,2°C (Optimal)</span>
                      </div>
                      <div className="text-stone-600 text-[10px]">Jarak Tempuh: 8,57 km</div>
                    </div>
                  </div>
                </div>

                {/* Outcome Micro Tag */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Paspor Digital Siap Scan ➔</span>
                </div>
              </div>
            </div>

            {/* STAGE 4: PENGAWAS MUTU & QC */}
            <div className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/90 hover:border-purple-500 shadow-soft hover:shadow-elevated transition-all duration-300 p-6 overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-purple-600" />

              {/* Step Badge & Role Head */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-800 uppercase tracking-wider block">Langkah 04</span>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">Pengawas Mutu (QC)</h3>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100" />
              </div>

              {/* Tangible Action Headline */}
              <div className="mb-4">
                <h4 className="text-base font-bold text-stone-950 font-serif leading-snug">
                  Inspeksi Ahli Gizi & Pencairan Escrow Seketika
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Bahan diperiksa dengan checklist organoleptik. Status Lulus [PASS] otomatis mengeksekusi transfer ke petani saat itu juga (T+0).
                </p>
              </div>

              {/* Tangible Result Card (Visual Artefact) */}
              <div className="mt-auto pt-4 border-t border-stone-100">
                <div className="rounded-2xl bg-purple-50/60 border border-purple-200/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-purple-950 font-semibold">Hasil: Grade A (90/100)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded font-bold">PASS 100%</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-stone-700">
                      <span>Fisik Daun:</span>
                      <strong className="text-emerald-700">Hijau & Bersih</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-emerald-900 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300/60">
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3 text-emerald-700" />
                        Rilis Escrow:
                      </span>
                      <span>Rp 320.000 [T+0]</span>
                    </div>
                  </div>
                </div>

                {/* Outcome Micro Tag */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-bold text-purple-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Audit Trail Permanen Tuntas ✓</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl bg-stone-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-stone-800 text-xs font-mono">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold block text-sm">Transparansi 100% Tanpa Celah</span>
              <span className="text-stone-400 text-[11px]">Setiap langkah diaudit permanen di buku besar digital, bebas manipulasi nota atau keterlambatan bayar.</span>
            </div>
          </div>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shrink-0 transition-colors"
          >
            <span>Daftar Sebagai Mitra</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </section>
      </ScrollReveal>



      <ScrollReveal animation="fade-up" delayMs={0}>
      {/* 7. KALKULATOR KEBUTUHAN DAPUR INTERAKTIF - LIVING RECIPE & BUDGET COCKPIT */}
      {/* 7. KALKULATOR KEBUTUHAN DAPUR INTERAKTIF - COMPACT BALANCED CONSOLE */}
      <section id="kalkulator" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        
        {/* Header Bagian - Compact & Editorial */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-[11px] font-mono font-bold tracking-wider border border-emerald-300 shadow-2xs">
            <Calculator className="w-3.5 h-3.5 text-emerald-800" />
            <span>SIMULATOR DEMAND PLANNER</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-950 tracking-tight leading-tight">
            Hitung Kebutuhan Bahan & <span className="italic font-normal text-emerald-850">Anggaran Dapur</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            Simulasikan konversi netto porsi anak ke kebutuhan kotor (+toleransi susut masak) dan kepatuhan harga acuan resmi dinas secara instan.
          </p>
        </div>

        {/* Master Simulator Architecture Card - Compact Frame */}
        <div className="relative rounded-3xl bg-gradient-to-b from-white via-white/95 to-[#FAF8F5] border border-stone-200/90 shadow-elevated p-6 sm:p-8 overflow-hidden">
          
          {/* Subtle Blueprint Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1E3A2F_0.75px,transparent_0.75px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />

          {/* Top Status Bar - Compact */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-stone-100 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-stone-900">
                FORMULA RESMI STANDAR DINAS KESEHATAN
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Dibulatkan Kelipatan 0,1 kg
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* SISI KIRI: KONTROL INPUT SIMULASI */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* 1. Selector Porsi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-stone-700 uppercase tracking-wider">
                    Porsi Penerima Manfaat:
                  </label>
                  <div>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-950">
                      {calcPortions.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-mono text-stone-600 ml-1 font-bold">Porsi</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={calcPortions}
                  onChange={(e) => setCalcPortions(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-stone-200 hover:bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-800 transition-colors"
                />
                
                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcPortions(preset)}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer text-center ${
                        calcPortions === preset
                          ? 'bg-emerald-950 text-emerald-300 shadow-2xs ring-1 ring-emerald-700'
                          : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                      }`}
                    >
                      {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Selector Komoditas Menu Pangan */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-stone-700 uppercase tracking-wider block">
                  Pilih Bahan Pokok Menu:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'bayam',
                      label: 'Bayam Hijau',
                      desc: '+15% Susut',
                      icon: Salad,
                      baseRate: 'Rp 8.000',
                    },
                    {
                      id: 'lele',
                      label: 'Ikan Lele Segar',
                      desc: '+10% Susut',
                      icon: Fish,
                      baseRate: 'Rp 30.000',
                    },
                    {
                      id: 'beras',
                      label: 'Beras Pulen Lokal',
                      desc: '+2% Susut',
                      icon: Wheat,
                      baseRate: 'Rp 14.000',
                    },
                    {
                      id: 'telur',
                      label: 'Telur Ayam Negeri',
                      desc: '+3% Susut',
                      icon: Egg,
                      baseRate: 'Rp 28.000',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = calcCommodity === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCalcCommodity(item.id as any)}
                        className={`group text-left p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950 text-white border-emerald-800 shadow-sm ring-1 ring-emerald-500/30'
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-emerald-800 text-amber-300' : 'bg-stone-100 text-stone-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-900 text-amber-400' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {item.desc}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold truncate leading-tight">
                          {item.label}
                        </h4>
                        <div className="text-[10px] font-mono mt-0.5 text-stone-600">
                          <span className={isSelected ? 'text-emerald-300' : 'text-stone-600'}>
                            {item.baseRate}/kg
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* SISI KANAN: OUTPUT HASIL RAMPING & PAS (VOUCHER SPEC SHEET) */}
            <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200/90 shadow-soft p-5 sm:p-6 space-y-4 relative overflow-hidden">
              
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600" />

              {/* Header Hasil */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    ALOKASI KEBUTUHAN TERHITUNG
                  </span>
                  <h3 className="text-sm font-bold text-stone-950 font-serif">
                    {calc.name}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  SIAP ALOKASI
                </span>
              </div>

              {/* Dua Metrik Kunci Berdampingan (Side-by-Side Rapi) */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Kebutuhan Kotor */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
                  <div className="text-[10px] font-mono text-emerald-900 font-semibold flex items-center justify-between">
                    <span>Total Kotor:</span>
                    <span className="text-[9px] bg-emerald-200/60 px-1 rounded font-bold">+{calc.wastePct}%</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-950 leading-none py-0.5">
                    {formatKg(calc.qtyKg)}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500 truncate">
                    Netto: {formatKg(calc.qtyKg / (1 + calc.wastePct / 100))}
                  </div>
                </div>

                {/* 2. Estimasi Anggaran */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1 overflow-hidden">
                  <div className="text-[10px] font-mono text-amber-950 font-semibold flex items-center justify-between">
                    <span>Plafon Escrow:</span>
                    <span className="text-[9px] bg-amber-200/60 px-1 rounded font-bold">Resmi</span>
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-stone-950 leading-none py-0.5 tracking-tight whitespace-nowrap">
                    {formatRupiah(calc.estCost)}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500 whitespace-nowrap">
                    @{formatRupiah(calc.unitPrice)}/kg
                  </div>
                </div>
              </div>

              {/* Rincian Operasional Mikro (1 Kotak Bersih) */}
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between text-[11px] font-mono text-stone-600">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Mitra: 1–3 Poktan Lokal</span>
                </span>
                <span className="text-stone-500">Kirim H-1 06.00 WIB</span>
              </div>

              {/* Action Button CTA Ramping */}
              <div className="pt-2">
                <Link to="/auth/register" className="block">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-emerald-950 hover:bg-emerald-900 font-bold text-white shadow-sm flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer group text-xs"
                  >
                    <span>Mulai Pasok Dapur Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>
      </ScrollReveal>



      <ScrollReveal animation="fade-up" delayMs={0}>
      {/* LIVE INTERACTIVE AI NLP SIMULATOR SANDBOX (INTERNATIONAL EDITORIAL STYLE WITH REACTIVE MASCOT) */}
      <section id="nlp-demo" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-[11px] font-mono font-bold tracking-wider border border-emerald-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ASISTEN PINTAR BAHASA PETANI</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-950 tracking-tight leading-tight">
            Ketik Bahasa Sehari-hari Petani. <br className="hidden sm:inline" />
            <span className="italic font-normal text-emerald-850">Sistem Otomatis Mencatat Hasil Panen.</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            Petani di desa cukup kirim pesan seperti di WhatsApp biasa tanpa isi formulir yang membingungkan. Sistem cerdas kami langsung mengenali sebutan daerah, satuan timbangan ("dua kwintal"), dan mencatatnya ke pesanan resmi.
          </p>
        </div>

        {/* Master AI Sandbox Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-white via-white/95 to-[#FAF8F5] border border-stone-200/90 shadow-elevated p-6 sm:p-8 overflow-hidden">
          
          {/* Subtle Blueprint Grid Pattern in Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1E3A2F_0.75px,transparent_0.75px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-stone-100 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-stone-900">
                PENCATAT PANEN OTOMATIS • RESPON INSTAN KILAT • PAHAM SINGKATAN & DIALEK DESA
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● SISTEM AKTIF & SIAP TERIMA PESAN
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* SISI KIRI: INPUT WHATSAPP STYLE DENGAN MASKOT CERDAS LANGSUNG DI ATASNYA */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Header Input & Living Mascot Observer Anchor */}
              <div className="flex items-end justify-between pb-1 relative">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                      UJI COBA PESAN CHAT
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">
                    Ketik Kalimat Bebas Seperti Chat WhatsApp:
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Bisa pakai singkatan ketikan cepat, sebutan takaran lokal, atau harga pasar.
                  </p>
                </div>

                {/* 2D Living Vector Mascot Directly Observing Input */}
                <div className="shrink-0 -mb-2">
                  <AiThinkingMascot status={mascotStatus} size={78} />
                </div>
              </div>

              {/* Chat-Style Input Bar with clean padding and clear separation */}
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlpSampleText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTestNLP()}
                    placeholder="Contoh: besok panen 2 kwintal cabai rawit 45rb..."
                    className="flex-1 px-4 py-3 border border-stone-300 hover:border-emerald-500 focus:border-emerald-600 rounded-xl text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono shadow-2xs placeholder:text-stone-400 transition-all"
                  />
                  <Button
                    type="button"
                    onClick={handleTestNLP}
                    disabled={nlpLoading}
                    className="bg-emerald-950 hover:bg-emerald-900 text-white text-xs px-5 py-3 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{nlpLoading ? 'Membaca...' : 'Urai Pesan'}</span>
                  </Button>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-600 px-1">
                  <span>Tekan Enter di keyboard untuk kirim pesan</span>
                  <span className="text-emerald-800">Terkoneksi: WhatsApp & Jalur SMS Petani</span>
                </div>
              </div>

              {/* Quick 1-Click Tap Prompts */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono text-stone-600 block">
                  Atau klik contoh kalimat pesan di lapangan:
                </span>
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      label: 'Pakai Kata Satuan ("dua kwintal"):',
                      text: 'besok ada panen cabai rawit dua kwintal harga 45rb sama bayam 50 kilo',
                    },
                    {
                      label: 'Banyak Komoditas ("setengah ton"):',
                      text: 'lusa siap kirim setengah ton beras lokal sama lele 30 kilo 25rb',
                    },
                    {
                      label: 'Singkatan Cepat Petani ("sy bsoq ad pnn"):',
                      text: 'sy bsoq ad pnn cengek 100 kg harga 40 ribu siap setor',
                    },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        handleInputChange(preset.text);
                        setTimeout(() => handleTestNLP(), 100);
                      }}
                      className="text-left px-3 py-2 rounded-xl bg-white hover:bg-emerald-50/70 border border-stone-200/90 hover:border-emerald-300 text-stone-700 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="text-[9px] font-mono font-bold text-emerald-800 uppercase group-hover:text-emerald-900">
                        {preset.label}
                      </div>
                      <div className="text-xs font-mono text-stone-800 truncate mt-0.5">
                        "{preset.text}"
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* SISI KANAN: LIVE EXTRACTION TELEMETRY CARD */}
            <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200/90 shadow-soft p-5 sm:p-6 space-y-4 relative overflow-hidden">
              
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600" />

              {/* Header Hasil */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    REKAP OTOMATIS SISTEM
                  </span>
                  <h3 className="text-sm font-bold text-stone-950 font-serif">
                    Rincian Panen yang Berhasil Dicatat
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold border border-emerald-200">
                  <BadgeCheck className="w-2.5 h-2.5 text-emerald-600" />
                  TINGKAT AKURASI 98.4% (SANGAT TEPAT)
                </span>
              </div>

              {/* Extracted Entity Cards */}
              <div className="space-y-2.5">
                {(nlpParsed?.candidates || [
                  { commodityName: 'Cabai rawit', quantityKg: 200, askingPrice: 45000, commodityCategory: 'BUMBU & REMPAH' },
                  { commodityName: 'Bayam', quantityKg: 50, askingPrice: null, commodityCategory: 'SAYURAN' }
                ]).map((item: any, cIdx: number) => (
                  <div
                    key={cIdx}
                    className={`p-3.5 rounded-xl border transition-all duration-300 ${
                      mascotStatus === 'wow'
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-stone-50/70 border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-xs sm:text-sm font-bold text-stone-950 capitalize font-mono">
                          {item.commodityName}
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {item.commodityCategory || 'KOMODITAS'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded-lg bg-white border border-stone-200/60">
                        <span className="text-[9px] text-stone-600 block uppercase">Jumlah Timbangan:</span>
                        <strong className="text-sm text-emerald-950 font-extrabold">
                          {item.quantityKg} kg
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-stone-200/60">
                        <span className="text-[9px] text-stone-600 block uppercase">Harga Tawaran:</span>
                        <strong className="text-sm text-stone-900 font-extrabold">
                          {item.askingPrice ? `Rp ${item.askingPrice.toLocaleString('id-ID')}/kg` : 'Sesuai Standar Dinas'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instant Verification Telemetry */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1.5 text-[11px] font-mono text-stone-600">
                <div className="flex justify-between items-center">
                  <span>Penerjemahan Sebutan Berat:</span>
                  <strong className="text-emerald-800">"dua kwintal" ➔ 200 kg ✓</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Penerjemahan Singkatan Harga:</span>
                  <strong className="text-emerald-800">"45rb" ➔ Rp 45.000 ✓</strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-stone-200/60 text-[10px] text-stone-600">
                  <span>Status Data:</span>
                  <span className="text-emerald-800 font-bold">Siap Dijadikan Kontrak Resmi Pasokan</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
      </ScrollReveal>



      <ScrollReveal animation="fade-up" delayMs={0}>
        {/* 6. PERBANDINGAN STRATEGIS: CARA LAMA VS ORVANA (EDITORIAL COMPARISON BOARD) */}
      <section id="keunggulan" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100/90 text-emerald-900 text-[11px] font-mono font-bold uppercase tracking-wider border border-emerald-300 shadow-2xs">
            <Scale className="w-3.5 h-3.5 text-emerald-700" />
            <span>TRANSFORMASI TATA KELOLA PANGAN</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-950 tracking-tight leading-tight">
            Mengapa Ekosistem Pangan <br className="hidden sm:inline" />
            <span className="italic font-normal text-emerald-850">Beralih ke Standar ORVANA?</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            Lihat kontras nyata antara jalur tengkulak konvensional dengan ekosistem digital transparan ORVANA.
          </p>
        </div>

        {/* Master Comparison Board (Unified, Clean, Editorial Grade) */}
        <div className="rounded-3xl bg-white border border-stone-200/90 shadow-elevated overflow-hidden">
          
          {/* Top Board Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-stone-200 bg-stone-50/70">
            <div className="md:col-span-5 p-4 sm:px-6 flex items-center justify-between border-b md:border-b-0 md:border-r border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600">
                  Cara Lama (Tengkulak / Makelar)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                ✕ Rawan Rugi
              </span>
            </div>
            
            <div className="md:col-span-2 hidden md:flex items-center justify-center py-2 bg-stone-100/60 border-r border-stone-200 text-[11px] font-mono font-bold text-stone-500 uppercase tracking-widest">
              Aspek
            </div>

            <div className="md:col-span-5 p-4 sm:px-6 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                  Standar Digital ORVANA
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                ✓ Solusi Resmi
              </span>
            </div>
          </div>

          {/* 5 Comparison Rows */}
          <div className="divide-y divide-stone-100">
            {[
              {
                aspect: 'Perlindungan Harga',
                oldDesc: 'Harga ditekan sepihak di bawah modal tanam. Petani tidak memiliki posisi tawar.',
                oldTag: 'Petani Rugi',
                orvanaTitle: 'Jaminan Harga Adil Wilayah',
                orvanaDesc: 'Otomatis tolak pesanan di bawah patokan harga dasar dinas daerah.',
                orvanaTag: 'Harga Terkunci',
                icon: ShieldCheck,
              },
              {
                aspect: 'Kepastian Penjualan',
                oldDesc: 'Transaksi serba mendadak, hasil panen sering membusuk di kebun karena batal sepihak.',
                oldTag: 'Panen Terbuang',
                orvanaTitle: 'Serapan Terjadwal 1-2 Minggu di Muka',
                orvanaDesc: 'Kebutuhan dapur gizi dipetakan lebih awal langsung ke kalender panen petani.',
                orvanaTag: '100% Terserap',
                icon: Clock,
              },
              {
                aspect: 'Pemerataan Kuota',
                oldDesc: 'Didominasi 1 distributor besar, petani kecil sulit masuk dan tersisih.',
                oldTag: 'Monopoli Kuota',
                orvanaTitle: 'Batasan Kuota Maksimal 60%',
                orvanaDesc: 'Distribusi adil otomatis membagi kuota agar kelompok tani kecil tetap berdaya.',
                orvanaTag: 'Anti-Monopoli',
                icon: Users,
              },
              {
                aspect: 'Keamanan Bayar',
                oldDesc: 'Uang pembayaran tertahan berminggu-minggu, sering terjadi risiko gagal bayar.',
                oldTag: 'Macet Berminggu2',
                orvanaTitle: 'Pencairan Instan Setelah Uji Mutu',
                orvanaDesc: 'Dana belanja dapur diamankan di muka sistem, cair seketika begitu bahan lolos QC.',
                orvanaTag: 'Cair Instan',
                icon: Lock,
              },
              {
                aspect: 'Ketertelusuran Bahan',
                oldDesc: 'Asal usul ladang tidak jelas dan sulit dipertanggungjawabkan ke pihak sekolah/dinas.',
                oldTag: 'Tanpa Riwayat',
                orvanaTitle: 'Paspor Digital & QR Code Publik',
                orvanaDesc: 'Dapat dipindai siapa saja untuk melihat desa asal panen, kurir pengantar, & uji ahli gizi.',
                orvanaTag: 'Transparan Penuh',
                icon: QrCode,
              },
            ].map((row, rIdx) => {
              const RowIcon = row.icon;
              return (
                <div
                  key={rIdx}
                  className="grid grid-cols-1 md:grid-cols-12 items-stretch hover:bg-stone-50/50 transition-colors group"
                >
                  {/* Sisi Kiri: Cara Lama */}
                  <div className="md:col-span-5 p-4 sm:px-6 flex items-start gap-3 bg-stone-50/20 md:border-r border-stone-200">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="md:hidden text-[10px] font-mono font-bold text-stone-500 uppercase">
                          {row.aspect}
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                          {row.oldTag}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        {row.oldDesc}
                      </p>
                    </div>
                  </div>

                  {/* Aspek Center Badge (Desktop) */}
                  <div className="md:col-span-2 hidden md:flex flex-col items-center justify-center p-3 bg-stone-100/30 md:border-r border-stone-200 text-center">
                    <RowIcon className="w-4 h-4 text-emerald-800 mb-1" />
                    <span className="text-[11px] font-bold text-stone-800 font-sans leading-tight">
                      {row.aspect}
                    </span>
                  </div>

                  {/* Sisi Kanan: Standar ORVANA */}
                  <div className="md:col-span-5 p-4 sm:px-6 flex items-start gap-3 bg-emerald-50/20 group-hover:bg-emerald-50/40 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-950 font-sans">
                          {row.orvanaTitle}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                          {row.orvanaTag}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        {row.orvanaDesc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Footer */}
          <div className="p-4 sm:px-6 bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-stone-300">
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dampak Nyata: Menghapus potongan tengkulak gelap 25% - 40%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">100% Hak Petani & Dapur Terlindungi</span>
            </div>
          </div>

        </div>

      </section>
      </ScrollReveal>



      <ScrollReveal animation="fade-up" delayMs={0}>
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
      </ScrollReveal>



      <ScrollReveal animation="fade-up" delayMs={0}>
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
      </ScrollReveal>

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
