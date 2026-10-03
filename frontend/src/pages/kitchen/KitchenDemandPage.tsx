import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { DEMAND_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Commodity {
  id: string;
  name: string;
  unit: string;
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

  // Status Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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
        text: 'Permintaan bahan berhasil diterbitkan ke pasar lokal!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.error?.message ||
        'Gagal menerbitkan permintaan. Pastikan harga di atas harga dasar produsen dan tanggal minimal besok.';
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
        text: 'Permintaan berhasil dibatalkan dan reservasi telah dilepas.',
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
      setNotification({ type: 'success', text: 'Perubahan draf kebutuhan berhasil disimpan.' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Daftar Kebutuhan Bahan Dapur
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Pantau status pemenuhan pasokan lokal, kelola draf kebutuhan, dan terbitkan pesanan ke produsen terdekat.
          </p>
        </div>

        <Link to="/kitchen/menu">
          <Button variant="outline" className="border-brand text-brand hover:bg-brand-soft">
            <Sparkles className="w-4 h-4 mr-2" />
            Kalender Menu Mingguan
          </Button>
        </Link>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-status-danger border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 uppercase">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Semua Status</option>
            {Object.entries(DEMAND_STATUS_LABELS).map(([st, meta]) => (
              <option key={st} value={st}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table Data */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kendala saat memuat permintaan bahan.</p>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Belum Ada Kebutuhan Bahan"
          description="Jadwalkan menu harian pada kalender pekan ini dan jalankan kalkulasi otomatis kebutuhan bahan."
          actionText="Buka Kalender Menu"
          onAction={() => (window.location.href = '/kitchen/menu')}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Komoditas</th>
                  <th className="px-5 py-3.5">Tanggal Butuh</th>
                  <th className="px-5 py-3.5 text-right">Kebutuhan</th>
                  <th className="px-5 py-3.5 text-right">Terpenuhi</th>
                  <th className="px-5 py-3.5 text-right">Sisa</th>
                  <th className="px-5 py-3.5 text-right">Batas Harga Maks</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((d) => {
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

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {d.commodity?.name || 'Komoditas'}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(d.neededDate)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">
                        {formatKg(d.quantity)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-700 font-semibold">
                        {formatKg(d.fulfilledQuantity || 0)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-amber-700 font-semibold">
                        {formatKg(d.remainingQuantity || d.quantity)}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-800">
                        {formatRupiah(d.maxPricePerUnit)}/kg
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => publishMutation.mutate(d.id)}
                                isLoading={publishMutation.isPending}
                                title="Terbitkan Permintaan ke Pasar"
                                className="bg-brand text-white hover:bg-brand-hover text-xs py-1 px-2.5 min-h-[32px]"
                              >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                Terbitkan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(d)}
                                title="Ubah Draf Kebutuhan"
                                className="text-xs py-1 px-2 min-h-[32px]"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          <Link to={`/kitchen/demand/${d.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs py-1 px-2 min-h-[32px]"
                              title="Lihat Rincian & Pesanan"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-600" />
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
                              className="p-1.5 text-gray-400 hover:text-status-danger transition-colors rounded"
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
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
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
            <span className="text-[11px] text-gray-500">
              Harga tidak boleh lebih rendah dari batas harga dasar petani wilayah.
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
            <Button type="submit" isLoading={editMutation.isPending}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
