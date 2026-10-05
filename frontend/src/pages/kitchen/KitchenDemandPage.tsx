import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { DEMAND_STATUS_LABELS } from '../../lib/labels';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Send,
  Edit2,
  XCircle,
  Eye,
  Filter,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  CalendarDays,
  PackageCheck,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Commodity {
  id: string;
  name: string;
  unit: string;
  category?: string;
}

interface DemandRequest {
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
  commodity?: Commodity;
}

export const KitchenDemandPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State Edit Draf
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<DemandRequest | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQuality, setEditQuality] = useState<number>(60);
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Status Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // NLP State
  const [nlpInputText, setNlpInputText] = useState('');
  const [nlpExtractedItems, setNlpExtractedItems] = useState<any[]>([]);

  // Fetch Demand Requests
  const { data, isLoading, error } = useQuery({
    queryKey: ['demand-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res: any = await apiClient.get(`/demand-requests?${params.toString()}`);
      return (res.data || res) as DemandRequest[];
    },
  });

  const openEditModal = (d: DemandRequest) => {
    setSelectedDemand(d);
    setEditQty(Number(d.quantity));
    setEditPrice(Number(d.maxPricePerUnit));
    setEditQuality(d.minQualityScore);
    setEditNote(d.note || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/demand-requests/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-requests'] });
      setNotification({
        type: 'success',
        text: 'Permintaan bahan pangan berhasil diterbitkan ke pasar lokal!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.error?.message ||
        'Gagal menerbitkan permintaan. Pastikan harga di atas batas dasar petani dan tanggal butuh minimal besok.';
      setNotification({ type: 'error', text: errorMsg });
      setTimeout(() => setNotification(null), 6000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/demand-requests/${id}/cancel`, {
        reason: 'Dibatalkan oleh pengelola dapur gizi',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-requests'] });
      setNotification({
        type: 'success',
        text: 'Permintaan bahan berhasil dibatalkan dan reservasi pasokan telah dilepas.',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Gagal membatalkan permintaan.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDemand) return;
      return apiClient.patch(`/demand-requests/${selectedDemand.id}`, {
        quantity: Number(editQty),
        maxPricePerUnit: Number(editPrice),
        minQualityScore: Number(editQuality),
        note: editNote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-requests'] });
      setIsEditModalOpen(false);
      setNotification({ type: 'success', text: 'Perubahan draf kebutuhan berhasil diperbarui.' });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setEditError(
        err?.response?.data?.error?.message || 'Gagal memperbarui draf permintaan.'
      );
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (editQty <= 0) {
      setEditError('Kuantitas kebutuhan harus lebih besar dari 0');
      return;
    }
    if (editPrice <= 0) {
      setEditError('Batas harga maksimum harus lebih besar dari 0');
      return;
    }
    editMutation.mutate();
  };

  const demands = data || [];

  // Summary Metrics
  const totalVolume = demands.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalFulfilled = demands.reduce((sum, d) => sum + Number(d.fulfilledQuantity || 0), 0);
  const totalRemaining = demands.reduce((sum, d) => sum + Number(d.remainingQuantity || d.quantity || 0), 0);
  const overallPercentage = totalVolume > 0 ? Math.min(100, Math.round((totalFulfilled / totalVolume) * 100)) : 0;
  const draftCount = demands.filter((d) => d.status === 'DRAFT').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Daftar Kebutuhan Komoditas Dapur"
        subtitle="Kelola permintaan pasokan bahan pangan hasil kalkulasi menu, terbitkan ke pasar produsen lokal, dan pantau status alokasi pesanan."
        icon={<Sparkles className="w-6 h-6 text-pine-800" />}
        actions={
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link to="/kitchen/menu" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-pine-700 text-pine-800 hover:bg-pine-50 flex items-center justify-center gap-2 font-semibold shadow-xs"
              >
                <CalendarDays className="w-4 h-4 text-pine-700" />
                Kalender Menu Mingguan
              </Button>
            </Link>
          </div>
        }
      />

      {/* Toast Alert Notification */}
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
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* Asisten Cerdas NLP Perencanaan Bahan Dapur */}
      <div className="bg-white border border-emerald-300 rounded-card p-4 sm:p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Asisten Perencanaan Bahan (AI NLP)
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-pine-800 bg-pine-100 px-2 py-0.5 rounded-full">
            AI Active
          </span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Tulis kebutuhan dapur dengan kalimat biasa, contoh: <em className="text-stone-800 font-medium">"pekan depan butuh 150 kg beras, 40 kg wortel, dan 30 kg ikan lele untuk makan siang"</em>. Sistem akan mengekstrak komoditas dan volumenya secara otomatis.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nlpInputText}
            onChange={(e) => setNlpInputText(e.target.value)}
            placeholder="Ketik kebutuhan bahan dapur Anda..."
            className="flex-1 px-3.5 py-2.5 border border-surface-border rounded-lg text-xs bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-pine-800"
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (!nlpInputText.trim()) return;
              try {
                const res: any = await apiClient.post('/demand-requests/parse-text', { text: nlpInputText.trim() });
                const candidates = res?.data?.candidates || [];
                setNlpExtractedItems(candidates);
                if (candidates.length > 0) {
                  setNotification({
                    type: 'success',
                    text: `AI berhasil mengekstrak ${candidates.length} item bahan baku!`,
                  });
                } else if (res?.data?.warnings?.length) {
                  setNotification({
                    type: 'error',
                    text: res.data.warnings[0],
                  });
                }
              } catch (err: any) {
                setNotification({
                  type: 'error',
                  text: 'Gagal menguraikan kalimat kebutuhan.',
                });
              }
            }}
            className="text-xs py-2.5 px-4 border-pine-700 text-pine-800 hover:bg-pine-50 font-semibold shrink-0"
          >
            Urai Kebutuhan
          </Button>
        </div>

        {nlpExtractedItems.length > 0 && (
          <div className="pt-2 border-t border-emerald-100 space-y-2 animate-fadeIn">
            <span className="text-[11px] font-bold text-pine-900 block">
              Daftar Bahan Terdeteksi ({nlpExtractedItems.length} item):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {nlpExtractedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-stone-900 block">{item.commodityName}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Target: {item.quantityKg ? `${item.quantityKg} kg` : 'Belum ditentukan'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white border border-emerald-300 text-pine-800 px-2 py-0.5 rounded font-semibold">
                    {item.commodityCategory}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-brand-border transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Total Kebutuhan</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-pine-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-950">
            {formatKg(totalVolume)}
          </div>
          <span className="text-[11px] text-stone-500 block">
            {demands.length} item komoditas terdata
          </span>
        </div>

        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-brand-border transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Pasokan Terpenuhi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            {formatKg(totalFulfilled)}
          </div>
          <div className="mt-2 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-700 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-amber-300 transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Sisa Belum Terpenuhi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">
            {formatKg(totalRemaining)}
          </div>
          <span className="text-[11px] text-stone-500 block">
            {overallPercentage}% telah teralokasi
          </span>
        </div>

        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-brand-border transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Draf Siap Diterbitkan</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-pine-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-950">
            {draftCount}
          </div>
          <span className="text-[11px] text-amber-800 font-medium block">
            Perlu diterbitkan ke produsen lokal
          </span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white border border-surface-border rounded-card p-4 shadow-soft flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status kebutuhan"
            className="px-3 py-1.5 border border-surface-border rounded-md text-xs bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-pine-800 font-medium"
          >
            <option value="">Semua Status Permintaan</option>
            {Object.entries(DEMAND_STATUS_LABELS).map(([st, meta]) => (
              <option key={st} value={st}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-500">
          Menampilkan <strong className="text-stone-900 font-mono">{demands.length}</strong> kebutuhan bahan
        </div>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </div>
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Kebutuhan Bahan"
          message="Terjadi kendala saat memuat permintaan bahan dapur dari peladen."
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['demand-requests'] })}
        />
      ) : demands.length === 0 ? (
        <EmptyState
          title="Belum Ada Kebutuhan Bahan"
          description="Jadwalkan menu harian pada kalender pekan ini dan jalankan kalkulasi otomatis kebutuhan bahan baku."
          actionText="Buka Kalender Menu"
          onAction={() => (window.location.href = '/kitchen/menu')}
        />
      ) : (
        <div className="bg-white border border-surface-border rounded-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-surface-muted border-b border-surface-border text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Komoditas Pangan</th>
                  <th className="px-5 py-3.5">Tanggal Butuh</th>
                  <th className="px-5 py-3.5 text-right">Target Kebutuhan</th>
                  <th className="px-5 py-3.5 text-center">Progres Alokasi</th>
                  <th className="px-5 py-3.5 text-right">Batas Maks / kg</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {demands.map((d) => {
                  const statusMeta = DEMAND_STATUS_LABELS[d.status] || {
                    label: d.status,
                    color: 'neutral',
                  };
                  const isDraft = d.status === 'DRAFT';
                  const isCancellable =
                    d.status === 'DRAFT' ||
                    d.status === 'OPEN' ||
                    d.status === 'MATCHING' ||
                    d.status === 'PARTIALLY_FULFILLED';

                  const qty = Number(d.quantity);
                  const fulfilled = Number(d.fulfilledQuantity || 0);
                  const pct = qty > 0 ? Math.min(100, Math.round((fulfilled / qty) * 100)) : 0;

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pine-50 text-pine-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {d.commodity?.name?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight">
                              {d.commodity?.name || 'Komoditas'}
                            </span>
                            {d.commodity?.category && (
                              <span className="text-[11px] text-gray-400">
                                {d.commodity.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-700 whitespace-nowrap font-medium">
                        {formatDate(d.neededDate)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {formatKg(d.quantity)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="max-w-[130px] mx-auto space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-emerald-700 font-semibold">{formatKg(fulfilled)}</span>
                            <span className="text-gray-400">({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {formatRupiah(d.maxPricePerUnit)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => publishMutation.mutate(d.id)}
                                isLoading={publishMutation.isPending}
                                title="Terbitkan Permintaan ke Pasar Produsen"
                                className="bg-pine-800 text-white hover:bg-pine-900 text-xs py-1 px-2.5 min-h-[30px] font-semibold shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                Terbitkan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(d)}
                                title="Ubah Draf Kebutuhan"
                                className="text-xs py-1 px-2 min-h-[30px] border-gray-200 text-gray-700 hover:bg-gray-100"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          <Link to={`/kitchen/demand/${d.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs py-1 px-2.5 min-h-[30px] text-pine-800 hover:bg-pine-50 font-medium"
                              title="Lihat Rincian & Pasokan Terkait"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Rincian
                            </Button>
                          </Link>

                          {isCancellable && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    'Batalkan permintaan kebutuhan ini? Seluruh pesanan aktif yang belum dikirim akan dibatalkan.'
                                  )
                                ) {
                                  cancelMutation.mutate(d.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-status-danger transition-colors rounded-lg hover:bg-red-50"
                              title="Batalkan Permintaan"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Draf Permintaan */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Penyesuaian Kebutuhan: ${selectedDemand?.commodity?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Kuantitas Kebutuhan (kg)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={editQty}
              onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Batas Harga Maksimum per kg (Rp)
            </label>
            <Input
              type="number"
              min="100"
              step="100"
              value={editPrice}
              onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
              required
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Harga tidak boleh lebih rendah dari batas harga dasar petani wilayah (HPP).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Ambang Skor Mutu Minimum Pemasok (0-100)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={editQuality}
              onChange={(e) => setEditQuality(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Catatan Pengelola Dapur (Opsional)
            </label>
            <Input
              placeholder="Contoh: Pengiriman pagi sebelum pukul 07.00 WIB"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={editMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={editMutation.isPending}
              className="bg-pine-800 hover:bg-pine-900 text-white font-semibold"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
