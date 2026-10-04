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
  Scale,
  QrCode,
  Award,
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
        return <Badge color="warning">Lolos Parsial (PARTIAL)</Badge>;
      case 'FAIL':
        return <Badge color="danger">Tidak Lolos (FAIL)</Badge>;
      default:
        return <Badge color="neutral">Menunggu Uji Mutu</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SETTLED_TO_FARMER':
        return <Badge color="success">Pencairan Hak Petani Tuntas</Badge>;
      case 'ESCROW_HOLD':
        return <Badge color="warning">Dana Tertahan Escrow</Badge>;
      case 'CANCELLED':
        return <Badge color="danger">Batal Karena Mutu</Badge>;
      default:
        return <Badge color="neutral">Menunggu Penyelesaian</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header Publik */}
      <header className="bg-white/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-card bg-brand flex items-center justify-center text-white font-serif font-black text-xl shadow-sm border border-brand-light">
              O
            </span>
            <div>
              <span className="font-heading font-extrabold text-base text-gray-950 tracking-tight block leading-tight">
                ORVANA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-semibold">
                Passport Pangan Digital
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm">
                Beranda
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : isError || !trace ? (
          <Card className="p-12 text-center space-y-4 border-dashed border-2 border-surface-border bg-white">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-gray-900">
                Data Batch Tidak Ditemukan
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 font-mono">
                Kode "{batchCode}" belum terdaftar pada buku besar digital ORVANA.
              </p>
            </div>
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchInput.trim()) {
                    window.location.href = `/trace/${encodeURIComponent(searchInput.trim())}`;
                  }
                }}
                className="flex items-center justify-center gap-2 max-w-sm mx-auto"
              >
                <input
                  type="text"
                  placeholder="Ketik kode batch lain..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="px-3 py-2 text-xs border border-surface-border rounded-DEFAULT flex-1 font-mono focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <Button type="submit" size="sm">
                  Cari
                </Button>
              </form>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Passport Certificate Card (Sertifikat Penelusuran Resmi) */}
            <div className="bg-white rounded-card border-2 border-brand/20 shadow-card p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-surface-border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-brand-soft text-brand px-2.5 py-1 rounded border border-brand/20">
                      BATCH: {trace.batchCode}
                    </span>
                    {getQcBadge(trace.quality?.result)}
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950">
                    {trace.commodity.name}
                  </h1>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    Destinasi: {trace.logistics.kitchenName} ({trace.logistics.kitchenCode})
                  </p>
                </div>

                {/* Stempel Sertifikasi / QR Mockup */}
                <div className="p-4 rounded-card bg-surface-muted/60 border border-surface-border text-center shrink-0 w-full sm:w-auto">
                  <div className="w-16 h-16 mx-auto bg-white p-2 rounded border border-surface-border shadow-2xs flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-brand" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider block mt-2">
                    Sertifikat Asal Bahan
                  </span>
                  <div className="mt-1">{getPaymentBadge(trace.paymentStatus)}</div>
                </div>
              </div>

              {/* Rangkuman Fakta Kunci (Passport Key Facts) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                    Produsen Asli
                  </span>
                  <p className="font-heading font-bold text-sm text-gray-900 mt-0.5">
                    {trace.origin.supplierName}
                  </p>
                  <span className="text-xs text-gray-500 block">Desa {trace.origin.village || 'Lokal'}</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                    Kuantitas Panen
                  </span>
                  <p className="font-mono font-bold text-sm text-gray-900 mt-0.5">
                    {formatKg(trace.quantities.shipped)}
                  </p>
                  <span className="text-xs text-gray-500 block">Kategori {trace.origin.supplierType}</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                    Jarak Distribusi
                  </span>
                  <p className="font-mono font-bold text-sm text-brand mt-0.5">
                    {trace.logistics.distanceKm} km
                  </p>
                  <span className="text-xs text-gray-500 block">Rantai pasok pendek</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                    Skor Uji Mutu Gizi
                  </span>
                  <p className="font-mono font-bold text-sm text-emerald-800 mt-0.5">
                    {trace.quality?.score ? `${trace.quality.score} / 100` : 'Menunggu'}
                  </p>
                  <span className="text-xs text-gray-500 block">Inspektur independen</span>
                </div>
              </div>
            </div>

            {/* Linimasa Perjalanan Pangan 5 Tahap (Tactical Timeline) */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-xl text-gray-950">
                Linimasa Perjalanan Pangan
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-surface-border">
                {/* 1. Panen */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-xs">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4 bg-white border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        1. Panen dari Lahan Petani Lokal
                      </span>
                      <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trace.timeline.harvestDate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Dipetik langsung oleh mitra <span className="font-semibold">{trace.origin.supplierName}</span> di Desa {trace.origin.village || 'Binaan'}.
                    </p>
                  </Card>
                </div>

                {/* 2. Pengiriman */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4 bg-white border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        2. Konsolidasi & Pengiriman Armada Wilayah
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {trace.timeline.shippedAt ? formatDate(trace.timeline.shippedAt) : 'Menunggu Jadwal'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Diangkut armada koordinator berpendingin sejauh <span className="font-mono font-semibold">{trace.logistics.distanceKm} km</span>. Susut transit tercatat: <span className="font-mono">{formatKg(trace.logistics.lossKg)}</span>.
                    </p>
                  </Card>
                </div>

                {/* 3. Penerimaan */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-xs">
                    <Scale className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4 bg-white border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        3. Serah Terima Fisik di Dapur Gizi Massal
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {trace.timeline.receivedAt ? formatDate(trace.timeline.receivedAt) : 'Dalam Perjalanan'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Timbangan riil serah terima dapur: <span className="font-mono font-bold text-gray-900">{trace.quantities.received ? formatKg(trace.quantities.received) : '-'}</span>.
                    </p>
                  </Card>
                </div>

                {/* 4. Pemeriksaan Mutu */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4 bg-white border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        4. Uji Mutu & Standar Higienitas Gizi Anak
                      </span>
                      <span className="text-xs font-mono text-gray-500">
                        {trace.timeline.checkedAt ? formatDate(trace.timeline.checkedAt) : 'Menunggu Antrean'}
                      </span>
                    </div>

                    {trace.quality ? (
                      <div className="space-y-3 mt-2">
                        <div className="p-3 bg-surface-muted/70 rounded-DEFAULT border border-surface-border flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500 block">Hasil Kelayakan Konsumsi:</span>
                            <span className="font-mono font-bold text-sm text-emerald-800">
                              Diterima: {formatKg(trace.quantities.accepted || 0)}
                            </span>
                            {Number(trace.quantities.rejected || 0) > 0 && (
                              <span className="font-mono text-xs text-rose-700 ml-2">
                                Ditolak: {formatKg(trace.quantities.rejected || 0)}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-semibold text-gray-400 block">Skor Ahli Gizi</span>
                            <span className="text-2xl font-mono font-bold text-emerald-900">{trace.quality.score}</span>
                          </div>
                        </div>

                        {/* Parameter checklist */}
                        {trace.quality.checklistScores && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                            {Object.entries(trace.quality.checklistScores).map(([k, v]) => (
                              <div key={k} className="p-2 rounded bg-white border border-surface-border flex justify-between">
                                <span className="capitalize text-gray-600">{k}</span>
                                <span className="font-mono font-bold text-gray-900">{v}/100</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Batch sedang dalam antrean pengujian parameter kesegaran dan higienitas.
                      </p>
                    )}
                  </Card>
                </div>

                {/* 5. Kepastian Pembayaran Petani */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-harvest-soft text-harvest-amber flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <Card className="flex-1 p-4 bg-white border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-sm text-gray-900">
                        5. Hak Produsen & Pencatatan Buku Besar
                      </span>
                      {getPaymentBadge(trace.paymentStatus)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Setiap kilogram bahan pangan yang lulus uji mutu secara otomatis dicairkan pembayarannya kepada produsen lokal melalui buku besar append-only ORVANA.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* Verifikasi Kriptografis */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-card flex items-center gap-3 text-xs text-emerald-900">
              <Award className="w-5 h-5 shrink-0 text-emerald-700" />
              <span>
                Data rantai pasok ini dijamin oleh standar audit publik digital ORVANA. Identitas produsen dilindungi privasinya sesuai ketentuan perizinan sistem.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
