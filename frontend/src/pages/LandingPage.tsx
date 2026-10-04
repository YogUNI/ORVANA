import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { formatRupiah, formatKg } from '../lib/format';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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

  // Ambil ringkasan dampak langsung dari backend API publik (M9)
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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-heading font-black text-lg">
              O
            </span>
            <span className="font-heading font-bold text-xl text-gray-900 tracking-tight">
              ORVANA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login">
              <Button variant="outline" size="sm">
                Masuk
              </Button>
            </a>
            <a href="/register">
              <Button variant="primary" size="sm">
                Daftar
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge color="accent" className="mb-4">
            Rantai Pasok Pangan Lokal Dapur Gizi Massal
          </Badge>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Menghubungkan Kebutuhan Dapur dengan Panen Produsen Lokal
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Mencocokkan kebutuhan terjadwal dapur gizi massal dengan rencana panen petani & nelayan lokal secara transparan, adil dengan harga dasar, berstandar mutu terverifikasi, dan tertelusur.
          </p>

          {/* Kotak Pencarian Batch Publik Cepat */}
          <div className="mt-8 p-3 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-xl mx-auto">
            <form onSubmit={handleTraceSubmit} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ketik kode batch: misal ORV-20260920-DPR01-0001"
                  value={batchCodeInput}
                  onChange={(e) => setBatchCodeInput(e.target.value)}
                  className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none font-mono"
                />
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-1.5 shrink-0">
                <span>Lacak Pangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Ticker / Live Impact Summary Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-14">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Indikator Dampak Sosial & Ekonomi Nyata
              </span>
              <p className="text-xs text-gray-400">Diperbarui otomatis dari buku besar digital ORVANA</p>
            </div>
            <Badge color="success">Transparansi Publik</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-emerald-50/50 rounded-xl">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Belanja Lokal
              </span>
              <p className="text-lg sm:text-xl font-heading font-bold text-emerald-700 mt-1">
                {isLoading ? <Skeleton className="h-6 w-20" /> : formatRupiah(impact?.localSpendingRupiah || 0)}
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Produsen Terlibat
              </span>
              <p className="text-lg sm:text-xl font-heading font-bold text-blue-700 mt-1">
                {isLoading ? <Skeleton className="h-6 w-12" /> : `${impact?.producersInvolved || 0} Mitra`}
              </p>
            </div>

            <div className="p-3 bg-brand-soft/50 rounded-xl">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                Pangan Terserap
              </span>
              <p className="text-lg sm:text-xl font-heading font-bold text-brand mt-1">
                {isLoading ? <Skeleton className="h-6 w-16" /> : formatKg(impact?.totalDeliveredKg || 0)}
              </p>
            </div>

            <div className="p-3 bg-teal-50/50 rounded-xl">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Lolos Standar Mutu
              </span>
              <p className="text-lg sm:text-xl font-heading font-bold text-teal-700 mt-1">
                {isLoading ? <Skeleton className="h-6 w-14" /> : `${impact?.qualityPassRatePct || 0}%`}
              </p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl col-span-2 md:col-span-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                Jarak Tempuh Rata-rata
              </span>
              <p className="text-lg sm:text-xl font-heading font-bold text-purple-700 mt-1">
                {isLoading ? <Skeleton className="h-6 w-16" /> : `${impact?.avgDistanceKm || 0} km`}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pilar Fitur Utama ORVANA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-2">
                <Sprout className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Kepastian Pasar Petani</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Pencocokan kebutuhan dapur terjadwal 1-2 minggu di muka dengan rencana panen, memastikan penyerapan hasil bumi tanpa tengkulak.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-2">
                <Scale className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Perlindungan Harga Dasar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Batas harga dasar dinas mencegah predatory pricing. Pembayaran bertahap escrow menjamin hak produsen tersalurkan tepat waktu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Konsolidasi Rantai Pendek</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Koordinator wilayah mengonsolidasikan muatan dari banyak petani kecil dalam satu armada, menekan biaya logistik dan emisi karbon.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Kontrol Mutu & Ketertelusuran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Inspeksi checklist berbobot oleh ahli gizi independen. Setiap batch pangan memiliki kode unik yang dapat dilacak publik.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; 2026 ORVANA. Rantai Pasok Pangan Lokal Dapur Gizi Massal.</p>
          <div className="flex gap-4">
            <a href="/trace/ORV-20260920-DPR01-0001" className="hover:text-brand">
              Contoh Batch Demo
            </a>
            <a href="/login" className="hover:text-brand">
              Portal Petugas
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
