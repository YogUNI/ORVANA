import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Sprout,
  AlertCircle,
} from 'lucide-react';

interface HarvestPlanItem {
  id: string;
  commodityId: string;
  expectedQuantity: number;
  expectedHarvestDate: string;
  notes?: string;
  createdAt: string;
  commodity: {
    id: string;
    name: string;
    unit: string;
  };
}

interface CommodityOption {
  id: string;
  name: string;
}

export const SupplierHarvestPlanPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<HarvestPlanItem | null>(null);

  // Form states
  const [commodityId, setCommodityId] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState<number>(50);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch rencana panen pemasok
  const { data: plansResponse, isLoading } = useQuery<{ data: HarvestPlanItem[] }>({
    queryKey: ['supplier-harvest-plans'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: HarvestPlanItem[] }>('/harvest-plans');
      return res.data;
    },
  });

  // Fetch daftar komoditas aktif
  const { data: commoditiesResponse } = useQuery<{ data: CommodityOption[] }>({
    queryKey: ['commodities-active'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: CommodityOption[] }>('/commodities?isActive=true');
      return res.data;
    },
  });

  const plans = plansResponse?.data || [];
  const commodities = commoditiesResponse?.data || [];

  // Mutasi: Buat atau Update rencana panen
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingPlan) {
        return apiClient.patch(`/harvest-plans/${editingPlan.id}`, payload);
      }
      return apiClient.post('/harvest-plans', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-harvest-plans'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-calendar'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Gagal menyimpan rencana panen';
      setFormError(msg);
    },
  });

  // Mutasi: Hapus rencana panen
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/harvest-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-harvest-plans'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-calendar'] });
    },
  });

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setCommodityId(commodities[0]?.id || '');
    setExpectedQuantity(50);
    // Default 14 hari dari hari ini
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setExpectedHarvestDate(futureDate.toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: HarvestPlanItem) => {
    setEditingPlan(plan);
    setCommodityId(plan.commodityId);
    setExpectedQuantity(plan.expectedQuantity);
    setExpectedHarvestDate(new Date(plan.expectedHarvestDate).toISOString().split('T')[0]);
    setNotes(plan.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodityId) {
      setFormError('Komoditas wajib dipilih');
      return;
    }
    if (expectedQuantity <= 0) {
      setFormError('Estimasi kuantitas harus lebih dari 0 kg');
      return;
    }
    if (!expectedHarvestDate) {
      setFormError('Estimasi tanggal panen wajib diisi');
      return;
    }

    saveMutation.mutate({
      commodityId,
      expectedQuantity: Number(expectedQuantity),
      expectedHarvestDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rencana Panen Pangan Lokal"
        subtitle="Catat proyeksi panen masa depan agar masuk ke dalam kalender kolektif wilayah dan mempermudah estimasi dapur gizi."
        icon={<CalendarDays className="w-6 h-6 text-pine-800" />}
        actions={
          <Button
            onClick={handleOpenCreateModal}
            className="bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs px-4 py-2 flex items-center gap-1.5 shadow-soft"
          >
            <Plus className="w-4 h-4" />
            Tambah Rencana Panen
          </Button>
        }
      />

      {/* Info Card */}
      <Card className="p-4 bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-3">
        <Sprout className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-sans font-semibold">
            Perbedaan Rencana Panen vs Stok Pasokan Aktif:
          </strong>
          <span className="text-amber-800/90 leading-relaxed font-sans">
            <strong>Rencana Panen</strong> digunakan untuk memproyeksikan komoditas yang belum siap dipanen dalam waktu dekat (&gt; 14 hari) agar tampak di Heatmap Permintaan. Saat mendekati masa panen, Anda dapat menerbitkannya sebagai <strong>Stok Pasokan Aktif</strong> untuk langsung dicocokkan dengan pesanan dapur.
          </span>
        </div>
      </Card>

      {/* List Rencana Panen */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center text-stone-500 bg-white">
          <CalendarDays className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-1" />
          <p className="font-serif font-bold text-lg text-pine-900">
            Belum ada rencana panen yang dicatat
          </p>
          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
            Mulailah mencatat jadwal tanam dan estimasi tanggal panen Anda agar permintaan dapur gizi dapat disesuaikan sejak dini.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="mt-4 bg-pine-800 hover:bg-pine-900 text-white text-xs px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Catat Panen Perdana
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card
              key={p.id}
              className="p-5 bg-white border border-stone-200 shadow-soft flex flex-col justify-between hover:border-pine-300 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif font-bold text-lg text-pine-950">
                    {p.commodity.name}
                  </h3>
                  <Badge color="info">Proyeksi Panen</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 font-sans mt-3">
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <span className="text-stone-400">Estimasi Kuantitas:</span>
                    <strong className="font-mono text-pine-900">{formatKg(p.expectedQuantity)}</strong>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-1">
                    <span className="text-stone-400">Target Tanggal Panen:</span>
                    <strong className="font-mono text-stone-800">{formatDate(p.expectedHarvestDate)}</strong>
                  </div>
                  {p.notes && (
                    <div className="pt-1">
                      <span className="text-stone-400 block mb-0.5">Catatan:</span>
                      <p className="italic text-stone-700 bg-stone-50 p-2 rounded border border-stone-100">
                        "{p.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-stone-100">
                <Button
                  variant="outline"
                  onClick={() => handleOpenEditModal(p)}
                  className="text-xs py-1 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Ubah
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus rencana panen ${p.commodity.name}?`)) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  className="text-xs py-1 px-2.5 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Form Rencana Panen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-2xl border border-stone-300 animate-in fade-in zoom-in-95">
            <h3 className="font-serif font-bold text-lg text-pine-950 mb-1">
              {editingPlan ? 'Ubah Rencana Panen' : 'Catat Rencana Panen Baru'}
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-sans">
              Proyeksi pasokan untuk kalender panen terpadu wilayah pangan.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Komoditas Pangan <span className="text-red-500">*</span>
                </label>
                <select
                  value={commodityId}
                  onChange={(e) => setCommodityId(e.target.value)}
                  disabled={!!editingPlan}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-pine-700 outline-hidden bg-white"
                >
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Estimasi Kuantitas Panen (Kg) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={expectedQuantity}
                  onChange={(e) => setExpectedQuantity(parseFloat(e.target.value) || 0)}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Estimasi Tanggal Panen <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={expectedHarvestDate}
                  onChange={(e) => setExpectedHarvestDate(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Varietas lokal, perkiraan luas lahan 500 m2..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-pine-700 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="text-xs py-2 px-3 border-stone-300 text-stone-600"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={saveMutation.isPending}
                  className="text-xs py-2 px-4 bg-pine-800 hover:bg-pine-900 text-white font-semibold"
                >
                  Simpan Rencana
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
