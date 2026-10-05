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
  const { data: dashboard, isLoading } = useQuery<KitchenDashboardData>({
    queryKey: ['kitchen-dashboard'],
    queryFn: async () => {
      const res: any = await apiClient.get('/dashboard/kitchen');
      return (res.data || res) as KitchenDashboardData;
    },
  });

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
      {/* Hero Operational Banner: Pusat Operasional Dapur Gizi */}
      <div className="bg-surface-card border border-surface-border rounded-card p-6 sm:p-7 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700">
              <Building2 className="w-3.5 h-3.5 text-pine-800" />
              <span>
                {dashboard?.kitchen?.name || 'Dapur Gizi'} • ID Unit: <strong>{dashboard?.kitchen?.code || 'DPR01'}</strong>
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-stone-950 leading-tight">
              Pusat Kendali Pengolahan Gizi Massal
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Target Kapasitas: <strong className="font-mono text-stone-900">{dashboard?.kitchen?.portionCapacity?.toLocaleString('id-ID') || '1.000'} Porsi Anak/Hari</strong> • Terhubung langsung dengan rantai pasok produsen pangan lokal binaan daerah.
            </p>
          </div>

          {/* Quick Action CTA Hub */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link to="/kitchen/menu">
              <Button
                className="bg-brand hover:bg-brand-hover text-white font-heading font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 py-2.5 px-4"
              >
                <Plus className="w-4 h-4" />
                <span>Susun Menu Pekan Ini</span>
              </Button>
            </Link>

            <Link to="/kitchen/demand">
              <Button
                variant="outline"
                className="border-surface-border text-stone-700 hover:bg-stone-50 text-xs sm:text-sm py-2.5 px-4"
              >
                <ShoppingBag className="w-4 h-4 text-pine-800 mr-1.5" />
                <span>Kebutuhan Bahan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar Keterpenuhan Gizi */}
        <div className="mt-6 pt-5 border-t border-surface-border">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-stone-700 flex items-center gap-1.5 font-sans font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-pine-800" />
              Keterpenuhan Pasokan Pangan:
            </span>
            <span className="font-bold text-stone-900 text-sm">
              {fulfillmentPct}%{' '}
              <span className="text-stone-500 font-normal">
                ({formatKg(dashboard?.fulfilledKg ?? 0)} / {formatKg(dashboard?.totalDemandKg ?? 0)})
              </span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOptimalFulfillment
                  ? 'bg-pine-800'
                  : 'bg-amber-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, fulfillmentPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Operasional Presisi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Keterpenuhan Bahan */}
        <div className="p-5 bg-white border border-surface-border shadow-soft rounded-card hover:border-brand-border transition-colors group space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span className="group-hover:text-stone-900 transition-colors">Tingkat Keterpenuhan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-stone-950">
            {fulfillmentPct}%
          </p>
          <p className="text-[11px] text-stone-500 font-sans">
            {formatKg(dashboard?.fulfilledKg ?? 0)} bahan lolos QC diterima
          </p>
        </div>

        {/* 2. Realisasi Belanja Riil */}
        <div className="p-5 bg-white border border-surface-border shadow-soft rounded-card hover:border-brand-border transition-colors group space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span className="group-hover:text-stone-900 transition-colors">Realisasi Belanja Riil</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-stone-950">
            {formatRupiah(dashboard?.totalSpendingRupiah ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-800 font-sans flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Buku besar RELEASE (Cair)
          </p>
        </div>

        {/* 3. Dana Escrow Terproteksi */}
        <div className="p-5 bg-white border border-surface-border shadow-soft rounded-card hover:border-amber-300 transition-colors group space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span className="group-hover:text-stone-900 transition-colors">Dana Dicadangkan (Escrow)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-900">
            {formatRupiah(dashboard?.escrowHoldRupiah ?? 0)}
          </p>
          <p className="text-[11px] text-stone-500 font-sans">
            Status [HOLD] jaminan dana petani
          </p>
        </div>

        {/* 4. Armada Dalam Perjalanan */}
        <div className="p-5 bg-white border border-surface-border shadow-soft rounded-card hover:border-pine-300 transition-colors group space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 font-heading">
            <span className="group-hover:text-stone-900 transition-colors">Armada Menuju Dapur</span>
            <div className="w-8 h-8 rounded-lg bg-pine-50 text-pine-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-pine-950">
            {dashboard?.pendingReceivingCount ?? 0} Pesanan
          </p>
          <p className="text-[11px] text-pine-800 font-sans font-semibold">
            Status IN_TRANSIT (Siap Timbang)
          </p>
        </div>
      </div>

      {/* Alert Armada Siap Terima (Jika Ada Pengiriman Sedang Berjalan) */}
      {dashboard?.incomingShipments && dashboard.incomingShipments.length > 0 && (
        <div className="bg-stone-50 p-4 sm:p-5 rounded-card border border-pine-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-pine-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-stone-900">
                  Armada Logistik Sedang Menuju Dapur Anda
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pine-100 text-pine-800 font-bold border border-pine-200">
                  {dashboard.incomingShipments.length} Pengiriman
                </span>
              </div>
              <p className="text-xs text-stone-600 font-sans mt-0.5">
                Pastikan tim penerimaan bersiap memverifikasi kuantitas timbang dan kondisi fisik bahan segar.
              </p>
            </div>
          </div>

          <Link to="/kitchen/receiving">
            <Button
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs shrink-0 shadow-xs flex items-center gap-1.5 py-2 px-3.5"
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
          <Card className="p-5 sm:p-6 bg-white border border-surface-border shadow-soft rounded-card">
            <div className="flex justify-between items-center pb-3.5 border-b border-surface-border mb-4">
              <div>
                <h3 className="font-heading font-bold text-stone-900 text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-pine-800" />
                  <span>Daftar Alokasi Pesanan Bahan Segar</span>
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Memantau siklus alokasi pasokan dari kesanggupan petani hingga lolos uji mutu
                </p>
              </div>

              <Link
                to="/kitchen/demand"
                className="text-xs font-semibold text-pine-800 hover:text-pine-950 flex items-center gap-1 font-heading"
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
