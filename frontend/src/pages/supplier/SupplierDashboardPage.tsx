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
  Sprout,
  Wallet,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

interface SupplierDashboardData {
  profile: {
    id: string;
    displayName: string;
    type: string;
  };
  earnedRupiah: number;
  escrowRupiah: number;
  qualityScore: number;
  averageRating?: number | null;
  reviewCount?: number;
  activeOrdersCount: number;
  proposedOrdersCount: number;
  activeOffersCount: number;
  harvestPlansCount: number;
  recentOrders: Array<{
    id: string;
    orderNo: string;
    commodityName: string;
    kitchenName: string;
    quantityKg: number;
    pricePerUnit: number;
    totalPrice: number;
    status: string;
    createdAt: string;
  }>;
}

export const SupplierDashboardPage: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery<SupplierDashboardData>({
    queryKey: ['supplier-dashboard'],
    queryFn: async () => {
      const res: any = await apiClient.get('/dashboard/supplier');
      return (res.data || res) as SupplierDashboardData;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Sambutan Produsen & Aksi Cepat */}
      <div className="bg-surface-card border border-surface-border rounded-card p-6 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Lumbung Tani Terverifikasi
              </span>
              {dashboard?.profile?.displayName && (
                <span className="text-xs font-heading font-bold text-gray-700">
                  • {dashboard.profile.displayName}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-950">
              Pusat Kendali Pasokan Pangan
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
              Pantau komitmen hasil panen, kepastian pembayaran tertahan di escrow, dan respon cepat terhadap kebutuhan dapur gizi Cibinong.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/supplier/stock">
              <Button className="bg-brand text-white hover:bg-brand-hover text-xs font-semibold px-4 py-2.5 shadow-sm">
                <Sprout className="w-4 h-4 mr-1.5" />
                Daftarkan Panen Baru
              </Button>
            </Link>
            <Link to="/supplier/orders">
              <Button variant="outline" className="border-surface-border text-gray-700 hover:bg-surface-muted text-xs font-semibold px-4 py-2.5">
                <ShoppingBag className="w-4 h-4 mr-1.5 text-pine-700" />
                Pesanan ({dashboard?.proposedOrdersCount ?? 0})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Metrik Utama: Finansial & Mutu Reputasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-surface-border rounded-card shadow-soft hover:border-brand-border transition-colors space-y-2 group">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="group-hover:text-stone-900 transition-colors">Pendapatan Tuntas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-stone-950">
            {formatRupiah(dashboard?.earnedRupiah ?? 0)}
          </p>
          <span className="text-[11px] text-emerald-800 font-medium block">
            ✓ Dicairkan langsung ke rekening petani
          </span>
        </div>

        <div className="p-5 bg-white border border-surface-border rounded-card shadow-soft hover:border-amber-300 transition-colors space-y-2 group">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="group-hover:text-stone-900 transition-colors">Dana Terkunci (Escrow)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-amber-900">
            {formatRupiah(dashboard?.escrowRupiah ?? 0)}
          </p>
          <span className="text-[11px] text-amber-700 font-medium block">
            Jaminan aman hingga QC selesai
          </span>
        </div>

        <div className="p-5 bg-white border border-surface-border rounded-card shadow-soft hover:border-pine-300 transition-colors space-y-2 group">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="group-hover:text-stone-900 transition-colors">Skor Mutu Pangan</span>
            <div className="w-8 h-8 rounded-lg bg-pine-50 text-pine-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-emerald-800">
              {dashboard?.qualityScore ?? 70}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ 100</span>
          </div>
          <span className="text-[11px] text-stone-500 block">
            {dashboard?.averageRating
              ? `Rating ${dashboard.averageRating.toFixed(1)} dari ${dashboard.reviewCount ?? 0} ulasan dapur`
              : 'Akreditasi inspektur mutu resmi'}
          </span>
        </div>

        <div className="p-5 bg-white border border-surface-border rounded-card shadow-soft hover:border-brand-border transition-colors space-y-2 group">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span className="group-hover:text-stone-900 transition-colors">Tawaran Perlu Respon</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-stone-950">
            {dashboard?.proposedOrdersCount ?? 0}
            <span className="text-xs font-sans font-normal text-stone-500 ml-1.5">Pesanan</span>
          </p>
          <span className="text-[11px] text-amber-800 font-medium block">
            Batas waktu sanggup 12 jam
          </span>
        </div>
      </div>

      {/* Pesanan Terbaru & Ringkasan Pasokan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-white border border-surface-border shadow-soft">
          <div className="flex justify-between items-center pb-3 border-b border-surface-border mb-4">
            <h3 className="font-heading font-bold text-gray-950 text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pine-800" />
              Pesanan Masuk Terkini
            </h3>
            <Link to="/supplier/orders" className="text-xs text-pine-800 hover:text-pine-950 font-semibold flex items-center gap-1">
              Buka Semua Pesanan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-1" />
              <p className="text-xs font-sans">Belum ada pesanan aktif yang dialokasikan ke kebun Anda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dashboard.recentOrders.map((ord) => {
                const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                  label: ord.status,
                  color: 'neutral',
                };
                return (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {ord.orderNo}
                        </span>
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">
                        {ord.commodityName} • <span className="font-mono">{formatKg(ord.quantityKg)}</span>
                      </p>
                      <p className="text-[11px] text-gray-500 font-sans">
                        Tujuan: {ord.kitchenName} • Nilai: <span className="font-mono font-semibold text-emerald-800">{formatRupiah(ord.totalPrice)}</span> • {formatDate(ord.createdAt)}
                      </p>
                    </div>

                    <Link to="/supplier/orders">
                      <Button variant="outline" size="sm" className="text-xs py-1 px-3 border-surface-border text-gray-700 hover:bg-surface-muted">
                        Kelola
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Status Stok & Kalender Panen */}
        <div className="space-y-4">
          <Card className="p-5 bg-pine-50/70 border border-pine-200 shadow-soft">
            <h4 className="font-heading font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-pine-800" />
              Katalog Pasokan Aktif
            </h4>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-gray-600 font-sans">Tawaran Stok Siap Kirim:</span>
              <span className="font-mono font-bold text-pine-900 text-sm">{dashboard?.activeOffersCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs text-gray-600 font-sans">Jadwal Rencana Panen:</span>
              <span className="font-mono font-bold text-pine-900 text-sm">{dashboard?.harvestPlansCount ?? 0}</span>
            </div>
            <Link to="/supplier/calendar">
              <Button size="sm" className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold">
                Pantau Kalender Kolektif
              </Button>
            </Link>
          </Card>

          <Card className="p-5 bg-white border border-surface-border shadow-soft">
            <h4 className="font-heading font-bold text-gray-950 text-sm flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-700" />
              Riwayat Pembayaran
            </h4>
            <p className="text-xs text-gray-600 font-sans leading-relaxed mb-4">
              Periksa catatan rincian transaksi buku besar dan bukti pencairan hak petani per nomor order.
            </p>
            <Link to="/supplier/payments">
              <Button size="sm" variant="outline" className="w-full border-surface-border text-gray-700 hover:bg-surface-muted text-xs font-semibold">
                Buka Buku Besar Petani
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
