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
  Activity,
  QrCode,
  Check,
  ChevronDown,
  ArrowUpRight,
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

  // Interactive FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

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

  // Kalkulasi estimasi real-time rumus docs/04 bagian 2
  const getCalcResults = () => {
    switch (calcCommodity) {
      case 'bayam': {
        // R1: 0.06 kg/porsi, 15% waste
        const raw = calcPortions * 0.06 * 1.15;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 8000;
        return { name: 'Bayam Segar (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 8000, wastePct: 15 };
      }
      case 'lele': {
        // R1: 0.07 kg/porsi, 10% waste
        const raw = calcPortions * 0.07 * 1.10;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 30000;
        return { name: 'Ikan Lele Segar (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 30000, wastePct: 10 };
      }
      case 'beras': {
        // R1-R5: 0.08 kg/porsi, 2% waste
        const raw = calcPortions * 0.08 * 1.02;
        const rounded = Math.ceil(raw * 10) / 10;
        const cost = rounded * 14000;
        return { name: 'Beras Lokal (Resep R1)', qtyKg: rounded, estCost: cost, unitPrice: 14000, wastePct: 2 };
      }
      case 'telur': {
        // R2: 0.06 kg/porsi, 3% waste
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
      a: 'Marketplace biasa berbasis transaksi bebas sewaktu-waktu. ORVANA adalah sistem terencana: mencocokkan jadwal menu kebutuhan dapur gizi massal 1–2 minggu sebelumnya dengan kalender panen petani lokal, dilengkapi batasan alokasi anti monopoli (cap 60%), jaminan harga dasar dinas, dan audit mutu bertingkat.',
    },
    {
      q: 'Bagaimana petani terjamin menerima pembayaran tepat waktu?',
      a: 'Sistem buku besar digital ORVANA menggunakan prinsip Escrow (rekening penampung aman): begitu petani menyanggupi order, dana langsung dicadangkan [HOLD]. Setelah pengawas mutu menyatakan lolos [PASS], dana otomatis dicairkan [RELEASE] langsung ke saldo petani.',
    },
    {
      q: 'Bagaimana peran koordinator dan pengawas mutu memastikan standar gizi anak sekolah?',
      a: 'Koordinator menjemput dan mengonsolidasi panen dari petani dengan radius pendek (< 25 km) untuk mencegah penurunan susut bobot. Pengawas mutu independen memeriksa fisik, kesegaran, dan kebersihan dengan standar checklist 100 poin sebelum makanan dimasak.',
    },
    {
      q: 'Apakah masyarakat umum dan orang tua murid bisa melacak asal makanan?',
      a: 'Ya. Setiap batch makanan yang disajikan memiliki kode batch unik dan QR code yang dapat dipindai secara publik tanpa perlu login. Menampilkan peta desa produsen, tanggal panen, hasil QC, dan sertifikat penelusuran resmi.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface selection:bg-brand/20 selection:text-brand relative overflow-x-hidden">
      {/* Top Banner Akuntabilitas */}
      <div className="bg-pine-950 text-white text-[11px] font-mono py-2 px-4 border-b border-pine-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-semibold">Sistem Produksi Aktif</span>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-gray-300">Protokol Transparansi Rantai Pasok Pangan Dapur Gizi Massal</span>
          </div>
          <Link
            to="/trace/ORV-20260920-DPR01-0001"
            className="text-harvest-amber hover:text-amber-300 underline flex items-center gap-1 font-semibold"
          >
            <span>Verifikasi Contoh Batch #ORV-20260920-DPR01-0001</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Header Sticky Glassmorphism */}
      <header className="bg-white/90 backdrop-blur-md border-b border-surface-border sticky top-0 z-40 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl text-pine-950 tracking-tight leading-none group-hover:text-emerald-800 transition-colors">
                ORVANA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-semibold mt-1">
                Rantai Pasok Gizi Massal
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-700">
            <a href="#dampak" className="hover:text-pine-900 transition-colors">
              Buku Besar & Dampak
            </a>
            <a href="#arsitektur" className="hover:text-pine-900 transition-colors">
              Nilai Tambah
            </a>
            <a href="#kalkulator" className="hover:text-pine-900 transition-colors">
              Simulasi Kebutuhan
            </a>
            <a href="#cara-kerja" className="hover:text-pine-900 transition-colors">
              Alur 4 Peran
            </a>
            <a href="#faq" className="hover:text-pine-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to="/trace/ORV-20260920-DPR01-0001">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-2 rounded-DEFAULT border border-emerald-200/80 transition-colors">
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cek Batch</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-surface-border hidden sm:block" />
            <Link to="/login">
              <Button variant="outline" size="sm" className="font-semibold text-xs sm:text-sm">
                Masuk Sistem
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="font-semibold text-xs sm:text-sm shadow-sm">
                Daftar Mitra
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION DENGAN FOTOGRAFI HD PANEN PETANI LOKAL & SIMULASI INTERAKTIF */}
      <section className="relative z-10 overflow-hidden border-b border-surface-border">
        {/* Latar Belakang Foto Panen HD dengan Lapisan Vignette & Warm Parchment */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=2000&q=80"
            alt="Lahan Pertanian Pangan Lokal"
            className="w-full h-full object-cover object-center opacity-[0.09] filter saturate-50"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/90 to-surface" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Teks Kiri */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/95 border border-emerald-300 text-xs font-semibold text-emerald-950 shadow-xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Rantai Pasok Gizi Generasi Emas • Petani & Dapur Mandiri</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-pine-950 tracking-tight leading-[1.12]">
                Mencocokkan Menu Dapur dengan <br className="hidden sm:inline" />
                <span className="text-brand underline decoration-harvest-gold/60 decoration-wavy decoration-3">
                  Panen Petani Lokal
                </span>
              </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl">
              Platform agritech terintegrasi yang menjembatani dapur gizi massal sekolah dengan produsen lokal: alokasi cerdas multi-kriteria, proteksi harga dasar, penjaminan dana escrow, dan passport digital bahan makanan anak bangsa.
            </p>

            {/* Kotak Pencarian Batch Interaktif & Coba Fitur NLP */}
            <div className="pt-2 max-w-xl space-y-3">
              <div className="p-2 bg-white rounded-2xl shadow-card border-2 border-brand/20 hover:border-brand/40 focus-within:border-brand transition-all">
                <form onSubmit={handleTraceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full">
                    <Search className="w-4 h-4 text-emerald-800 shrink-0" />
                    <input
                      type="text"
                      placeholder="Masukkan kode batch: misal ORV-20260920-DPR01-0001"
                      value={batchCodeInput}
                      onChange={(e) => setBatchCodeInput(e.target.value)}
                      className="w-full text-xs sm:text-sm text-gray-950 placeholder-gray-400 focus:outline-none font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto shrink-0 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Lacak Batch</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-gray-500">Contoh batch publik:</span>
                  <Link
                    to="/trace/ORV-20260920-DPR01-0001"
                    className="text-[11px] font-mono font-semibold text-brand underline hover:text-emerald-700 transition-colors"
                  >
                    ORV-20260920-DPR01-0001
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-pine-900 bg-emerald-50/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-brand" />
                  <span>Didukung AI NLP & Escrow Otomatis</span>
                </div>
              </div>
            </div>

            {/* Trust Highlights */}
            <div className="pt-3 flex flex-wrap gap-4 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-status-success font-bold" />
                <span>Anti Monopoli (Batas Cap 60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-status-success font-bold" />
                <span>Pencadangan Dana Escrow Otomatis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-status-success font-bold" />
                <span>Passport Mutu QR Terbuka</span>
              </div>
            </div>
          </div>

          {/* Kolom Visual Kanan: 3D Perspective Card (Ultra-smooth 90fps GPU transform) */}
          <div className="lg:col-span-5 perspective-1000 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl border-2 border-brand/20 p-6 shadow-elevated transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-brand/40 group relative">
              {/* Floating Badge Header */}
              <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono font-bold tracking-tight text-pine-950 uppercase">
                    Live Matching Engine
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-harvest-soft text-harvest-amber px-2 py-0.5 rounded font-bold border border-harvest-200">
                  Algoritma Aktif
                </span>
              </div>

              {/* Simulasi Card Matching Real-Time */}
              <div className="space-y-3.5 text-left">
                {/* Permintaan Dapur */}
                <div className="p-3 bg-surface-muted/60 rounded-xl border border-surface-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand" />
                      Dapur Gizi Demo A (DPR01)
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">1.000 Porsi</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-pine-950 font-serif">Kebutuhan: Bayam Hijau</span>
                    <span className="text-sm font-mono font-extrabold text-brand bg-emerald-100/60 px-2 py-0.5 rounded">
                      69,0 kg
                    </span>
                  </div>
                </div>

                {/* Sinyal Alokasi Multi-Pemasok */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>Hasil Pencocokan Cerdas:</span>
                    <span>Batas Maks 60% (41,4 kg)</span>
                  </div>

                  {/* Kandidat S1 */}
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/90 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-heading font-bold text-pine-950 flex items-center gap-1">
                        <span>Tani Makmur (S1)</span>
                        <Badge color="success">Skor 88,97</Badge>
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                        Jarak 6 km • Mutu 88 • Panen H-1
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-emerald-950 block">40,0 kg</span>
                      <span className="text-[10px] text-emerald-800 font-medium">Rp 320.000</span>
                    </div>
                  </div>

                  {/* Kandidat S2 */}
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/90 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-heading font-bold text-pine-950 flex items-center gap-1">
                        <span>Kelompok Tani Sari (S2)</span>
                        <Badge color="accent">Skor 83,60</Badge>
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                        Jarak 14 km • Mutu 80 • Panen Hari-H
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-pine-950 block">29,0 kg</span>
                      <span className="text-[10px] text-amber-800 font-medium">Rp 217.500</span>
                    </div>
                  </div>
                </div>

                {/* Status Bar Transparansi Ledger */}
                <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Pencadangan Dana Otomatis:
                  </span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Rp 537.500 [HOLD]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* SECTION BUKU BESAR DAERAH & DAMPAK NYATA */}
      <section id="dampak" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-surface-border pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-pine-900 mb-1">
                <Sparkles className="w-4 h-4 text-harvest-gold" />
                <span>Buku Besar Terbuka & Agregasi Dampak</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pine-950">
                Transparansi Real-Time Ekonomi Lokal
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Data agregat langsung dari catatan transaksi append-only yang telah dituntaskan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="accent">Audit Publik Terverifikasi</Badge>
              <Link to="/auditor/dashboard">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-800">
                  <span>Portal Auditor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            {/* 1. Belanja Lokal */}
            <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors">
              <span className="text-xs text-emerald-800 flex items-center gap-1 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                Perputaran Belanja Lokal
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-20" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </p>
              <span className="text-[10px] text-emerald-800/80 block mt-1">100% langsung diserap petani daerah</span>
            </div>

            {/* 2. Produsen Terlibat */}
            <div className="p-4 sm:p-5 bg-blue-50/50 rounded-2xl border border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-xs text-blue-800 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Mitra Produsen Terlibat
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-2">
                {isLoading ? <Skeleton className="h-7 w-12" /> : `${impact?.producersInvolved || 0} Produsen`}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">Kelompok tani, peternak & UMKM</span>
            </div>

            {/* 3. Pangan Terserap */}
            <div className="p-4 sm:p-5 bg-amber-50/50 rounded-2xl border border-amber-100 hover:border-amber-300 transition-colors">
              <span className="text-xs text-amber-800 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                Total Pangan Terserap
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-pine-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-16" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </p>
              <span className="text-[10px] text-amber-900/70 block mt-1">Bahan segar bergizi tersalurkan</span>
            </div>

            {/* 4. Kelulusan Mutu */}
            <div className="p-4 sm:p-5 bg-purple-50/50 rounded-2xl border border-purple-100 hover:border-purple-300 transition-colors">
              <span className="text-xs text-purple-800 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                Tingkat Lolos Mutu QC
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-purple-950 mt-2">
                {isLoading ? <Skeleton className="h-7 w-14" /> : `${impact?.qualityPassRatePct || 0}%`}
              </p>
              <span className="text-[10px] text-purple-900/70 block mt-1">Standar inspeksi ahli gizi</span>
            </div>

            {/* 5. Jarak Tempuh */}
            <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200 col-span-2 md:col-span-1">
              <span className="text-xs text-gray-700 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-earth-terracotta" />
                Rata-rata Radius Jarak
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-earth-terracotta mt-2">
                {isLoading ? <Skeleton className="h-7 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">Rute pendek, emisi karbon rendah</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION TABEL PERBANDINGAN: ORVANA VS KONVENSIONAL */}
      <section id="arsitektur" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Perbandingan Nyata
          </span>
          <h2 className="font-serif text-3xl font-bold text-pine-950 mt-3">
            Mengapa Ekosistem Pangan Memilih ORVANA?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Perbedaan fundamental antara rantai pasok konvensional perantara dengan arsitektur digital ORVANA.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-surface-border overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/60">
                  <th className="py-4 px-6 font-heading font-bold text-gray-700 w-1/3">Aspek Pengadaan</th>
                  <th className="py-4 px-6 font-heading font-bold text-rose-800 bg-rose-50/50 w-1/3">
                    Pengadaan Konvensional (Tengkulak)
                  </th>
                  <th className="py-4 px-6 font-heading font-bold text-emerald-950 bg-emerald-50/70 w-1/3">
                    ORVANA Digital Rantai Pasok
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Perlindungan Harga Petani</td>
                  <td className="py-4 px-6 text-gray-600 bg-rose-50/20">
                    Harga ditekan sepihak, sering di bawah biaya produksi.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/30 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Otomatis tolak tawaran di bawah harga dasar wilayah.</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Kepastian Serapan Panen</td>
                  <td className="py-4 px-6 text-gray-600 bg-rose-50/20">
                    Transaksi mendadak, risiko panen membusuk di kebun tinggi.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/30">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Terencana 1-2 minggu lebih awal dari menu dapur.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Pencegahan Monopoli Kuota</td>
                  <td className="py-4 px-6 text-gray-600 bg-rose-50/20">
                    Didominasi 1 distributor besar, petani kecil terpinggirkan.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/30">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Algoritma Greedy membatasi kuota maks 60% per petani.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Jaminan Keamanan Pembayaran</td>
                  <td className="py-4 px-6 text-gray-600 bg-rose-50/20">
                    Pembayaran mundur berminggu-minggu bahkan gagal bayar.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/30">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Dana [HOLD] di awal, langsung [RELEASE] begitu QC lolos.</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Ketertelusuran Asal Pangan</td>
                  <td className="py-4 px-6 text-gray-600 bg-rose-50/20">
                    Asal muasal bahan tidak jelas, sulit dipertanggungjawabkan.
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-950 bg-emerald-50/30">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>QR Code publik menampilkan riwayat desa, supir, & QC.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION KALKULATOR KEBUTUHAN DAPUR INTERAKTIF */}
      <section id="kalkulator" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-brand text-white rounded-3xl p-6 sm:p-12 shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sisi Kontrol Form */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-harvest-gold bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block mb-3">
                  Simulasi Kalkulator Kebutuhan Riil
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
                  Hitung Kebutuhan Bahan Sesuai Porsi Anak Sekolah
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
                  Gunakan simulator di bawah untuk melihat bagaimana rumus matematis ORVANA menghitung kebutuhan bahan kotor (+persen susut masak) dan estimasi anggaran perlindungan petani.
                </p>
              </div>

              {/* Slider & Pemilihan Komoditas */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-emerald-200">Jumlah Porsi Penerima Manfaat:</span>
                    <span className="font-extrabold text-base text-harvest-gold">{calcPortions.toLocaleString('id-ID')} Porsi Anak</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={calcPortions}
                    onChange={(e) => setCalcPortions(parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-harvest-gold"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-emerald-300 mt-1">
                    <span>100 porsi</span>
                    <span>1.000 porsi</span>
                    <span>2.500 porsi</span>
                    <span>5.000 porsi</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-200 block mb-2">
                    Pilih Bahan Pokok Resep:
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
                            ? 'bg-harvest-gold text-pine-950 border-harvest-gold font-bold shadow-sm'
                            : 'bg-white/10 text-white border-white/15 hover:bg-white/15 text-gray-200'
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

            {/* Sisi Hasil Kalkulasi */}
            <div className="lg:col-span-5 bg-white text-gray-950 rounded-2xl p-6 shadow-2xl border-2 border-harvest-gold/40 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-mono font-bold text-gray-500 uppercase">
                  Hasil Formula Demand Planner
                </span>
                <Badge color="success">Rumus Baku Resmi</Badge>
              </div>

              <div>
                <p className="text-xs text-gray-500">Komoditas Terpilih:</p>
                <p className="font-heading font-extrabold text-lg text-pine-950">{calc.name}</p>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-gray-600">Total Kebutuhan Kotor (+Susut {calc.wastePct}%):</span>
                  <span className="font-mono text-xl font-bold text-emerald-900">{formatKg(calc.qtyKg)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs border-t border-emerald-200/60 pt-2">
                  <span className="text-gray-600">Estimasi Anggaran Acuan Dinas:</span>
                  <span className="font-mono text-xl font-bold text-emerald-950">{formatRupiah(calc.estCost)}</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-gray-500 space-y-1">
                <p>• Harga Dasar Acuan: {formatRupiah(calc.unitPrice)} / kg</p>
                <p>• Dibulatkan ke atas kelipatan 0,1 kg sesuai aturan dinas</p>
                <p>• Langsung siap dialokasikan otomatis ke multi-petani lokal</p>
              </div>

              <Link to="/register" className="block pt-2">
                <Button variant="harvest" size="md" className="w-full font-bold text-white shadow-sm flex items-center justify-center gap-2">
                  <span>Mulai Pasok Dapur Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ALUR KERJA 4 PERAN INTERAKTIF */}
      <section id="cara-kerja" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface-muted/60 rounded-3xl border border-surface-border p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Alur Terpadu Multi-Peran
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pine-950 mt-3">
              Bagaimana Alur Kerja 4 Peran Lapangan?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Pilih peran pengguna di bawah untuk melihat simulasi interface dan tanggung jawab masing-masing
            </p>

            {/* Role Switcher Tabs */}
            <div className="inline-flex p-1.5 bg-white rounded-xl border border-surface-border shadow-xs mt-6 gap-1">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Role Card Content */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-surface-border p-6 sm:p-8 shadow-card">
            {activeTabRole === 'kitchen' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3 text-left">
                  <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider">
                    Langkah 1: Perencanaan Menu & Kebutuhan
                  </span>
                  <h3 className="font-serif text-xl font-bold text-pine-950">
                    Dapur Menyusun Menu Mingguan
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Pengelola dapur memasukkan rencana menu (mis. Resep R1 untuk 1.000 porsi). Algoritma ORVANA otomatis menghitung kebutuhan bahan bersih + estimasi susut standar (contoh bayam 69 kg, lele 77 kg).
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                      Otomatisasi Kebutuhan Resep Baku R1–R5
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="relative h-28 rounded-xl overflow-hidden shadow-xs border border-surface-border">
                    <img
                      src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"
                      alt="Dapur Gizi Higienis"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-mono font-semibold text-white">Dapur Gizi Massal Bersertifikat</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-muted/70 rounded-xl border border-surface-border space-y-1.5 text-xs font-mono text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Menu R1 (1.000 Anak):</span>
                      <span className="font-bold text-pine-950">69,0 kg Bayam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Batas Harga:</span>
                      <span className="text-emerald-700 font-bold">Rp 10.000 / kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'farmer' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3 text-left">
                  <span className="text-xs font-mono font-bold text-harvest-amber uppercase tracking-wider">
                    Langkah 2: Kepastian Pasar & Alokasi Kuota
                  </span>
                  <h3 className="font-serif text-xl font-bold text-pine-950">
                    Petani Menerima Notifikasi Tawaran Pasti
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Petani menerima pesanan teralokasi langsung di HP mereka. Begitu disanggupi, dana pesanan langsung dicadangkan [HOLD] di rekening penampung sehingga petani tidak khawatir tidak dibayar.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                      Batas Waktu Jawab 12 Jam & Alokasi Cadangan
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="relative h-28 rounded-xl overflow-hidden shadow-xs border border-surface-border">
                    <img
                      src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
                      alt="Petani Sayur Lokal Memanen"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-mono font-semibold text-white">Petani Mitra Lokal Terdaftar</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-muted/70 rounded-xl border border-surface-border space-y-1.5 text-xs font-mono text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tawaran S1:</span>
                      <span className="text-brand font-bold">40,0 kg (@ Rp 8.000)</span>
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
                <div className="md:col-span-7 space-y-3 text-left">
                  <span className="text-xs font-mono font-bold text-blue-800 uppercase tracking-wider">
                    Langkah 3: Konsolidasi & Distribusi
                  </span>
                  <h3 className="font-serif text-xl font-bold text-pine-950">
                    Penjemputan Bahan & Pembuatan Batch
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Koordinator pengepul mengambil hasil panen dari beberapa titik desa, mengelompokkannya ke satu pengiriman armada, dan sistem menghasilkan kode batch unik ketertelusuran pangan.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block">
                      Pembuatan Kode Batch & Penimbangan Susut
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="relative h-28 rounded-xl overflow-hidden shadow-xs border border-surface-border">
                    <img
                      src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
                      alt="Logistik Konsolidasi Armada Pangan"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-mono font-semibold text-white">Konsolidasi Rute Pendek (&lt; 25 km)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-muted/70 rounded-xl border border-surface-border space-y-1.5 text-xs font-mono text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kode Batch:</span>
                      <span className="text-blue-800 font-bold">ORV-20261014-DPR01-0001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Muatan Konsolidasi:</span>
                      <span className="font-bold">69,0 kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'inspector' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3 text-left">
                  <span className="text-xs font-mono font-bold text-purple-800 uppercase tracking-wider">
                    Langkah 4: Pemeriksaan Mutu & Pembayaran
                  </span>
                  <h3 className="font-serif text-xl font-bold text-pine-950">
                    Inspeksi Checklist Mutu & Pencairan Dana
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Pengawas mutu memeriksa kesegaran, kebersihan, dan kondisi fisik bahan. Hasil QC yang lolos otomatis mencairkan dana [RELEASE] ke saldo petani tanpa menunggu berhari-hari.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 inline-block">
                      Hasil: PASS, PARTIAL, atau FAIL Transparan
                    </span>
                  </div>
                </div>
                <div className="md:col-span-5 space-y-3">
                  <div className="relative h-28 rounded-xl overflow-hidden shadow-xs border border-surface-border">
                    <img
                      src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
                      alt="Pemeriksaan Mutu dan Keamanan Pangan"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-mono font-semibold text-white">Inspeksi Standar Ahli Gizi</span>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-muted/70 rounded-xl border border-surface-border space-y-1.5 text-xs font-mono text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Skor Mutu QC:</span>
                      <span className="text-emerald-700 font-bold">90 / 100 [PASS]</span>
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

      {/* SECTION FAQ (PERTANYAAN UMUM) */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Pertanyaan Umum
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pine-950 mt-3">
            Klarifikasi Sistem & Operasional
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-surface-border overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm text-pine-950 hover:bg-surface-muted/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-800 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-surface-border/50 text-left">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CALL TO ACTION DENGAN SENTUHAN BRAND ARTISAN AGRITECH */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-brand text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-elevated">
          <div className="relative z-10 max-w-2xl text-left space-y-4">
            <Badge color="accent">Gerakan Pangan Bergizi Nasional</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Wujudkan Rantai Pasok Pangan Mandiri, Berkeadilan, dan Bermutu
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Daftarkan dapur gizi massal, kelompok tani, atau koperasi distribusi Anda ke dalam jaringan digital ORVANA sekarang.
            </p>
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button
                  variant="harvest"
                  size="md"
                  className="font-bold text-white shadow-sm flex items-center gap-2"
                >
                  <span>Daftar Akun Mitra Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold"
                >
                  <span>Masuk ke Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER BERSIH & FORMAL */}
      <footer className="border-t border-surface-border bg-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <Logo size="sm" withText textSubtitle="Enterprise Agritech" />
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-gray-500">
              &copy; 2026 ORVANA. Rantai Pasok Pangan Lokal Dapur Gizi Massal.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link to="/trace/ORV-20260920-DPR01-0001" className="hover:text-brand transition-colors">
              Pemeriksaan Batch Publik
            </Link>
            <Link to="/login" className="hover:text-brand transition-colors">
              Portal Pengelola & Petani
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand transition-colors"
            >
              Dokumentasi API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
