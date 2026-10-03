import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { DEMAND_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  Calendar,
  Tag,
  ShieldCheck,
  Send,
  XCircle,
  Truck,
  Users,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNo: string;
  quantity: number | string;
  pricePerUnit: number | string;
  matchScore: number | string;
  status: string;
  offerExpiresAt: string;
  supplier?: {
    displayName: string;
    village?: string;
  };
}

interface DemandDetail {
  id: string;
  kitchenId: string;
  commodityId: string;
  quantity: number | string;
  fulfilledQuantity: number;
  remainingQuantity: number;
  neededDate: string;
  maxPricePerUnit: number | string;
  minQualityScore: number;
  status: string;
  note?: string;
  commodity?: {
    name: string;
    unit: string;
    category: string;
  };
  kitchen?: {
    name: string;
    code: string;
  };
  orders: OrderItem[];
}

export const KitchenDemandDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: demand, isLoading, error } = useQuery({
    queryKey: ['demand-detail', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/demand-requests/${id}`);
      return (res.data || res) as DemandDetail;
    },
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/demand-requests/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-detail', id] });
      alert('Permintaan bahan berhasil diterbitkan!');
    },
    onError: (err: any) => {
      alert(
        err?.response?.data?.error?.message ||
          'Gagal menerbitkan permintaan. Pastikan harga di atas harga dasar produsen.'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/demand-requests/${id}/cancel`, {
        reason: 'Dibatalkan oleh pengelola dapur gizi',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-detail', id] });
      alert('Permintaan berhasil dibatalkan.');
      navigate('/kitchen/demand');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || 'Gagal membatalkan permintaan.');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !demand) {
    return (
      <Card className="p-8 text-center text-status-danger">
        <p>Data permintaan kebutuhan bahan tidak ditemukan.</p>
        <Link to="/kitchen/demand" className="mt-4 inline-block">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </Card>
    );
  }

  const statusMeta = DEMAND_STATUS_LABELS[demand.status] || {
    label: demand.status,
    color: 'neutral',
  };

  const isDraft = demand.status === 'DRAFT';
  const isCancellable =
    demand.status === 'DRAFT' ||
    demand.status === 'OPEN' ||
    demand.status === 'MATCHING' ||
    demand.status === 'PARTIALLY_FULFILLED';

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/kitchen/demand"
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-gray-900">
                {demand.commodity?.name || 'Komoditas Pangan'}
              </h1>
              <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Dapur: {demand.kitchen?.name} ({demand.kitchen?.code})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isDraft && (
            <Button
              onClick={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
              className="bg-brand text-white hover:bg-brand-hover"
            >
              <Send className="w-4 h-4 mr-2" />
              Terbitkan Permintaan
            </Button>
          )}

          {isCancellable && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Batalkan permintaan kebutuhan ini?')) {
                  cancelMutation.mutate();
                }
              }}
              isLoading={cancelMutation.isPending}
              className="border-status-danger text-status-danger hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Batalkan
            </Button>
          )}
        </div>
      </div>

      {/* Ringkasan Angka Kebutuhan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-l-4 border-l-brand">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Target Kebutuhan Bersih
          </span>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {formatKg(demand.quantity)}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">
            Dihitung dari menu porsi harian
          </span>
        </Card>

        <Card className="p-5 bg-white border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Pasokan Terpenuhi
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatKg(demand.fulfilledQuantity || 0)}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">
            Total pesanan yang disanggupi/aktif
          </span>
        </Card>

        <Card className="p-5 bg-white border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Sisa Kebutuhan Terbuka
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {formatKg(demand.remainingQuantity || demand.quantity)}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">
            Kekurangan yang masih dicocokkan
          </span>
        </Card>
      </div>

      {/* Rincian Parameter Kebutuhan */}
      <Card className="p-6">
        <h3 className="font-heading font-bold text-gray-900 text-sm mb-4 pb-2 border-b border-gray-100">
          Parameter Permintaan Pasokan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-500 block">Tanggal Kebutuhan di Dapur</span>
              <span className="font-semibold text-gray-900">
                {formatDate(demand.neededDate)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-500 block">Batas Harga Maksimum</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(demand.maxPricePerUnit)} / kg
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-500 block">Ambang Skor Mutu Pemasok</span>
              <span className="font-semibold text-gray-900">
                ≥ {demand.minQualityScore} poin
              </span>
            </div>
          </div>
        </div>

        {demand.note && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Catatan Khusus: </span>
            {demand.note}
          </div>
        )}
      </Card>

      {/* Bagian Daftar Pesanan Terbentuk (Orders) */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand" />
            <h3 className="font-heading font-bold text-gray-900 text-base">
              Pesanan Pasokan Terkait ({demand.orders?.length || 0})
            </h3>
          </div>
        </div>

        {!demand.orders || demand.orders.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50 stroke-1" />
            <p className="text-sm">
              {isDraft
                ? 'Permintaan masih berstatus DRAFT. Terbitkan permintaan untuk memulai alokasi pencocokan ke pemasok lokal.'
                : 'Belum ada tawaran pesanan yang terbentuk atau sedang diproses oleh sistem pencocokan.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">No. Order</th>
                  <th className="px-4 py-3">Pemasok Lokal</th>
                  <th className="px-4 py-3 text-right">Kuantitas</th>
                  <th className="px-4 py-3 text-right">Harga Satuan</th>
                  <th className="px-4 py-3 text-right">Total Kesepakatan</th>
                  <th className="px-4 py-3 text-center">Skor Cocok</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {demand.orders.map((ord) => {
                  const ordStatusMeta = ORDER_STATUS_LABELS[ord.status] || {
                    label: ord.status,
                    color: 'neutral',
                  };
                  const totalOrderPrice =
                    Number(ord.quantity) * Number(ord.pricePerUnit);

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/75">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {ord.orderNo}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 block">
                          {ord.supplier?.displayName || 'Pemasok'}
                        </span>
                        {ord.supplier?.village && (
                          <span className="text-xs text-gray-400">
                            Desa {ord.supplier.village}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                        {formatKg(ord.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {formatRupiah(ord.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-brand">
                        {formatRupiah(totalOrderPrice)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700">
                        {Number(ord.matchScore).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={ordStatusMeta.color}>
                          {ordStatusMeta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
