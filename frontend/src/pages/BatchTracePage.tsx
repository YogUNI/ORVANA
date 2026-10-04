import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { formatKg, formatDate } from '../lib/format';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ShieldCheck,
  XCircle,
  Truck,
  Calendar,
  Building,
  Sprout,
  Receipt,
  Search,
  Scale,
} from 'lucide-react';

interface PublicTraceData {
  batchCode: string;
  commodity: {
    name: string;
    unit: string;
  };
  origin: {
    village: string | null;
    supplierName: string;
    supplierType: string;
    isPublicName: boolean;
  };
  timeline: {
    harvestDate: string;
    shippedAt?: string | null;
    receivedAt?: string | null;
    checkedAt?: string | null;
  };
  quantities: {
    shipped: number;
    received: number | null;
    accepted: number | null;
    rejected: number | null;
  };
  logistics: {
    kitchenName: string;
    kitchenCode: string;
    distanceKm: number;
    lossKg: number;
  };
  quality: {
    score: number | null;
    result: string | null;
    checklistScores: Record<string, number>;
    notes?: string | null;
  } | null;
  paymentStatus: string;
}

export const BatchTracePage: React.FC = () => {
  const { batchCode } = useParams<{ batchCode: string }>();
  const [searchInput, setSearchInput] = useState('');

  const { data: traceResponse, isLoading, isError } = useQuery<{ data: PublicTraceData }>({
    queryKey: ['public-trace', batchCode],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PublicTraceData }>(`/public/trace/${batchCode}`);
      return res.data;
    },
    enabled: !!batchCode,
  });

  const trace = traceResponse?.data;

  const getQcBadge = (result?: string | null) => {
    switch (result) {
      case 'PASS':
        return <Badge color="success">Lolos Mutu Prima (PASS)</Badge>;
      case 'PARTIAL':
        return <Badge color="warning">Lolos Sebagian (PARTIAL)</Badge>;
      case 'FAIL':
        return <Badge color="danger">Tidak Lolos Mutu (FAIL)</Badge>;
      default:
        return <Badge color="neutral">Menunggu Pemeriksaan Mutu</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SETTLED_TO_FARMER':
        return <Badge color="success">Hak Petani/Nelayan Dituntaskan</Badge>;
      case 'ESCROW_HOLD':
        return <Badge color="warning">Dana Diamankan di Rekening Penampung</Badge>;
      case 'CANCELLED':
        return <Badge color="danger">Dibatalkan</Badge>;
      default:
        return <Badge color="neutral">Menunggu Verifikasi</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      {/* Header Publik */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-heading font-black text-lg">
              O
            </span>
            <span className="font-heading font-bold text-lg text-gray-900">
              ORVANA <span className="text-xs font-normal text-gray-500 ml-1">Transparansi Rantai Pasok</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Masuk Sistem
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Bar Pencarian Cepat */}
      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <Badge color="info">Penelusuran Asal Usul Bahan Pangan (Batch Traceability)</Badge>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">
            Jejak Transparansi Pangan Dapur Gizi
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Lacak perjalanan bahan baku pangan bergizi anak sekolah & balita: dari ladang petani lokal, armada distribusi, uji mutu ahli gizi, hingga kepastian pembayaran petani.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) {
                window.location.href = `/trace/${encodeURIComponent(searchInput.trim())}`;
              }
            }}
            className="flex items-center justify-center gap-2 pt-2 max-w-md mx-auto"
          >
            <input
              type="text"
              placeholder="Masukkan kode batch, misal: ORV-20261012-DPR01-0001"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand font-mono"
            />
            <Button type="submit" size="sm" className="flex items-center gap-1.5 shrink-0">
              <Search className="w-4 h-4" />
              <span>Lacak</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError || !trace ? (
          <Card className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-gray-900">
                Batch Tidak Ditemukan
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                Kode batch <span className="font-mono font-semibold text-gray-800">{batchCode}</span> tidak terdaftar dalam catatan buku besar sistem ORVANA. Pastikan kode diketik dengan benar atau hubungi koordinator wilayah.
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Kembali ke Beranda
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Banner Kartu Batch */}
            <Card className="p-6 border-l-4 border-brand bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                      {trace.batchCode}
                    </span>
                    {getQcBadge(trace.quality?.result)}
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-gray-900 mt-2">
                    Komoditas: {trace.commodity.name}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4 text-gray-400" />
                    Tujuan Dapur: <span className="font-semibold text-gray-700">{trace.logistics.kitchenName}</span> ({trace.logistics.kitchenCode})
                  </p>
                </div>

                <div className="text-left sm:text-right bg-brand-soft/50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <p className="text-xs text-gray-500">Status Pembayaran Produsen</p>
                  <div className="mt-1">{getPaymentBadge(trace.paymentStatus)}</div>
                </div>
              </div>
            </Card>

            {/* Linimasa Vertikal Perjalanan Bahan Pangan (5 Tahap) */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-gray-900 text-base">
                Linimasa Penelusuran Asal Pangan (Traceability Timeline)
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gray-200">
                {/* 1. Asal Usul & Panen */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        1. Panen & Produsen Pangan Lokal
                      </span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trace.timeline.harvestDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Diproduksi oleh: <span className="font-semibold text-gray-800">{trace.origin.supplierName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Lokasi: Desa {trace.origin.village || 'Binaan Lokal'} • Kategori: {trace.origin.supplierType}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Kuantitas Awal Panen: <span className="font-mono font-semibold text-gray-800">{formatKg(trace.quantities.shipped)}</span>
                    </div>
                  </Card>
                </div>

                {/* 2. Distribusi & Koridor Logistik */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                    <Truck className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        2. Konsolidasi & Pengiriman Armada
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {trace.timeline.shippedAt ? formatDate(trace.timeline.shippedAt) : 'Menunggu Keberangkatan'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Rantai Pasok Pendek: Jarak tempuh produsen ke dapur sejauh <span className="font-semibold text-gray-800">{trace.logistics.distanceKm} km</span>.
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Susut dalam perjalanan: <span className="font-mono text-gray-700">{formatKg(trace.logistics.lossKg)}</span>
                    </p>
                  </Card>
                </div>

                {/* 3. Penerimaan di Dapur Gizi */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                    <Scale className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        3. Serah Terima Fisik di Dapur Gizi
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {trace.timeline.receivedAt ? formatDate(trace.timeline.receivedAt) : 'Belum Diterima'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Diterima langsung di timbangan dapur gizi: <span className="font-mono font-semibold text-gray-800">{trace.quantities.received ? formatKg(trace.quantities.received) : '-'}</span>
                    </p>
                  </Card>
                </div>

                {/* 4. Pemeriksaan Mutu Ahli Gizi */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        4. Uji Mutu & Standar Higienitas Gizi
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {trace.timeline.checkedAt ? formatDate(trace.timeline.checkedAt) : 'Belum Diperiksa'}
                      </span>
                    </div>

                    {trace.quality ? (
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 text-center">
                            <span className="text-xs uppercase font-semibold block">Skor Mutu</span>
                            <span className="text-2xl font-bold font-mono">{trace.quality.score}</span>
                            <span className="text-[10px] text-gray-500 block">dari 100</span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div>
                              Diterima Lolos Konsumsi: <span className="font-mono font-semibold text-emerald-600">{formatKg(trace.quantities.accepted || 0)}</span>
                            </div>
                            {Number(trace.quantities.rejected || 0) > 0 && (
                              <div>
                                Ditolak / Tidak Memenuhi Standar: <span className="font-mono font-semibold text-red-600">{formatKg(trace.quantities.rejected || 0)}</span>
                              </div>
                            )}
                            <div className="text-gray-500 italic">
                              "{trace.quality.notes || 'Bahan segar, bersih, dan layak olah sesuai standar gizi massal.'}"
                            </div>
                          </div>
                        </div>

                        {/* Breakdown Checklist */}
                        {trace.quality.checklistScores && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Rincian Parameter Mutu
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              {Object.entries(trace.quality.checklistScores).map(([key, val]) => (
                                <div key={key} className="bg-gray-50 p-2 rounded flex justify-between">
                                  <span className="capitalize text-gray-600">{key}</span>
                                  <span className="font-mono font-semibold text-gray-900">{val} / 100</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Batch sedang menunggu giliran inspeksi oleh Quality Inspector independen.
                      </p>
                    )}
                  </Card>
                </div>

                {/* 5. Kepastian Pembayaran Petani */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        5. Hak Produsen & Pencatatan Buku Besar
                      </span>
                      {getPaymentBadge(trace.paymentStatus)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Dana transaksi dicatat secara transparan dalam buku besar (append-only ledger). Petani lokal menerima pembayaran atas bahan yang lolos standar mutu gizi secara tepat waktu.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* Catatan Integritas Data */}
            <div className="p-4 bg-brand-soft/40 border border-brand/20 rounded-xl flex items-center gap-3 text-xs text-brand">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>
                Data penelusuran ini terverifikasi secara kriptografis oleh sistem rantai pasok ORVANA dan dilindungi oleh privasi data produsen lokal sesuai regulasi yang berlaku.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
