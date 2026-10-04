import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  LayoutDashboard,
  Truck,
  PackageCheck,
  Scale,
  CalendarDays,
  ArrowRight,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface CoordinatorDashboardData {
  profile: {
    id: string;
    organizationName: string;
  } | null;
  totalOrdersReady: number;
  totalReadyKg: number;
  activeShipmentsCount: number;
  totalShipmentsCount: number;
  readyOrders: Array<{
    id: string;
    orderNo: string;
    commodityName: string;
    supplierName: string;
    kitchenName: string;
    quantityKg: number;
    createdAt: string;
  }>;
  recentShipments: Array<{
    id: string;
    shipmentNo: string;
    kitchenName: string;
    scheduledAt: string;
    status: string;
    orderCount: number;
  }>;
}

export const CoordinatorDashboardPage: React.FC = () => {
  const { data: response, isLoading } = useQuery<{ data: CoordinatorDashboardData }>({
    queryKey: ['coordinator-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: CoordinatorDashboardData }>('/dashboard/coordinator');
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
              Dasbor Logistik & Armada Koordinator
            </h1>
            {dashboard?.profile && (
              <span className="font-mono text-xs font-bold text-pine-800 bg-pine-100 px-2.5 py-0.5 rounded border border-pine-300">
                {dashboard.profile.organizationName}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Pantau pesanan siap jemput dari produsen desa dan status perjalanan armada ke dapur gizi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/coordinator/orders">
            <Button size="sm" className="bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
              Konsolidasi Order
            </Button>
          </Link>
          <Link to="/coordinator/shipments">
            <Button size="sm" variant="outline" className="border-pine-700 text-pine-800 hover:bg-pine-50 font-sans text-xs">
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Armada Pengiriman
            </Button>
          </Link>
        </div>
      </div>

      {/* Kartu Ringkasan Logistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Order Siap Jemput
            </span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-pine-950 mt-2">
            {dashboard?.totalOrdersReady ?? 0}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Disanggupi petani (status ACCEPTED)
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Tonase Siap Angkut
            </span>
            <Scale className="w-4 h-4 text-pine-700" />
          </div>
          <p className="text-2xl font-mono font-bold text-pine-950 mt-2">
            {formatKg(dashboard?.totalReadyKg ?? 0)}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Total bobot bahan pangan terkumpul
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Armada Berjalan
            </span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-700 mt-2">
            {dashboard?.activeShipmentsCount ?? 0} Armada
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Sedang penjemputan atau transit
          </span>
        </Card>

        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-start">
            <span className="text-xs font-sans font-bold text-stone-500 uppercase tracking-wider">
              Total Pengiriman
            </span>
            <CalendarDays className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-stone-800 mt-2">
            {dashboard?.totalShipmentsCount ?? 0}
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Riwayat logistik terdata di sistem
          </span>
        </Card>
      </div>

      {/* Rincian Operasional Siap Kirim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Pesanan Menunggu Konsolidasi */}
        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
            <h3 className="font-serif font-bold text-pine-950 text-base flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Pesanan Siap Dikonsolidasikan
            </h3>
            <Link to="/coordinator/orders" className="text-xs text-pine-700 hover:text-pine-900 font-semibold flex items-center gap-1">
              Konsolidasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboard?.readyOrders || dashboard.readyOrders.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-sans">Semua pesanan yang disanggupi telah terkonsolidasi ke armada.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {dashboard.readyOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {ord.orderNo}
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5">
                      {ord.commodityName} • <span className="font-mono">{formatKg(ord.quantityKg)}</span>
                    </p>
                    <p className="text-[11px] text-stone-500 font-sans">
                      Asal: {ord.supplierName} ➔ Tujuan: {ord.kitchenName}
                    </p>
                  </div>

                  <Link to="/coordinator/orders">
                    <Button variant="outline" size="sm" className="text-xs py-1 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-50">
                      Gabung Armada
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Kolom 2: Armada Pengiriman Terkini */}
        <Card className="p-5 bg-white border border-stone-200 shadow-soft">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
            <h3 className="font-serif font-bold text-pine-950 text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-pine-700" />
              Armada Logistik Terbaru
            </h3>
            <Link to="/coordinator/shipments" className="text-xs text-pine-700 hover:text-pine-900 font-semibold flex items-center gap-1">
              Buka Jadwal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!dashboard?.recentShipments || dashboard.recentShipments.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-sans">Belum ada pengiriman armada yang dijadwalkan.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {dashboard.recentShipments.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {s.shipmentNo}
                      </span>
                      <Badge color={s.status === 'ARRIVED' ? 'success' : s.status === 'IN_TRANSIT' ? 'warning' : 'neutral'}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" /> Destinasi: {s.kitchenName}
                    </p>
                    <p className="text-[11px] text-stone-500 font-sans">
                      {s.orderCount} pesanan dimuat • Jadwal: {formatDate(s.scheduledAt)}
                    </p>
                  </div>

                  <Link to={`/coordinator/shipments/${s.id}`}>
                    <Button variant="outline" size="sm" className="text-xs py-1 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-50">
                      Rincian
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
