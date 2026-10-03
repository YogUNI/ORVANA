import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { COMMODITY_CATEGORY_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, ShieldCheck, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Commodity {
  id: string;
  name: string;
  category: string;
  unit: string;
  shelfLifeDays: number;
  wastePercent: number | string;
  isActive: boolean;
  qualityStandard?: {
    id: string;
    passScore: number;
    checklist: any;
  } | null;
}

export const AdminCommoditiesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'VEGETABLE',
    unit: 'kg',
    shelfLifeDays: 3,
    wastePercent: 0.1,
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch commodities
  const { data, isLoading, error } = useQuery({
    queryKey: ['commodities', categoryFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('q', search);

      const res: any = await apiClient.get(`/commodities?${params.toString()}`);
      return (res.data || res) as Commodity[];
    },
  });

  const openCreateModal = () => {
    setSelectedCommodity(null);
    setFormData({
      name: '',
      category: 'VEGETABLE',
      unit: 'kg',
      shelfLifeDays: 3,
      wastePercent: 0.1,
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Commodity) => {
    setSelectedCommodity(c);
    setFormData({
      name: c.name,
      category: c.category,
      unit: c.unit,
      shelfLifeDays: c.shelfLifeDays,
      wastePercent: Number(c.wastePercent),
      isActive: c.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedCommodity) {
        return apiClient.patch(`/commodities/${selectedCommodity.id}`, payload);
      }
      return apiClient.post('/commodities', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodities'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menyimpan komoditas. Pastikan nama belum digunakan.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nama komoditas wajib diisi');
      return;
    }
    if (formData.shelfLifeDays < 1) {
      setFormError('Masa simpan minimal 1 hari');
      return;
    }
    if (formData.wastePercent < 0 || formData.wastePercent >= 1) {
      setFormError('Persentase susut harus di antara 0 dan 0.99 (contoh: 0.15 untuk 15%)');
      return;
    }

    mutation.mutate({
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit,
      shelfLifeDays: Number(formData.shelfLifeDays),
      wastePercent: Number(formData.wastePercent),
      isActive: formData.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Katalog Komoditas Pangan
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Kelola daftar komoditas baku, estimasi masa simpan, dan toleransi susut pengolahan.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Komoditas
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <Input
              placeholder="Cari nama komoditas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Semua Kategori</option>
              {Object.entries(COMMODITY_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat katalog komoditas.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['commodities'] })}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Belum Ada Komoditas"
          description="Tambahkan komoditas pangan lokal pertama untuk memulai perancangan menu dapur."
          actionText="Tambah Komoditas"
          onAction={openCreateModal}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Nama Komoditas</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5 text-center">Satuan</th>
                  <th className="px-5 py-3.5 text-center">Masa Simpan</th>
                  <th className="px-5 py-3.5 text-center">Susut Pengolahan</th>
                  <th className="px-5 py-3.5 text-center">Standar Mutu</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-700 font-medium">
                        {COMMODITY_CATEGORY_LABELS[c.category] || c.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs">
                      {c.unit}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-medium text-gray-800">{c.shelfLifeDays}</span> hari
                    </td>
                    <td className="px-5 py-4 text-center font-medium">
                      {(Number(c.wastePercent) * 100).toFixed(0)}%
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.qualityStandard ? (
                        <Link
                          to="/inspector/standards"
                          className="inline-flex items-center gap-1.5 text-xs text-brand font-medium hover:underline"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                          <span>Lulus: ≥{c.qualityStandard.passScore}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge color={c.isActive ? 'success' : 'neutral'}>
                        {c.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        title="Edit Komoditas"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Komoditas */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCommodity ? 'Edit Komoditas Pangan' : 'Tambah Komoditas Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Nama Komoditas
            </label>
            <Input
              placeholder="Contoh: Bayam Segar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              >
                {Object.entries(COMMODITY_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Satuan Ukuran
              </label>
              <Input value={formData.unit} disabled className="bg-gray-100 cursor-not-allowed" />
              <span className="text-[11px] text-gray-500">MVP baku menggunakan satuan kg.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Masa Simpan (Hari)
              </label>
              <Input
                type="number"
                min="1"
                value={formData.shelfLifeDays}
                onChange={(e) =>
                  setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Persen Susut (0 s.d. 0.99)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="0.99"
                value={formData.wastePercent}
                onChange={(e) =>
                  setFormData({ ...formData, wastePercent: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <span className="text-[11px] text-gray-500">
                Contoh 0.15 = 15% susut pembersihan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-brand focus:ring-brand h-4 w-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Komoditas aktif dan dapat dipilih dalam resep/permintaan dapur
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Simpan Data
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
