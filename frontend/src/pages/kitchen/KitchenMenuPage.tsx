import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../features/auth/authContext';
import { formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
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
  ChefHat,
  Apple,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecipeItem {
  commodityId: string;
  quantityPerPortion: number | string;
  commodity?: { name: string; unit: string };
}

interface RecipeOption {
  id: string;
  name: string;
  portionMultiplier?: number;
  items: RecipeItem[];
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

  // Dapur pengelola saat ini
  const kitchen = user?.kitchens?.[0];
  const kitchenId = kitchen?.id || '';

  // Navigasi Rentang Minggu (Offset pekan)
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

  // Status Notification Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper Hitung Hari Senin - Minggu berdasarkan offset
  const getWeekDates = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    // Senin = 1, Minggu = 0
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

  // Fetch daftar resep baku standar gizi
  const { data: recipes } = useQuery({
    queryKey: ['recipes-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/recipes');
      return (res.data || res) as RecipeOption[];
    },
  });

  // Fetch menu plans dalam rentang pekan terpilih
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
      setNotification({
        type: 'success',
        message: 'Jadwal sajian resep gizi berhasil ditambahkan ke kalender dapur!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menjadwalkan menu. Pastikan tidak ada menu ganda pada tanggal yang sama.'
      );
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/menu-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-plans'] });
      setNotification({
        type: 'success',
        message: 'Menu sajian berhasil dihapus dari jadwal.',
      });
      setTimeout(() => setNotification(null), 3500);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message:
          err?.response?.data?.error?.message ||
          'Menu tidak dapat dihapus karena permintaan kebutuhan bahan sudah diterbitkan ke pasar.',
      });
      setTimeout(() => setNotification(null), 5000);
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
          'Gagal mengkalkulasi kebutuhan bahan dari jadwal menu.'
      );
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recipeId) {
      setFormError('Silakan pilih salah satu resep standar gizi');
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

  // Agregasi statistik kalender pekan ini
  const totalPortionsScheduled = (menuPlans || []).reduce((acc, p) => acc + (Number(p.portions) || 0), 0);
  const totalMenusScheduled = menuPlans?.length || 0;
  const daysCovered = new Set(
    (menuPlans || []).map((p) => new Date(p.serviceDate).toISOString().split('T')[0])
  ).size;

  const selectedRecipeDetail = recipes?.find((r) => r.id === recipeId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Info */}
      <PageHeader
        title="Perencanaan Menu & Gizi Harian"
        subtitle="Susun siklus menu gizi massal, pantau komposisi takaran bahan pangan, dan hitung kebutuhan komoditas secara otomatis."
        icon={<CalendarDays className="w-6 h-6 text-pine-800" />}
        badge={
          kitchen?.name ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pine-100 text-pine-900 border border-pine-200 flex items-center gap-1.5 shadow-sm">
              <ChefHat className="w-3.5 h-3.5 text-pine-700" />
              {kitchen.name}
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              onClick={openGenerateModal}
              className="w-full sm:w-auto bg-pine-800 hover:bg-pine-900 text-white flex items-center justify-center gap-2 shadow-sm font-semibold transition-all hover:scale-[1.01]"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              Hitung Kebutuhan Bahan (DemandPlanner)
            </Button>
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
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Sajian Terjadwal Pekan Ini
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{totalMenusScheduled}</span>
              <span className="text-xs text-gray-500">menu / {daysCovered} hari terisi</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pine-50 border border-pine-100 flex items-center justify-center text-pine-800">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Volume Porsi Mingguan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {totalPortionsScheduled.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-gray-500">porsi total</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Apple className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Kapasitas Standar Dapur
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">
                {(kitchen?.portionCapacity || 1000).toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-gray-500">porsi / hari operasi</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bar Navigasi Kalender Pekan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pine-50 text-pine-800 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Rentang Layanan
              </span>
              <span className="font-heading font-bold text-gray-900 text-sm">
                {formatDate(startDateStr)} — {formatDate(endDateStr)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Pekan Lalu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeekOffset(0)}
              className={`text-xs font-semibold px-3 ${
                currentWeekOffset === 0
                  ? 'bg-pine-100/70 text-pine-900 font-bold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Minggu Ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Pekan Depan
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Kalender Hari (Senin - Minggu) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center text-status-danger">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">Terjadi kendala saat memuat kalender menu dapur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weekDates.map((dateObj, idx) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            // Cari menu plan pada hari ini
            const dailyPlans =
              menuPlans?.filter(
                (p) => new Date(p.serviceDate).toISOString().split('T')[0] === dateStr
              ) || [];

            return (
              <div
                key={dateStr}
                className={`bg-white border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                  isToday
                    ? 'border-pine-600 ring-2 ring-pine-500/20 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Header Kartu Hari */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                        {dayNames[idx]}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatDate(dateStr)}
                      </span>
                    </div>
                    {isToday && (
                      <span className="px-2.5 py-0.5 bg-pine-800 text-white text-[10px] font-bold rounded-full shadow-xs">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* Isi Menu Hari Terkait */}
                  {dailyPlans.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <Clock className="w-7 h-7 mx-auto mb-2 stroke-1 opacity-40" />
                      <p className="text-xs font-medium">Belum ada menu terjadwal</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Tambahkan resep untuk hari ini
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dailyPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="bg-pine-50/50 border border-pine-200/80 rounded-lg p-3 relative group transition-colors hover:bg-pine-50"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-md bg-white border border-pine-200 text-pine-800 flex items-center justify-center shrink-0 shadow-2xs">
                                <Utensils className="w-3 h-3" />
                              </div>
                              <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                                {plan.recipe?.name || 'Resep Baku'}
                              </h4>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus sajian menu ini?')) {
                                  deleteMenuMutation.mutate(plan.id);
                                }
                              }}
                              className="text-gray-400 hover:text-status-danger p-1 rounded transition-colors"
                              title="Hapus sajian menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-600 bg-white/70 px-2 py-1 rounded border border-pine-100">
                            <span className="font-medium">Porsi Siap Saji:</span>
                            <span className="font-bold text-pine-900 font-mono">
                              {Number(plan.portions).toLocaleString('id-ID')} porsi
                            </span>
                          </div>

                          {/* Komposisi Bahan Baku */}
                          <div className="mt-2.5 pt-2 border-t border-pine-200/60 text-[10px] text-gray-500">
                            <span className="font-semibold text-gray-700 block mb-1">
                              Komposisi Pangan Lokal:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {plan.recipe?.items?.map((it, itemIdx) => (
                                <span
                                  key={itemIdx}
                                  className="bg-white px-1.5 py-0.5 rounded border border-pine-200 text-gray-700 shadow-2xs font-medium"
                                >
                                  {it.commodity?.name}: {(Number(it.quantityPerPortion) * Number(plan.portions)).toFixed(1)} kg
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
                    className="w-full text-xs text-pine-800 hover:bg-pine-50 border border-dashed border-pine-300 hover:border-pine-600 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-pine-700" />
                    Tambah Sajian Menu
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
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Tanggal Layanan Sajian
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pine-600 focus:border-pine-600 shadow-2xs font-medium"
              required
            >
              {recipes?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rincian Komponen Resep Terpilih */}
          {selectedRecipeDetail && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
              <span className="font-semibold text-gray-700 block">
                Komposisi Takaran Resep per Porsi:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedRecipeDetail.items?.map((it, idx) => (
                  <div key={idx} className="bg-white p-1.5 rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-600 truncate">{it.commodity?.name}</span>
                    <span className="font-mono font-bold text-gray-900 ml-1">
                      {Number(it.quantityPerPortion).toFixed(2)} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700 uppercase">
                Jumlah Porsi Sajian
              </label>
              <button
                type="button"
                onClick={() => setPortions(kitchen?.portionCapacity || 1000)}
                className="text-[11px] text-pine-700 font-semibold hover:underline"
              >
                Gunakan Kapasitas Penuh ({kitchen?.portionCapacity || 1000})
              </button>
            </div>
            <Input
              type="number"
              min="1"
              value={portions}
              onChange={(e) => setPortions(parseInt(e.target.value) || 0)}
              required
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Dapur ini dikonfigurasi untuk menyajikan hingga {kitchen?.portionCapacity || 1000} porsi/hari.
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
            <Button
              type="submit"
              isLoading={addMenuMutation.isPending}
              className="bg-pine-800 hover:bg-pine-900 text-white font-semibold"
            >
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Formula Kebutuhan Agregat Bersih
            </div>
            <p>
              Sistem akan menjumlahkan seluruh bahan dari menu terjadwal dan memperhitungkan faktor susut dapur:
            </p>
            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200 font-mono text-[11px] text-emerald-800">
              needQty = porsi × takaran × (1 + susut)
            </div>
            <p className="text-[11px] text-emerald-700">
              Hasil dibulatkan ke atas ke 0,1 kg terdekat dan otomatis dibuat sebagai draf permintaan bahan di pasar lokal.
            </p>
          </div>

          {generateError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded-lg text-sm">
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
            <Button
              type="submit"
              isLoading={generateDemandMutation.isPending}
              className="bg-pine-800 hover:bg-pine-900 text-white font-semibold flex items-center gap-2"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              Mulai Kalkulasi Kebutuhan
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
