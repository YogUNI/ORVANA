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
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  LayoutDashboard,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Truck,
  ArrowRight,
  Sparkles,
  CalendarDays,
  PackageOpen,
} from 'lucide-react';

interface KitchenDashboardData {
  kitchen: { id: string; name: string; code: string };
  totalDemandKg: number;
  fulfilledKg: number;
  fulfillmentRatePct: number;
  totalSpendingRupiah: number;
  activeOrdersCount: number;
  pendingReceivingCount: number;
  recentOrders: Array<{
    id: string;
    orderNo: string;
    commodityName: string;
    supplierName: string;
    quantityKg: number;
    status: string;
    createdAt: string;
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
      <PageHeader
        title="Dasbor Operasional Dapur Gizi"
        subtitle="Pantau tingkat keterpenuhan kuantitas gizi, realisasi belanja lokal, dan arus pengiriman bahan pangan."
        icon={<LayoutDashboard className="w-6 h-6 text-pine-800" />}
        badge={
          dashboard?.kitchen ? (
            <span className="font-mono text-xs font-bold text-pine-800 bg-pine-100 px-2.5 py-0.5 rounded border border-pine-300">
              {dashboard.kitchen.name} ({dashboard.kitchen.code})
            </span>
          ) : undefined
        }
        actions={
          <>
            <Link to="/kitchen/demand">
              <Button size="sm" className="bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                Kelola Kebutuhan
              </Button>
            </Link>
            <Link to="/kitchen/receiving">
              <Button size="sm" variant="outline" className="border-pine-700 text-pine-800 hover:bg-pine-50 font-sans text-xs">
                <PackageOpen className="w-3.5 h-3.5 mr-1.5" />
                Penerimaan
              </Button>
            </Link>
          </>
        }
      />

      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tingkat Pemenuhan"
          value={`${dashboard?.fulfillmentRatePct ?? 0}%`}
          subtext={`${formatKg(dashboard?.fulfilledKg ?? 0)} dari ${formatKg(dashboard?.totalDemandKg ?? 0)}`}
          icon={<TrendingUp className="w-5 h-5" />}
        />

        <StatCard
          label="Realisasi Belanja"
          value={formatRupiah(dashboard?.totalSpendingRupiah ?? 0)}
          subtext="Telah dicairkan ke petani lokal"
          icon={<Receipt className="w-5 h-5" />}
          highlight={true}
        />

        <StatCard
          label="Pesanan Aktif"
          value={dashboard?.activeOrdersCount ?? 0}
          subtext="Dalam alokasi, penjemputan & transit"
          icon={<ShoppingBag className="w-5 h-5" />}
        />

        <StatCard
          label="Siap Diterima"
          value={dashboard?.pendingReceivingCount ?? 0}
          subtext="Armada sedang meluncur ke dapur"
          icon={<Truck className="w-5 h-5" />}
        />
      </div>

      {/* Pesanan Terbaru & Aksi Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
            <h3 className="font-serif font-bold text-pine-950 text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pine-700" />
              Pesanan Pasokan Pangan Terbaru
            </h3>
            <Link to="/kitchen/demand" className="text-xs text-pine-700 hover:text-pine-900 font-semibold flex items-center gap-1">
              Lihat Kebutuhan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-sans">Belum ada pesanan aktif yang tercatat.</p>
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
                        Pemasok: {ord.supplierName} • {formatDate(ord.createdAt)}
                      </p>
                    </div>

                    <Link to="/kitchen/receiving">
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-50">
                        Detail
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pintasan Cepat Menu & Penerimaan */}
        <div className="space-y-4">
          <Card className="p-5 bg-pine-50/60 border border-pine-200">
            <h4 className="font-serif font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-pine-700" />
              Penyusunan Menu Bergizi
            </h4>
            <p className="text-xs text-stone-600 font-sans leading-relaxed mb-4">
              Susun menu mingguan berbasis porsi anak sekolah untuk secara otomatis mengkalkulasi kebutuhan komoditas lokal.
            </p>
            <Link to="/kitchen/menu">
              <Button size="sm" className="w-full bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
                Buka Perencanaan Menu
              </Button>
            </Link>
          </Card>

          <Card className="p-5 bg-white border border-stone-200">
            <h4 className="font-serif font-bold text-pine-950 text-sm flex items-center gap-2 mb-2">
              <PackageOpen className="w-4 h-4 text-terracotta-600" />
              Penerimaan & Timbang Ulang
            </h4>
            <p className="text-xs text-stone-600 font-sans leading-relaxed mb-4">
              Konfirmasi armada tiba dan verifikasi timbangan nyata sebelum diteruskan ke inspektur mutu.
            </p>
            <Link to="/kitchen/receiving">
              <Button size="sm" variant="outline" className="w-full border-stone-300 text-stone-700 hover:bg-stone-50 font-sans text-xs">
                Cek Penerimaan Pasokan
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
