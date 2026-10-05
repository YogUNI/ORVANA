import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { formatRupiah, formatKg } from '../lib/format';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
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
    <div className="min-h-screen bg-surface">
      {/* Header Elegan */}
      <header className="bg-white/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="ORVANA" className="w-10 h-10 object-contain drop-shadow-sm" />
            <div>
              <span className="font-heading font-extrabold text-xl text-gray-950 tracking-tight block leading-tight">
                ORVANA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-semibold">
                Rantai Pasok Gizi Massal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login">
              <Button variant="outline" size="sm">
                Masuk Sistem
              </Button>
            </a>
            <a href="/register">
              <Button variant="primary" size="sm">
                Daftar Mitra
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section dengan Sentuhan Artisan Agritech */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Award className="w-3.5 h-3.5" />
            <span>Kedaulatan Pangan & Gizi Generasi Emas</span>
          </div>
          
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-gray-950 tracking-tight leading-[1.15]">
            Mencocokkan Kebutuhan Dapur dengan <span className="text-brand italic underline decoration-harvest-gold/60 decoration-wavy decoration-2">Panen Petani Lokal</span>
          </h1>
          
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Platform rantai pasok terintegrasi untuk dapur gizi massal sekolah & balita: perencanaan kebutuhan terukur, harga dasar terlindungi, kontrol mutu ketat, dan ketertelusuran publik tanpa perantara.
          </p>

          {/* Kotak Pencarian Batch Publik Interaktif */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="p-2 bg-white rounded-2xl shadow-card border-2 border-brand/20 focus-within:border-brand transition-all">
              <form onSubmit={handleTraceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full">
                  <Search className="w-4 h-4 text-emerald-800" />
                  <input
                    type="text"
                    placeholder="Lacak batch: misal ORV-20260920-DPR01-0001"
                    value={batchCodeInput}
                    onChange={(e) => setBatchCodeInput(e.target.value)}
                    className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none font-mono"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0 shadow-sm">
                  <span>Lacak Jejak Pangan</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
            <p className="text-xs text-gray-600 mt-2 font-mono">
              Contoh cepat:{' '}
              <a
                href="/trace/ORV-20260920-DPR01-0001"
                className="text-brand underline font-semibold hover:text-brand-light"
              >
                ORV-20260920-DPR01-0001
              </a>
            </p>
          </div>
        </div>

        {/* Ticker / Live Impact Summary Card (Data Nyata Buku Besar) */}
        <div className="bg-white rounded-card border border-surface-border p-6 shadow-soft mb-16 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 border-b border-surface-border pb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-pine-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-harvest-gold" />
                Dampak Nyata Rantai Pasok Terbuka
              </span>
              <p className="text-xs text-stone-500 mt-0.5">
                Agregasi langsung dari transaksi buku besar digital yang telah dituntaskan
              </p>
            </div>
            <Badge color="accent">Audit Publik Terverifikasi</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-surface-muted/60 rounded-DEFAULT border border-surface-border">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                Belanja Lokal
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-900 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-20" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">100% terserap di daerah</span>
            </div>

            <div className="p-4 bg-surface-muted/60 rounded-DEFAULT border border-surface-border">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Produsen Terlibat
              </span>
              <p className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-12" /> : `${impact?.producersInvolved || 0} Petani`}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">Petani, nelayan & UMKM</span>
            </div>

            <div className="p-4 bg-surface-muted/60 rounded-DEFAULT border border-surface-border">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                Pangan Terserap
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-brand mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-16" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">Bahan bergizi prima</span>
            </div>

            <div className="p-4 bg-surface-muted/60 rounded-DEFAULT border border-surface-border">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                Kelulusan Mutu
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-teal-900 mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-14" /> : `${impact?.qualityPassRatePct || 0}%`}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">Standar mutu gizi</span>
            </div>

            <div className="p-4 bg-surface-muted/60 rounded-DEFAULT border border-surface-border col-span-2 md:col-span-1">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-earth-terracotta" />
                Jarak Tempuh
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-earth-terracotta mt-1.5">
                {isLoading ? <Skeleton className="h-7 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5">Rantai distribusi pendek</span>
            </div>
          </div>
        </div>

        {/* 4 Pilar Solusi Berkarakter Kuat */}
        <div className="space-y-6 mb-16">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-950">
              Prinsip Rantai Pasok Pangan Berkeadilan
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sistem dibangun untuk memutus rantai tengkulak dan menjamin mutu makanan anak bangsa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card variant="default" className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-card bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-200">
                  <Sprout className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Kepastian Serapan Pasar
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Pencocokan kebutuhan menu dapur terjadwal 1-2 minggu lebih awal dengan rencana panen kelompok tani, menghindari surplus terbuang.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-brand">
                <span>Alokasi kuota adil 60%</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>

            <Card variant="default" className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-card bg-harvest-soft text-harvest-amber flex items-center justify-center mb-4 border border-amber-200">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Perlindungan Harga Dasar
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Sistem menolak harga di bawah dasar wilayah untuk melindungi petani dari perang harga. Rekening penampung menjamin kepastian bayar.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-harvest-amber">
                <span>Batas dasar regulasi dinas</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>

            <Card variant="default" className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-card bg-blue-50 text-blue-800 flex items-center justify-center mb-4 border border-blue-200">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Konsolidasi Armada Pendek
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Koordinator mengonsolidasi pesanan banyak petani dalam satu rute jemput efisien berjarak &lt; 25 km, menekan emisi dan menjaga kesegaran.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-blue-800">
                <span>Pelacakan susut perjalanan</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>

            <Card variant="default" className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-card bg-purple-50 text-purple-800 flex items-center justify-center mb-4 border border-purple-200">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Kontrol Mutu & Ketertelusuran
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Inspeksi checklist berbobot ahli gizi sebelum masak. Setiap batch beridentitas unik dengan jejak terbuka bagi orang tua siswa.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-surface-border flex items-center text-xs font-semibold text-purple-800">
                <span>Passport digital batch</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Bersahaja */}
      <footer className="border-t border-surface-border bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-brand text-base">O</span>
            <span>&copy; 2026 ORVANA. Rantai Pasok Pangan Lokal Dapur Gizi Massal.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/trace/ORV-20260920-DPR01-0001" className="hover:text-brand font-medium">
              Demo Penelusuran Batch
            </a>
            <a href="/login" className="hover:text-brand font-medium">
              Portal Petugas Dapur & Petani
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
