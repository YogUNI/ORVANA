import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { DEMAND_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../lib/labels';
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
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Compass,
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
    shelfLifeDays?: number;
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
  const [activeTab, setActiveTab] = useState<'CANDIDATES' | 'ORDERS'>('ORDERS');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: demand, isLoading, error } = useQuery({
    queryKey: ['demand-detail', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/demand-requests/${id}`);
      return (res.data || res) as DemandDetail;
    },
    enabled: !!id,
  });

  const { data: candidatesData, isLoading: isCandidatesLoading } = useQuery({
    queryKey: ['demand-candidates', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/demand-requests/${id}/candidates`);
      return res.data || res;
    },
    enabled: !!id,
  });

  const matchMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/demand-requests/${id}/match`);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['demand-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['demand-candidates', id] });
      setActiveTab('ORDERS');
      setNotification({
        type: 'success',
        message: res?.data?.message || 'Pencocokan dan alokasi pesanan berhasil dijalankan ke produsen!',
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Gagal menjalankan algoritma pencocokan pasokan.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/demand-requests/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-detail', id] });
      setNotification({
        type: 'success',
        message: 'Permintaan bahan berhasil diterbitkan ke pasar lokal!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Gagal menerbitkan permintaan bahan.',
      });
      setTimeout(() => setNotification(null), 5000);
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
      setNotification({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Gagal membatalkan permintaan.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !demand) {
    return (
      <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center text-status-danger">
        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
        <p className="font-semibold">Data permintaan kebutuhan bahan tidak ditemukan.</p>
        <Link to="/kitchen/demand" className="mt-4 inline-block">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </div>
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

  const totalQty = Number(demand.quantity);
  const fulfilledQty = Number(demand.fulfilledQuantity || 0);
  const remainingQty = Number(demand.remainingQuantity || demand.quantity);
  const fulfillmentPct = totalQty > 0 ? Math.min(100, Math.round((fulfilledQty / totalQty) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/kitchen/demand"
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs"
            title="Kembali ke Daftar Kebutuhan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-heading text-gray-900">
                {demand.commodity?.name || 'Komoditas Pangan'}
              </h1>
              <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span>Dapur: <strong className="text-gray-700">{demand.kitchen?.name}</strong> ({demand.kitchen?.code})</span>
              {demand.commodity?.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{demand.commodity.category}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isDraft && (
            <Button
              onClick={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
              className="bg-pine-800 text-white hover:bg-pine-900 shadow-sm font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              Terbitkan Permintaan
            </Button>
          )}

          {isCancellable && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Batalkan permintaan kebutuhan ini? Seluruh alokasi yang belum berlanjut akan dibatalkan.')) {
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

      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-status-danger border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Ringkasan Angka Kebutuhan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs border-l-4 border-l-pine-700">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Target Kebutuhan Bersih
          </span>
          <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {formatKg(demand.quantity)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Dihitung dari menu porsi harian
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Pasokan Terpenuhi
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {fulfillmentPct}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatKg(fulfilledQty)}
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${fulfillmentPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Sisa Kebutuhan Terbuka
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {formatKg(remainingQty)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Kekurangan yang masih dicocokkan
          </span>
        </div>
      </div>

      {/* Rincian Parameter Kebutuhan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-heading font-bold text-gray-900 text-sm mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
          <Compass className="w-4 h-4 text-pine-700" />
          Parameter Permintaan Pasokan Dapur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Jadwal Tiba di Dapur</span>
              <span className="font-semibold text-gray-900">
                {formatDate(demand.neededDate)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Batas Plafon Harga Maksimum</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(demand.maxPricePerUnit)} / kg
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Ambang Skor Mutu Produsen</span>
              <span className="font-semibold text-gray-900">
                ≥ {demand.minQualityScore} poin
              </span>
            </div>
          </div>
        </div>

        {demand.note && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 bg-gray-50/60 p-3 rounded-lg border">
            <span className="font-semibold text-gray-800">Catatan Pengelola Dapur: </span>
            {demand.note}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'border-pine-800 text-pine-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          Pesanan Pasokan Terkait ({demand.orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('CANDIDATES')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'CANDIDATES'
              ? 'border-pine-800 text-pine-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Kandidat Pemasok & Penilaian ({candidatesData?.candidates?.length || 0})
        </button>
      </div>

      {activeTab === 'CANDIDATES' ? (
        /* Tab Kandidat Pemasok */
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-bold text-gray-900 text-base">
                Pratinjau Hasil Algoritma Pencocokan
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Peringkat pemasok lokal berdasarkan formula multi-kriteria: Jarak (30%), Mutu (30%), Harga Acuan (20%), Kesegaran (10%), Keandalan (10%).
              </p>
            </div>

            {demand.status !== 'FULFILLED' && demand.status !== 'CANCELLED' && (
              <Button
                onClick={() => matchMutation.mutate()}
                isLoading={matchMutation.isPending}
                className="bg-pine-800 text-white hover:bg-pine-900 text-xs font-semibold shadow-xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-emerald-300" />
                Jalankan Alokasi Pesanan
              </Button>
            )}
          </div>

          {/* Panel Diagnosa Pencocokan (Smart Matching Diagnostics) */}
          {candidatesData?.diagnostics && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Compass className="w-4 h-4 text-pine-800" />
                  <span>Diagnosa Transparansi Pasokan:</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {candidatesData.diagnostics.eligibleCandidatesCount} Lolos Kriteria
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    {candidatesData.diagnostics.eliminatedCount} Tereliminasi
                  </span>
                </div>
              </div>

              {candidatesData.diagnostics.eliminatedCount > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <p className="text-xs text-slate-600 font-medium">
                    Penawaran stok yang tidak dapat dialokasikan untuk jadwal kebutuhan ini:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {candidatesData.diagnostics.eliminatedOffers.map((elim: any) => (
                      <div key={elim.offerId} className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
                        <div className="flex justify-between items-start mb-1">
                          <strong className="text-slate-900 font-semibold">{elim.supplierName}</strong>
                          <span className="text-slate-500 font-mono text-[11px]">{formatRupiah(elim.askingPrice)}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                          {elim.reasons.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isCandidatesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : !candidatesData?.candidates || candidatesData.candidates.length === 0 ? (
            <div className="py-8 text-center text-gray-500 bg-amber-50/50 border border-amber-200 rounded-xl p-6">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="text-sm font-semibold text-slate-800">
                Tidak ada pemasok lokal yang memenuhi kriteria untuk tanggal kebutuhan ini.
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Silakan cek kotak diagnosa di atas untuk melihat penawaran petani yang tereliminasi (misal: melewati masa simpan {demand.commodity?.shelfLifeDays || 3} hari atau di luar pagu anggaran Rp {Number(demand.maxPricePerUnit).toLocaleString('id-ID')}).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Pemasok Lokal</th>
                    <th className="px-4 py-3 text-right">Jarak</th>
                    <th className="px-4 py-3 text-right">Stok Bebas</th>
                    <th className="px-4 py-3 text-right">Batas Alokasi (Cap 60%)</th>
                    <th className="px-4 py-3 text-right">Harga Ajuan</th>
                    <th className="px-4 py-3 text-center">Komponen Skor</th>
                    <th className="px-4 py-3 text-center">Skor Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidatesData.candidates.map((cand: any, idx: number) => (
                    <tr key={cand.offerId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-pine-100 text-pine-900 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900 block leading-tight">
                              {cand.supplierName}
                            </span>
                            {cand.village && (
                              <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" /> Desa {cand.village}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                        {cand.distanceKm.toFixed(1)} km
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                        {formatKg(cand.availableQuantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-pine-800 whitespace-nowrap">
                        {formatKg(cand.cappedQuantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 whitespace-nowrap">
                        {formatRupiah(cand.askingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono whitespace-nowrap">
                        D:{(cand.scoreComponents.sDistance * 100).toFixed(0)} |
                        Q:{(cand.scoreComponents.sQuality * 100).toFixed(0)} |
                        P:{(cand.scoreComponents.sPrice * 100).toFixed(0)} |
                        F:{(cand.scoreComponents.sFreshness * 100).toFixed(0)} |
                        R:{(cand.scoreComponents.sReliability * 100).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-base text-emerald-700 whitespace-nowrap">
                        {cand.scoreComponents.matchScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Tab Orders */
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-pine-800" />
              <h3 className="font-heading font-bold text-gray-900 text-sm">
                Rincian Pesanan Diterbitkan ({demand.orders?.length || 0})
              </h3>
            </div>
          </div>

          {!demand.orders || demand.orders.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
              <p className="text-sm">
                {isDraft
                  ? 'Permintaan masih berstatus DRAFT. Terbitkan permintaan untuk memulai alokasi pencocokan ke pemasok lokal.'
                  : 'Belum ada tawaran pesanan yang terbentuk atau sedang diproses oleh sistem pencocokan.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
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
                <tbody className="divide-y divide-gray-100">
                  {demand.orders.map((ord) => {
                    const ordStatusMeta = ORDER_STATUS_LABELS[ord.status] || {
                      label: ord.status,
                      color: 'neutral',
                    };
                    const totalOrderPrice =
                      Number(ord.quantity) * Number(ord.pricePerUnit);

                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {ord.orderNo}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900 block leading-tight">
                            {ord.supplier?.displayName || 'Pemasok'}
                          </span>
                          {ord.supplier?.village && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> Desa {ord.supplier.village}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                          {formatKg(ord.quantity)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                          {formatRupiah(ord.pricePerUnit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-pine-800 whitespace-nowrap">
                          {formatRupiah(totalOrderPrice)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700 whitespace-nowrap">
                          {Number(ord.matchScore).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
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
        </div>
      )}
    </div>
  );
};
