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
  LayoutDashboard,
  Sprout,
  Wallet,
  Clock,
  ShieldCheck,
  CalendarDays,
  ShoppingBag,
  ArrowRight,
  Sparkles,
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
  const { data: response, isLoading } = useQuery<{ data: SupplierDashboardData }>({
    queryKey: ['supplier-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SupplierDashboardData }>('/dashboard/supplier');
      return res.data;
    },
  });

  const dashboard = response?.data;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-pine-900 tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-pine-700" />
              Dasbor Produsen & Petani Lokal
            </h1>
            {dashboard?.profile && (
              <span className="font-mono text-xs font-bold text-pine-800 bg-pine-100 px-2.5 py-0.5 rounded border border-pine-300">
                {dashboard.profile.displayName}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Ringkasan pendapatan tuntas, dana aman di escrow penjamin, skor reputasi mutu, dan alokasi pesanan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/supplier/stock">
            <Button size="sm" className="bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
              <Sprout className="w-3.5 h-3.5 mr-1.5" />
              Tambah Stok
            </Button>
          </Link>
          <Link to="/supplier/harvest-plan">
            <Button size="sm" variant="outline" className="border-pine-700 text-pine-800 hover:bg-pine-50 font-sans text-xs">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Rencana Panen
            </Button>
          </Link>
        </div>
      </div>

      {/* Kartu Ringkasan Finansial & Operasional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Pendapatan Tuntas
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-800 mt-2">
            {formatRupiah(dashboard?.earnedRupiah ?? 0)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Dicairkan via buku besar ORVANA
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Dana Tertahan (Escrow)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-700 mt-2">
            {formatRupiah(dashboard?.escrowRupiah ?? 0)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Aman dijamin sistem selama pengiriman
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Skor Mutu Produsen
            </span>
            <ShieldCheck className="w-4 h-4 text-pine-700" />
          </div>
          <p className="text-2xl font-mono font-bold text-pine-950 mt-2">
            {dashboard?.qualityScore ?? 70} / 100
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Berdasarkan riwayat inspeksi ahli gizi
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Tawaran Menunggu
            </span>
            <ShoppingBag className="w-4 h-4 text-terracotta-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-terracotta-700 mt-2">
            {dashboard?.proposedOrdersCount ?? 0} Pesanan
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Maks 12 jam untuk menyanggupi
          </span>
        </Card>
      </div>

      {/* Pesanan Terbaru & Ringkasan Pasokan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
            <h3 className="font-serif font-bold text-pine-950 text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pine-700" />
              Pesanan Terkini
            </h3>
            <Link to="/supplier/orders" className="text-xs text-pine-700 hover:text-pine-900 font-semibold flex items-center gap-1">
              Buka Semua Pesanan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-sans">Belum ada pesanan aktif saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {dashboard.recentOrders.map((ord) => {
                const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                  label: ord.status,
                  color: 'neutral',
                };
                return (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {ord.orderNo}
                        </span>
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-stone-800 mt-0.5">
                        {ord.commodityName} • <span className="font-mono">{formatKg(ord.quantityKg)}</span>
                      </p>
                      <p className="text-[11px] text-stone-500 font-sans">
                        Tujuan: {ord.kitchenName} • Nilai: <span className="font-mono font-semibold text-pine-800">{formatRupiah(ord.totalPrice)}</span> • {formatDate(ord.createdAt)}
                      </p>
                    </div>

                    <Link to="/supplier/orders">
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-50">
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
          <Card className="p-5 bg-pine-50/60 border border-pine-200">
            <h4 className="font-serif font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-pine-700" />
              Katalog Pasokan Aktif
            </h4>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-stone-600 font-sans">Tawaran Stok Siap Kirim:</span>
              <span className="font-mono font-bold text-pine-900 text-sm">{dashboard?.activeOffersCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs text-stone-600 font-sans">Jadwal Rencana Panen:</span>
              <span className="font-mono font-bold text-pine-900 text-sm">{dashboard?.harvestPlansCount ?? 0}</span>
            </div>
            <Link to="/supplier/calendar">
              <Button size="sm" className="w-full bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
                Pantau Kalender Kolektif
              </Button>
            </Link>
          </Card>

          <Card className="p-5 bg-white border border-stone-200">
            <h4 className="font-serif font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Riwayat Pembayaran
            </h4>
            <p className="text-xs text-stone-600 font-sans leading-relaxed mb-4">
              Periksa catatan rincian transaksi buku besar dan bukti pencairan hak petani per nomor order.
            </p>
            <Link to="/supplier/payments">
              <Button size="sm" variant="outline" className="w-full border-stone-300 text-stone-700 hover:bg-stone-50 font-sans text-xs">
                Buka Buku Besar Petani
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
