import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { ORDER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ShoppingBag,
  TrendingUp,
  Receipt,
  Truck,
  ArrowRight,
  Sparkles,
  CalendarDays,
  PackageOpen,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ChevronRight,
  Plus,
  Lock,
} from 'lucide-react';

interface KitchenDashboardData {
  kitchen: {
    id: string;
    name: string;
    code: string;
    portionCapacity: number;
    address?: string;
  };
  totalDemandKg: number;
  fulfilledKg: number;
  fulfillmentRatePct: number;
  totalSpendingRupiah: number;
  escrowHoldRupiah: number;
  activeOrdersCount: number;
  pendingReceivingCount: number;
  menuPlansCount: number;
  incomingShipments?: Array<{
    orderId: string;
    orderNo: string;
    batchCode: string;
    commodityName: string;
    supplierName: string;
    shippedQuantity: number;
    shipmentNo: string;
    scheduledAt?: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    orderNo: string;
    commodityName: string;
    supplierName: string;
    quantityKg: number;
    pricePerUnit: number;
    totalPrice: number;
    status: string;
    createdAt: string;
    batchCode?: string | null;
  }>;
}

export const KitchenDashboardPage: React.FC = () => {
  const { data: response, isLoading } = useQuery<{ data: KitchenDashboardData }>({
    queryKey: ['kitchen-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: KitchenDashboardData }>('/dashboard/kitchen');
      return res.data;
    },
  });

  const dashboard = response?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const fulfillmentPct = dashboard?.fulfillmentRatePct ?? 0;
  const isOptimalFulfillment = fulfillmentPct >= 80;

  return (
    <div className="space-y-6">
      {/* Hero Operational Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pine-950 via-pine-900 to-pine-950 text-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-pine-800/60">
        {/* Subtle decorative farm pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
            alt="Dapur Higienis"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-harvest-gold" />
              <span>
                {dashboard?.kitchen?.name || 'Dapur Gizi'} • Kode: {dashboard?.kitchen?.code || 'DPR01'}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Manajemen Pasokan Pangan Dapur Gizi
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
              Kapasitas: <span className="font-bold text-white font-mono">{dashboard?.kitchen?.portionCapacity?.toLocaleString('id-ID') || '1.000'} Porsi Anak/Hari</span> • Terhubung langsung dengan rantai produsen petani & nelayan lokal binaan dinas.
            </p>
          </div>

          {/* Quick Action CTA Hub */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link to="/kitchen/menu">
              <Button
                variant="harvest"
                size="md"
                className="font-heading font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Susun Menu Pekan Ini</span>
              </Button>
            </Link>

            <Link to="/kitchen/demand">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm min-h-[44px] backdrop-blur-xs"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-300 mr-1.5" />
                <span>Kebutuhan Bahan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar Keterpenuhan Gizi */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-emerald-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-harvest-gold" />
              Rasio Keterpenuhan Pasokan:
            </span>
            <span className="font-extrabold text-white text-sm">
              {fulfillmentPct}%{' '}
              <span className="text-emerald-300 font-normal">
                ({formatKg(dashboard?.fulfilledKg ?? 0)} / {formatKg(dashboard?.totalDemandKg ?? 0)})
              </span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-emerald-950/80 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOptimalFulfillment
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-harvest-gold to-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, fulfillmentPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Operasional Presisi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Keterpenuhan Bahan */}
        <Card className="p-5 bg-white border border-surface-border shadow-soft rounded-2xl hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span>Tingkat Keterpenuhan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-pine-950 mt-2">
            {fulfillmentPct}%
          </p>
          <p className="text-[11px] text-stone-500 font-sans mt-1">
            {formatKg(dashboard?.fulfilledKg ?? 0)} bahan lolos QC diterima
          </p>
        </Card>

        {/* 2. Realisasi Belanja Riil */}
        <Card className="p-5 bg-white border border-surface-border shadow-soft rounded-2xl hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span>Realisasi Belanja Riil</span>
            <div className="w-8 h-8 rounded-xl bg-harvest-soft text-harvest-amber flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-pine-950 mt-2">
            {formatRupiah(dashboard?.totalSpendingRupiah ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-800 font-sans mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Buku besar RELEASE (Cair)
          </p>
        </Card>

        {/* 3. Dana Escrow Terproteksi */}
        <Card className="p-5 bg-white border border-surface-border shadow-soft rounded-2xl hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span>Dana Dicadangkan (Escrow)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-950 mt-2">
            {formatRupiah(dashboard?.escrowHoldRupiah ?? 0)}
          </p>
          <p className="text-[11px] text-stone-500 font-sans mt-1">
            Status [HOLD] kepastian bayar petani
          </p>
        </Card>

        {/* 4. Armada Dalam Perjalanan */}
        <Card className="p-5 bg-white border border-surface-border shadow-soft rounded-2xl hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span>Armada Menuju Dapur</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-blue-950 mt-2">
            {dashboard?.pendingReceivingCount ?? 0} Pesanan
          </p>
          <p className="text-[11px] text-blue-900/80 font-sans mt-1 font-semibold">
            Status IN_TRANSIT (Siap Timbang)
          </p>
        </Card>
      </div>

      {/* Alert Armada Siap Terima (Jika Ada Pengiriman Sedang Berjalan) */}
      {dashboard?.incomingShipments && dashboard.incomingShipments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/60 p-5 rounded-3xl border-2 border-blue-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-blue-950">
                  Armada Logistik Sedang Bergerak Menuju Dapur Anda!
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                  {dashboard.incomingShipments.length} Pengiriman Tiba
                </span>
              </div>
              <p className="text-xs text-stone-600 font-sans mt-0.5">
                Pastikan tim timbang dapur bersiap memverifikasi kuantitas riil dan kondisi higienitas fisik bahan pangan.
              </p>
            </div>
          </div>

          <Link to="/kitchen/receiving">
            <Button
              variant="primary"
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <PackageOpen className="w-4 h-4" />
              <span>Buka Menu Penerimaan</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Tabel Pesanan Terbaru */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 bg-white border border-surface-border shadow-card rounded-3xl">
            <div className="flex justify-between items-center pb-4 border-b border-surface-border mb-4">
              <div>
                <h3 className="font-serif font-bold text-pine-950 text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand" />
                  <span>Daftar Alokasi Pesanan Bahan Segar</span>
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Memantau siklus alokasi pasokan dari kesanggupan petani hingga lolos uji mutu
                </p>
              </div>

              <Link
                to="/kitchen/demand"
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 font-heading"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Sparkles className="w-10 h-10 mx-auto mb-2 text-stone-300 stroke-1" />
                <p className="font-heading font-semibold text-stone-700 text-sm">Belum Ada Pesanan Terbit</p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Mulai dengan membuat rencana menu mingguan untuk secara otomatis menghitung dan mencocokkan bahan baku.
                </p>
                <Link to="/kitchen/menu" className="inline-block mt-4">
                  <Button variant="primary" size="sm" className="text-xs">
                    Susun Menu Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-border/70">
                {dashboard.recentOrders.map((ord) => {
                  const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                    label: ord.status,
                    color: 'neutral',
                  };

                  return (
                    <div
                      key={ord.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-muted/30 p-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-pine-950">
                            {ord.orderNo}
                          </span>
                          <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                          {ord.batchCode && (
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {ord.batchCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-heading font-bold text-stone-900">
                            {ord.commodityName}
                          </span>
                          <span className="text-stone-400">•</span>
                          <span className="font-mono font-semibold text-brand">
                            {formatKg(ord.quantityKg)}
                          </span>
                          <span className="text-stone-400">•</span>
                          <span className="font-mono text-stone-600">
                            {formatRupiah(ord.totalPrice)}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-500 font-sans">
                          Pemasok: <strong className="text-stone-700">{ord.supplierName}</strong> • {formatDate(ord.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ord.status === 'IN_TRANSIT' ? (
                          <Link to="/kitchen/receiving">
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1"
                            >
                              <PackageOpen className="w-3.5 h-3.5" />
                              <span>Timbang</span>
                            </Button>
                          </Link>
                        ) : (
                          <Link to="/kitchen/demand">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1.5 px-3 border-stone-300 text-stone-700 hover:bg-stone-50"
                            >
                              Rincian
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Kolom Kanan: Rencana Menu & Prosedur Higienis */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Rencana Menu Terjadwal */}
          <Card className="p-5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border border-emerald-200/80 shadow-soft rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                Jadwal Gizi Terencana
              </span>
              <CalendarDays className="w-4 h-4 text-emerald-800" />
            </div>

            <h4 className="font-serif font-bold text-pine-950 text-base">
              Rencana Menu Anak Sekolah
            </h4>

            <p className="text-xs text-stone-600 font-sans leading-relaxed mt-1 mb-4">
              Tercatat <strong className="text-pine-950 font-mono">{dashboard?.menuPlansCount ?? 0} rencana menu</strong> pada kalender gizi. Gunakan formula baku R1–R5 untuk kalkulasi otomatis kebutuhan susut pangan.
            </p>

            <Link to="/kitchen/menu">
              <Button
                variant="primary"
                size="sm"
                className="w-full font-heading font-semibold text-xs py-2.5 bg-brand hover:bg-brand-hover shadow-xs flex items-center justify-center gap-2"
              >
                <span>Buka Kalender Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          {/* Card Verifikasi Mutu & Buku Besar */}
          <Card className="p-5 bg-white border border-surface-border shadow-soft rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-stone-600">
              <ShieldCheck className="w-4 h-4 text-harvest-gold" />
              <span>Transparansi Dana & Mutu</span>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-surface-muted/60 rounded-xl border border-surface-border">
                <span className="font-semibold text-stone-800 block">Proteksi Harga Dasar Petani</span>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Sistem menjamin dapur tidak memesan di bawah harga pokok produksi petani lokal.
                </p>
              </div>

              <div className="p-3 bg-surface-muted/60 rounded-xl border border-surface-border">
                <span className="font-semibold text-stone-800 block">Pencairan Otomatis Sesuai Hasil QC</span>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Hanya bahan yang dinyatakan PASS atau PARTIAL oleh pengawas mutu yang dicairkan dananya.
                </p>
              </div>
            </div>

            <Link to="/kitchen/payments" className="block pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                Lihat Catatan Buku Besar
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
