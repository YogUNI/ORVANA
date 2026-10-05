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
  Sprout,
  ShieldCheck,
  Truck,
  Scale,
  Search,
  Users,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  MapPin,
  Sparkles,
  Award,
  ChevronRight,
  Building2,
  Leaf,
  Activity,
  QrCode,
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

  const { data: summaryResponse, isLoading } = useQuery<{ data: PublicImpactSummary }>({
    queryKey: ['public-impact-summary'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PublicImpactSummary }>('/public/impact-summary');
      return res.data;
    },
  });

  const impact = summaryResponse?.data;

  const handleTraceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchCodeInput.trim()) {
      window.location.href = `/trace/${encodeURIComponent(batchCodeInput.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-brand/20 selection:text-brand relative overflow-x-hidden">

      {/* Header Sticky Glassmorphism */}
      <header className="bg-white/85 backdrop-blur-md border-b border-surface-border sticky top-0 z-40 transition-all">
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

          {/* Quick Nav & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#cara-kerja"
              className="hidden md:inline-block text-xs font-semibold text-gray-700 hover:text-pine-900 transition-colors px-3 py-1.5"
            >
              Cara Kerja
            </a>
            <a
              href="#dampak"
              className="hidden md:inline-block text-xs font-semibold text-gray-700 hover:text-pine-900 transition-colors px-3 py-1.5"
            >
              Buku Besar & Dampak
            </a>
            <Link to="/trace/ORV-20260920-DPR01-0001">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-2 rounded-DEFAULT border border-emerald-200/80 transition-colors">
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cek Batch</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-surface-border hidden sm:block" />
            <Link to="/login">
              <Button variant="outline" size="sm" className="font-medium text-xs sm:text-sm">
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

      {/* HERO SECTION DENGAN 3D PERSPECTIVE CARD */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Kolom Teks Kiri */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-xs font-semibold text-emerald-900 shadow-2xs backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kedaulatan Pangan Generasi Emas • Dapur Gizi Massal</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-pine-950 tracking-tight leading-[1.12]">
              Mencocokkan Menu Dapur dengan <br className="hidden sm:inline" />
              <span className="relative inline-block text-brand underline decoration-harvest-gold/60 decoration-wavy decoration-3">
                Panen Petani Lokal
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl">
              Platform agritech terpadu yang menghubungkan rencana menu dapur gizi anak sekolah dengan panen petani dan nelayan lokal: alokasi cerdas multi-kriteria, perlindungan harga dasar, audit mutu bertingkat, dan pembukuan transparan.
            </p>

            {/* Kotak Pencarian Batch Interaktif */}
            <div className="pt-2 max-w-xl">
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
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-[11px] font-mono text-gray-500">Contoh siap lacak:</span>
                <Link
                  to="/trace/ORV-20260920-DPR01-0001"
                  className="text-[11px] font-mono font-semibold text-brand underline hover:text-emerald-700 transition-colors"
                >
                  ORV-20260920-DPR01-0001
                </Link>
              </div>
            </div>

            {/* Micro Highlights Pill */}
            <div className="pt-3 flex flex-wrap gap-4 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>Anti Tengkulak & Monopoli (Batas Cap 60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>Dana Terjamin di Rekening Bersama</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>Passport Mutu Digital QR Code</span>
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
      </section>

      {/* LIVE IMPACT SUMMARY / BUKU BESAR TERBUKA */}
      <section id="dampak" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-surface-border p-6 sm:p-8 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-surface-border pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-pine-900 mb-1">
                <Sparkles className="w-4 h-4 text-harvest-gold" />
                <span>Indikator Dampak & Akuntabilitas Publik</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-pine-950">
                Data Agregat Transaksi Buku Besar Daerah
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Angka riil dari perputaran bahan pangan segar, perlindungan petani, dan serapan gizi dapur
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="accent">Buku Besar Append-Only</Badge>
              <Link to="/auditor/dashboard">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-800">
                  <span>Portal Auditor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* 1. Belanja Lokal */}
            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors">
              <span className="text-xs text-emerald-800 flex items-center gap-1 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                Perputaran Belanja Lokal
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-950 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-20" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </p>
              <span className="text-[10px] text-emerald-800/80 block mt-1">100% langsung ke produsen daerah</span>
            </div>

            {/* 2. Produsen Terlibat */}
            <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-xs text-blue-800 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Mitra Produsen Terlibat
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-12" /> : `${impact?.producersInvolved || 0} Produsen`}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">Kelompok tani, nelayan & UMKM binaan</span>
            </div>

            {/* 3. Pangan Terserap */}
            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 hover:border-amber-300 transition-colors">
              <span className="text-xs text-amber-800 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                Total Pangan Terserap
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-pine-950 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-16" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </p>
              <span className="text-[10px] text-amber-900/70 block mt-1">Bahan makanan segar tersalurkan</span>
            </div>

            {/* 4. Kelulusan Mutu */}
            <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors">
              <span className="text-xs text-purple-800 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                Tingkat Lolos Mutu QC
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-purple-950 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-14" /> : `${impact?.qualityPassRatePct || 0}%`}
              </p>
              <span className="text-[10px] text-purple-900/70 block mt-1">Standar inspeksi ahli gizi</span>
            </div>

            {/* 5. Jarak Tempuh */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 col-span-2 md:col-span-1">
              <span className="text-xs text-gray-700 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-earth-terracotta" />
                Rata-rata Radius Jarak
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-earth-terracotta mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">Emisi rendah & bahan lebih segar</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 PILAR UTAMA ORVANA */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-muted border border-surface-border text-xs font-mono text-gray-600 mb-2">
            <span>Arsitektur Rantai Pasok Berkelanjutan</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-pine-950">
            Prinsip Ekosistem Pangan Berkeadilan
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Mengapa dapur gizi massal dan kelompok tani membutuhkan ORVANA dibanding sistem konvensional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pilar 1 */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 flex flex-col justify-between hover:shadow-card transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 border border-emerald-200 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-pine-950">
                Pencocokan Cerdas & Adil
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Algoritma multi-kriteria mencocokkan jarak, skor mutu, kesegaran panen, dan keandalan dengan batas kuota 60% per pemasok guna pemerataan ekonomi desa.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-brand">
              <span>Greedy allocation anti monopoli</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pilar 2 */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 flex flex-col justify-between hover:shadow-card transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-harvest-amber flex items-center justify-center mb-5 border border-amber-200 group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-pine-950">
                Proteksi Harga Dasar
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Mencegah predatory pricing dengan sistem penolakan otomatis jika harga tawaran di bawah floor price dinas. Dilengkapi escrow pencadangan dana otomatis.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-harvest-amber">
              <span>Batas perlindungan petani</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pilar 3 */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 flex flex-col justify-between hover:shadow-card transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-5 border border-blue-200 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-pine-950">
                Logistik Agregat Pendek
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Koordinator lokal mengonsolidasi pesanan beberapa petani dalam satu rute penjemputan efisien, memangkas susut bobot dan emisi karbon perjalanan.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-blue-800">
              <span>Radius &lt; 25 km dari dapur</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pilar 4 */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 flex flex-col justify-between hover:shadow-card transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-5 border border-purple-200 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-pine-950">
                Mutu & Passport QR
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Pemeriksaan ketat oleh pengawas mutu dengan bobot checklist gizi. Setiap batch makanan anak sekolah dapat dipindai hingga ke nama desa asal panen.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-purple-800">
              <span>Sertifikat audit & QR publik</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* ALUR KERJA INTERAKTIF PER PERAN */}
      <section id="cara-kerja" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface-muted/60 rounded-3xl border border-surface-border p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pine-950">
              Bagaimana Alur Rantai Pasok Bekerja?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Pilih peran pengguna di bawah untuk melihat bagaimana sistem mengorkestrasi rantai pasok secara mulus
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
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
                <div className="p-4 bg-surface-muted/70 rounded-xl border border-surface-border space-y-2 text-xs font-mono">
                  <div className="text-gray-500 font-bold border-b border-surface-border pb-1">
                    Simulasi Demand Terbit
                  </div>
                  <div className="flex justify-between">
                    <span>Menu: R1 (Senin)</span>
                    <span className="text-emerald-700 font-bold">1.000 Anak</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayam Hijau (+15% susut):</span>
                    <span className="font-bold text-pine-950">69,0 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Maksimum:</span>
                    <span>Rp 10.000 / kg</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'farmer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
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
                <div className="p-4 bg-surface-muted/70 rounded-xl border border-surface-border space-y-2 text-xs font-mono">
                  <div className="text-gray-500 font-bold border-b border-surface-border pb-1">
                    Tawaran Masuk (S1 - Tani Makmur)
                  </div>
                  <div className="flex justify-between">
                    <span>Pesanan Dapur DPR01:</span>
                    <span className="text-brand font-bold">40,0 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Disepakati:</span>
                    <span>Rp 8.000 / kg</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Dana Dicadangkan:</span>
                    <span>Rp 320.000 [HOLD]</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'coordinator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
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
                <div className="p-4 bg-surface-muted/70 rounded-xl border border-surface-border space-y-2 text-xs font-mono">
                  <div className="text-gray-500 font-bold border-b border-surface-border pb-1">
                    Konsolidasi Pengiriman
                  </div>
                  <div className="flex justify-between">
                    <span>Titik Kumpul:</span>
                    <span>Sukamaju & Mekarsari</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kode Batch Dihasilkan:</span>
                    <span className="text-blue-800 font-bold">ORV-20261014-DPR01-0001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Muatan:</span>
                    <span className="font-bold">69,0 kg</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabRole === 'inspector' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
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
                <div className="p-4 bg-surface-muted/70 rounded-xl border border-surface-border space-y-2 text-xs font-mono">
                  <div className="text-gray-500 font-bold border-b border-surface-border pb-1">
                    Hasil Pemeriksaan Mutu
                  </div>
                  <div className="flex justify-between">
                    <span>Skor Checklist Gizi:</span>
                    <span className="text-emerald-700 font-bold">90 / 100 [PASS]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Diterima:</span>
                    <span>40,0 kg (100%)</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Pencairan Buku Besar:</span>
                    <span>Rp 320.000 [RELEASE]</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION DENGAN SENTUHAN BRAND ARTISAN AGRITECH */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-brand text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-elevated">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-harvest-gold/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl text-left space-y-4">
            <Badge color="accent">Bergabung Bersama Gerakan Pangan Bergizi</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Wujudkan Rantai Pasok Pangan Mandiri, Berkeadilan, dan Bermutu
            </h2>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Daftarkan dapur gizi massal, kelompok tani, atau koperasi distribusi Anda ke dalam jaringan ORVANA sekarang.
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
