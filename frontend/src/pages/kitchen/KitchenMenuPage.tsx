import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../features/auth/authContext';
import { formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  CalendarDays,
  Plus,
  Trash2,
  Calculator,
  Utensils,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecipeOption {
  id: string;
  name: string;
  items: Array<{
    commodityId: string;
    quantityPerPortion: number | string;
    commodity?: { name: string; unit: string };
  }>;
}

interface MenuPlan {
  id: string;
  kitchenId: string;
  recipeId: string;
  serviceDate: string;
  portions: number;
  recipe: RecipeOption;
}

export const KitchenMenuPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Dapur terpilih (Kitchen Manager biasanya memiliki 1 dapur)
  const kitchen = user?.kitchens?.[0];
  const kitchenId = kitchen?.id || '';

  // Navigasi Rentang Minggu (Default: Minggu Ini / Hari Ini)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Modal State Tambah Menu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [portions, setPortions] = useState<number>(kitchen?.portionCapacity || 1000);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State Generate Demand
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genFrom, setGenFrom] = useState('');
  const [genTo, setGenTo] = useState('');
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Helper Hitung Hari Senin - Minggu berdasarkan offset
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    // Monday is 1, Sunday is 0
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offset * 7);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const startDateStr = weekDates[0].toISOString().split('T')[0];
  const endDateStr = weekDates[6].toISOString().split('T')[0];

  // Fetch daftar resep baku
  const { data: recipes } = useQuery({
    queryKey: ['recipes-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/recipes');
      return (res.data || res) as RecipeOption[];
    },
  });

  // Fetch menu plans dalam rentang minggu terpilih
  const { data: menuPlans, isLoading, error } = useQuery({
    queryKey: ['menu-plans', kitchenId, startDateStr, endDateStr],
    queryFn: async () => {
      if (!kitchenId) return [];
      const res: any = await apiClient.get(
        `/kitchens/${kitchenId}/menu-plans?from=${startDateStr}&to=${endDateStr}`
      );
      return (res.data || res) as MenuPlan[];
    },
    enabled: !!kitchenId,
  });

  const openAddModal = (dateStr: string) => {
    setServiceDate(dateStr);
    setRecipeId(recipes?.[0]?.id || '');
    setPortions(kitchen?.portionCapacity || 1000);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openGenerateModal = () => {
    setGenFrom(startDateStr);
    setGenTo(endDateStr);
    setGenerateError(null);
    setIsGenerateModalOpen(true);
  };

  const addMenuMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/kitchens/${kitchenId}/menu-plans`, {
        recipeId,
        serviceDate,
        portions: Number(portions),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-plans'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menjadwalkan menu. Pastikan tidak ada menu duplikat pada tanggal ini.'
      );
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/menu-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-plans'] });
    },
    onError: (err: any) => {
      alert(
        err?.response?.data?.error?.message ||
          'Menu tidak dapat dihapus karena permintaan kebutuhan sudah diterbitkan.'
      );
    },
  });

  const generateDemandMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/kitchens/${kitchenId}/demand/generate`, {
        from: genFrom,
        to: genTo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-requests'] });
      setIsGenerateModalOpen(false);
      navigate('/kitchen/demand');
    },
    onError: (err: any) => {
      setGenerateError(
        err?.response?.data?.error?.message ||
          'Gagal mengkalkulasi kebutuhan bahan dari menu.'
      );
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recipeId) {
      setFormError('Silakan pilih salah satu resep baku');
      return;
    }
    if (portions < 1) {
      setFormError('Jumlah porsi harus minimal 1');
      return;
    }

    addMenuMutation.mutate();
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError(null);
    if (!genFrom || !genTo) {
      setGenerateError('Rentang tanggal awal dan akhir wajib diisi');
      return;
    }
    generateDemandMutation.mutate();
  };

  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-gray-900">
              Perencanaan Menu Mingguan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-soft text-brand">
              {kitchen?.name || 'Dapur Gizi'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Susun jadwal resep sajian gizi harian massal dan hitung kebutuhan bahan lokal secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={openGenerateModal}
            className="flex-1 sm:flex-none border-brand text-brand hover:bg-brand-soft"
          >
            <Calculator className="w-4 h-4 mr-2 text-brand" />
            Hitung Kebutuhan Bahan
          </Button>
        </div>
      </div>

      {/* Navigasi Kalender Pekan */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand" />
            <span className="font-heading font-bold text-gray-900 text-sm">
              Pekan: {formatDate(startDateStr)} — {formatDate(endDateStr)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Pekan Lalu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeekOffset(0)}
              className="text-xs text-gray-600 font-semibold"
            >
              Minggu Ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            >
              Pekan Depan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid Menu Hari Senin - Minggu */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kendala saat memuat kalender menu dapur.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weekDates.map((dateObj, idx) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            // Cari menu plan pada hari ini
            const dailyPlans = menuPlans?.filter(
              (p) => new Date(p.serviceDate).toISOString().split('T')[0] === dateStr
            ) || [];

            return (
              <div
                key={dateStr}
                className={`bg-white border rounded-lg p-4 flex flex-col justify-between transition-all ${
                  isToday
                    ? 'border-brand ring-1 ring-brand shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Header Kartu Hari */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100 mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        {dayNames[idx]}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatDate(dateStr)}
                      </span>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* Isi Menu */}
                  {dailyPlans.length === 0 ? (
                    <div className="py-6 text-center text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 stroke-1 opacity-50" />
                      <p className="text-xs">Belum ada menu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dailyPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="bg-emerald-50/60 border border-emerald-100 rounded-md p-3 relative group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-brand shrink-0" />
                              <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                                {plan.recipe?.name || 'Resep Baku'}
                              </h4>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
                                  deleteMenuMutation.mutate(plan.id);
                                }
                              }}
                              className="text-gray-400 hover:text-status-danger p-0.5 rounded transition-colors"
                              title="Hapus sajian menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
                            <span>Kapasitas:</span>
                            <span className="font-bold text-emerald-800 font-mono">
                              {plan.portions} porsi
                            </span>
                          </div>

                          {/* Preview Bahan Baku Komoditas */}
                          <div className="mt-2 pt-1.5 border-t border-emerald-200/50 text-[10px] text-gray-500">
                            <span className="font-semibold block mb-0.5">Komposisi Bahan:</span>
                            <div className="flex flex-wrap gap-1">
                              {plan.recipe?.items?.map((it, itemIdx) => (
                                <span
                                  key={itemIdx}
                                  className="bg-white/80 px-1.5 py-0.5 rounded border border-emerald-100 text-gray-700"
                                >
                                  {it.commodity?.name}: {Number(it.quantityPerPortion).toFixed(2)} kg
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tombol Tambah Menu Hari Tersebut */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddModal(dateStr)}
                    className="w-full text-xs text-brand hover:bg-brand-soft border border-dashed border-gray-300 hover:border-brand"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah Sajian
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Menu Harian */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Menu Gizi Harian"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Tanggal Layanan
            </label>
            <Input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Pilih Resep Standar Gizi
            </label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              required
            >
              {recipes?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Jumlah Porsi Sajian
            </label>
            <Input
              type="number"
              min="1"
              value={portions}
              onChange={(e) => setPortions(parseInt(e.target.value) || 0)}
              required
            />
            <span className="text-[11px] text-gray-500">
              Kapasitas dapur: {kitchen?.portionCapacity || 1000} porsi/hari
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={addMenuMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={addMenuMutation.isPending}>
              Simpan Jadwal Menu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Kalkulasi Kebutuhan Bahan (DemandPlanner) */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Kalkulasi Kebutuhan Bahan Otomatis (DemandPlanner)"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <span>
              Sistem akan menghitung kebutuhan bersih seluruh komoditas pangan dari menu terjadwal:
              <br />
              <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono">
                needQty = porsi × takaran × (1 + susut)
              </code>{' '}
              dibulatkan ke atas 0,1 kg terdekat.
            </span>
          </div>

          {generateError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm">
              {generateError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Dari Tanggal
              </label>
              <Input
                type="date"
                value={genFrom}
                onChange={(e) => setGenFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Sampai Tanggal
              </label>
              <Input
                type="date"
                value={genTo}
                onChange={(e) => setGenTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={generateDemandMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={generateDemandMutation.isPending}>
              <Calculator className="w-4 h-4 mr-1.5" />
              Mulai Hitung Kebutuhan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
