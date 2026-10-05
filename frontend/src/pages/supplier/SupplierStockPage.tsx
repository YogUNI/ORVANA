import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { OFFER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  Sprout,
  Plus,
  Edit2,
  Trash2,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Sparkles,
} from 'lucide-react';

interface Commodity {
  id: string;
  name: string;
  unit: string;
  shelfLifeDays: number;
}

interface PriceReference {
  id: string;
  commodityId: string;
  floorPrice: number | string;
  referencePrice: number | string;
  ceilingPrice: number | string;
}

interface SupplyOffer {
  id: string;
  commodityId: string;
  quantityAvailable: number | string;
  quantityReserved: number | string;
  availableQuantity: number;
  harvestDate: string;
  askingPrice: number | string;
  status: string;
  sourceText?: string;
  commodity?: Commodity;
}

export const SupplierStockPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'STOCKS' | 'MUTATIONS'>('STOCKS');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch Buku Mutasi Stok Persediaan (Inventory Ledger - Pilar 2 P2.1)
  const { data: mutationData, isLoading: isMutationsLoading } = useQuery({
    queryKey: ['my-supply-mutations'],
    queryFn: async () => {
      const res: any = await apiClient.get('/supply-offers/mutations');
      return res.data || res;
    },
    enabled: activeTab === 'MUTATIONS',
  });

  // Modal State Tambah Stok
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCommodityId, setAddCommodityId] = useState('');
  const [addQuantity, setAddQuantity] = useState<number>(50);
  const [addHarvestDate, setAddHarvestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [addPrice, setAddPrice] = useState<number>(0);
  const [addSourceText, setAddSourceText] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Modal State Edit Stok
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SupplyOffer | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editHarvestDate, setEditHarvestDate] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editError, setEditError] = useState<string | null>(null);

  // Notifikasi Aksi
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Fetch Commodities Aktif
  const { data: commodities } = useQuery({
    queryKey: ['commodities-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/commodities');
      return (res.data || res) as Commodity[];
    },
  });

  // Fetch Harga Acuan Wilayah
  const { data: priceReferences } = useQuery({
    queryKey: ['price-references'],
    queryFn: async () => {
      const res: any = await apiClient.get('/price-references');
      return (res.data || res) as PriceReference[];
    },
  });

  // Fetch Stok Milik Pemasok
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-supply-offers', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res: any = await apiClient.get(`/supply-offers?${params.toString()}`);
      return (res.data || res) as SupplyOffer[];
    },
  });

  // Ambil panduan harga untuk komoditas terpilih saat tambah stok
  const selectedPriceRef = priceReferences?.find(
    (p) => p.commodityId === (addCommodityId || commodities?.[0]?.id)
  );

  const openAddModal = () => {
    const defaultCommId = commodities?.[0]?.id || '';
    setAddCommodityId(defaultCommId);
    setAddQuantity(50);
    setAddHarvestDate(new Date().toISOString().split('T')[0]);

    const defaultRef = priceReferences?.find((p) => p.commodityId === defaultCommId);
    setAddPrice(defaultRef ? Number(defaultRef.referencePrice) : 8000);
    setAddSourceText('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCommodityChange = (commId: string) => {
    setAddCommodityId(commId);
    const ref = priceReferences?.find((p) => p.commodityId === commId);
    if (ref) {
      setAddPrice(Number(ref.referencePrice));
    }
  };

  const openEditModal = (offer: SupplyOffer) => {
    setSelectedOffer(offer);
    setEditQuantity(Number(offer.quantityAvailable));
    setEditHarvestDate(new Date(offer.harvestDate).toISOString().split('T')[0]);
    setEditPrice(Number(offer.askingPrice));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/supply-offers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supply-offers'] });
      setIsAddModalOpen(false);
      setNotification({
        type: 'success',
        text: 'Penawaran stok panen berhasil didaftarkan ke pasar dapur gizi!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setAddError(
        err?.response?.data?.error?.message ||
          'Gagal mendaftarkan stok. Pastikan harga ajuan tidak di bawah harga dasar produsen.'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!selectedOffer) return;
      return apiClient.patch(`/supply-offers/${selectedOffer.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supply-offers'] });
      setIsEditModalOpen(false);
      setNotification({
        type: 'success',
        text: 'Penawaran stok berhasil diperbarui.',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setEditError(
        err?.response?.data?.error?.message ||
          'Gagal memperbarui stok. Kuantitas tidak boleh lebih kecil dari kuantitas tereservasi.'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/supply-offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supply-offers'] });
      setNotification({
        type: 'success',
        text: 'Penawaran stok berhasil dibatalkan.',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        text:
          err?.response?.data?.error?.message ||
          'Stok yang sedang tereservasi untuk pesanan tidak dapat dibatalkan.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (addQuantity <= 0) {
      setAddError('Kuantitas panen harus lebih besar dari 0 kg');
      return;
    }
    if (addPrice <= 0) {
      setAddError('Harga ajuan harus lebih besar dari Rp 0');
      return;
    }

    if (selectedPriceRef && addPrice < Number(selectedPriceRef.floorPrice)) {
      setAddError(
        `Harga ajuan tidak boleh di bawah harga dasar petani (${formatRupiah(
          selectedPriceRef.floorPrice
        )}/kg).`
      );
      return;
    }

    createMutation.mutate({
      commodityId: addCommodityId,
      quantityAvailable: Number(addQuantity),
      harvestDate: addHarvestDate,
      askingPrice: Number(addPrice),
      sourceText: addSourceText || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!selectedOffer) return;

    const currentReserved = Number(selectedOffer.quantityReserved);
    if (editQuantity < currentReserved) {
      setEditError(
        `Kuantitas tidak boleh diturunkan di bawah kuantitas yang sedang tereservasi pesanan (${currentReserved} kg).`
      );
      return;
    }

    updateMutation.mutate({
      quantityAvailable: Number(editQuantity),
      harvestDate: editHarvestDate,
      askingPrice: Number(editPrice),
    });
  };

  // Ringkasan Agregat
  const totalStockKg = data?.reduce((sum, item) => sum + Number(item.quantityAvailable), 0) || 0;
  const totalReservedKg =
    data?.reduce((sum, item) => sum + Number(item.quantityReserved), 0) || 0;
  const totalFreeKg = data?.reduce((sum, item) => sum + item.availableQuantity, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Stok Panen Pemasok"
        subtitle="Daftarkan hasil panen atau tangkapan lokal Anda untuk dicocokkan otomatis dengan kebutuhan dapur gizi."
        icon={<Sprout className="w-6 h-6 text-pine-800" />}
        actions={
          <Button onClick={openAddModal} className="w-full sm:w-auto bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Penawaran Stok
          </Button>
        }
      />

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

      {/* Tiga Kartu Metrik Stok */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Stok Terdaftar"
          value={formatKg(totalStockKg)}
          subtext="Seluruh pasokan panen aktif"
          icon={<Layers className="w-5 h-5 text-pine-700" />}
        />

        <StatCard
          label="Tereservasi Pesanan"
          value={formatKg(totalReservedKg)}
          subtext="Sedang disiapkan untuk order dapur"
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
        />

        <StatCard
          label="Stok Bebas Siap Alokasi"
          value={formatKg(totalFreeKg)}
          subtext="Tersedia untuk pesanan baru"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Navigasi Tab Stok Panen vs Buku Mutasi Persediaan */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('STOCKS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'STOCKS'
              ? 'border-pine-800 text-pine-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4 text-pine-800" />
          Katalog Stok Aktif ({data?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('MUTATIONS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MUTATIONS'
              ? 'border-pine-800 text-pine-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-700" />
          Buku Mutasi Stok (Inventory Ledger)
        </button>
      </div>

      {activeTab === 'MUTATIONS' ? (
        /* Tampilan Buku Mutasi Persediaan (Inventory Ledger) */
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-bold text-gray-900 text-base">
                Jurnal Mutasi Stok Persediaan Panen
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Catatan riwayat pergerakan kuantitas stok: panen masuk, reservasi order dapur, dan pelepasan stok bebas.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-pine-100 text-pine-900 rounded-full">
              {mutationData?.totalMutations || 0} Entri Jurnal Terverifikasi
            </span>
          </div>

          {isMutationsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !mutationData?.mutations || mutationData.mutations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
              <p className="text-sm">Belum ada riwayat mutasi stok persediaan yang tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Waktu Mutasi</th>
                    <th className="px-4 py-3">No. Referensi</th>
                    <th className="px-4 py-3">Komoditas</th>
                    <th className="px-4 py-3">Tipe Mutasi</th>
                    <th className="px-4 py-3 text-right">Debit / Kredit (Kg)</th>
                    <th className="px-4 py-3">Keterangan Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mutationData.mutations.map((mut: any) => {
                    const isPositive = mut.type === 'IN' || mut.type === 'RELEASED';
                    return (
                      <tr key={mut.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(mut.date)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 whitespace-nowrap">
                          {mut.referenceNo}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {mut.commodityName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              mut.type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mut.type === 'RESERVED'
                                ? 'bg-amber-100 text-amber-800'
                                : mut.type === 'RELEASED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {mut.typeLabel}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                            isPositive ? 'text-emerald-700' : 'text-amber-800'
                          }`}
                        >
                          {isPositive ? '+' : '-'}{formatKg(mut.quantityKg)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {mut.balanceNote}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter Status */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase">Status Stok:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Semua Status</option>
                {Object.entries(OFFER_STATUS_LABELS).map(([st, meta]) => (
                  <option key={st} value={st}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat penawaran stok pasokan.</p>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Belum Ada Penawaran Stok"
          description="Daftarkan komoditas panen pertama Anda agar dapat dicocokkan dengan pesanan dapur gizi lokal."
          actionText="Tambah Stok Panen"
          onAction={openAddModal}
        />
      ) : (
        <div className="space-y-4">
          {/* Tampilan Desktop: Tabel */}
          <div className="hidden md:block bg-white border border-surface-border rounded-card overflow-hidden shadow-soft">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-surface-muted border-b border-surface-border text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Komoditas</th>
                  <th className="px-5 py-3.5">Tanggal Panen</th>
                  <th className="px-5 py-3.5 text-right">Total Stok</th>
                  <th className="px-5 py-3.5 text-right">Tereservasi</th>
                  <th className="px-5 py-3.5 text-right">Bebas Alokasi</th>
                  <th className="px-5 py-3.5 text-right">Harga Ajuan</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.map((offer) => {
                  const statusMeta = OFFER_STATUS_LABELS[offer.status] || {
                    label: offer.status,
                    color: 'neutral',
                  };
                  const isReserved = Number(offer.quantityReserved) > 0;
                  const isActive = offer.status === 'ACTIVE';

                  return (
                    <tr
                      key={offer.id}
                      className="hover:bg-stone-50/80 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <span className="font-heading font-bold text-stone-900 group-hover:text-brand transition-colors block">
                          {offer.commodity?.name || 'Komoditas'}
                        </span>
                        {offer.sourceText && (
                          <span className="text-[11px] text-stone-400 truncate max-w-xs block mt-0.5">
                            {offer.sourceText}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-stone-600 font-mono text-xs">
                        {formatDate(offer.harvestDate)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-stone-900">
                        {formatKg(offer.quantityAvailable)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-amber-700 font-semibold">
                        {formatKg(offer.quantityReserved)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-emerald-800 font-bold">
                        {formatKg(offer.availableQuantity)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-brand font-mono">
                        {formatRupiah(offer.askingPrice)}/kg
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(offer)}
                              title="Ubah Stok atau Harga"
                              className="text-xs py-1 px-2.5 border-surface-border text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1 text-stone-500" />
                              Ubah
                            </Button>
                          )}

                          {isActive && (
                            <button
                              disabled={isReserved}
                              onClick={() => {
                                if (
                                  confirm('Batalkan penawaran stok pasokan ini?')
                                ) {
                                  cancelMutation.mutate(offer.id);
                                }
                              }}
                              className={`p-1.5 rounded-md border transition-colors ${
                                isReserved
                                  ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                                  : 'border-red-200 text-status-danger hover:bg-red-50 hover:border-red-300'
                              }`}
                              title={
                                isReserved
                                  ? 'Tidak dapat dibatalkan karena ada kuantitas tereservasi pesanan'
                                  : 'Batalkan penawaran stok'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Tampilan Mobile: Kartu (Touch-Friendly dengan Feedback Hover & Border Halus) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {data.map((offer) => {
              const statusMeta = OFFER_STATUS_LABELS[offer.status] || {
                label: offer.status,
                color: 'neutral',
              };
              const isReserved = Number(offer.quantityReserved) > 0;
              const isActive = offer.status === 'ACTIVE';

              return (
                <div
                  key={offer.id}
                  className="p-4 bg-white border border-surface-border rounded-card shadow-soft hover:border-brand-border transition-colors space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-stone-900 text-base">
                        {offer.commodity?.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-pine-700" />
                        <span>Panen: {formatDate(offer.harvestDate)}</span>
                      </div>
                    </div>
                    <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-surface-muted/60 p-2.5 rounded-lg border border-surface-border text-xs">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Total Stok</span>
                      <span className="font-mono font-bold text-stone-900">
                        {formatKg(offer.quantityAvailable)}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-800 block text-[10px]">Tereservasi</span>
                      <span className="font-mono font-bold text-amber-800">
                        {formatKg(offer.quantityReserved)}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-800 block text-[10px]">Bebas Alokasi</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {formatKg(offer.availableQuantity)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-sans">Harga Satuan Ajuan</span>
                      <span className="font-bold text-brand font-mono text-sm">
                        {formatRupiah(offer.askingPrice)}/kg
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(offer)}
                          className="border-surface-border text-stone-700 hover:bg-stone-50 text-xs py-1 px-3"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Ubah
                        </Button>
                      )}
                      {isActive && (
                        <button
                          disabled={isReserved}
                          onClick={() => {
                            if (confirm('Batalkan penawaran stok pasokan ini?')) {
                              cancelMutation.mutate(offer.id);
                            }
                          }}
                          className={`p-2 rounded-md border text-xs transition-colors ${
                            isReserved
                              ? 'border-stone-100 text-stone-300 bg-stone-50 cursor-not-allowed'
                              : 'border-red-200 text-status-danger hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}

      {/* Modal Tambah Stok Pasokan */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftarkan Penawaran Stok Panen"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {addError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{addError}</span>
            </div>
          )}

          {/* Kotak Cerdas NLP: Tulis Stok dengan Kalimat Alami (docs/08 Modul A) */}
          <div className="p-3.5 bg-stone-50 border border-pine-200 rounded-card space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pine-800" />
                <span>Asisten Cerdas: Tulis Stok dengan Kalimat Alami</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-pine-800 bg-pine-100 px-2 py-0.5 rounded-full">
                AI NLP
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Ketik kalimat biasa, contoh: <em className="text-stone-700">"besok panen 200 kg cabai rawit harga 45 ribu"</em> atau <em className="text-stone-700">"lusa ada bayam 2 kwintal"</em>. Sistem akan mengisikan formulir di bawah secara otomatis!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={addSourceText}
                onChange={(e) => setAddSourceText(e.target.value)}
                placeholder="Tulis kalimat hasil panen Anda di sini..."
                className="flex-1 px-3 py-2 border border-surface-border rounded-md text-xs bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-pine-800"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!addSourceText || !addSourceText.trim()) return;
                  try {
                    const res: any = await apiClient.post('/supply-offers/parse-text', { text: addSourceText.trim() });
                    const candidate = res?.data?.candidates?.[0];
                    if (candidate) {
                      if (candidate.commodityId) setAddCommodityId(candidate.commodityId);
                      if (candidate.quantityKg) setAddQuantity(candidate.quantityKg);
                      if (candidate.harvestDate) setAddHarvestDate(candidate.harvestDate);
                      if (candidate.askingPrice) setAddPrice(candidate.askingPrice);
                      alert(`Berhasil diuraikan otomatis: ${candidate.commodityName} sejumlah ${candidate.quantityKg || '-'} kg. Silakan periksa formulir lalu simpan.`);
                    } else if (res?.data?.warnings?.length) {
                      alert(res.data.warnings[0]);
                    }
                  } catch (err: any) {
                    alert('Gagal menguraikan kalimat.');
                  }
                }}
                className="text-xs py-2 px-3 border-pine-700 text-pine-800 hover:bg-pine-50 shrink-0 font-semibold"
              >
                Urai Kalimat
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Pilih Komoditas Pangan
            </label>
            <select
              value={addCommodityId}
              onChange={(e) => handleCommodityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              required
            >
              {commodities?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Kotak Petunjuk Harga Acuan Wilayah */}
          {selectedPriceRef && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Info className="w-4 h-4 text-brand" />
                <span>Panduan Koridor Harga Wilayah:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Harga Dasar (Min):</span>
                  <span className="font-bold text-amber-800">
                    {formatRupiah(selectedPriceRef.floorPrice)}/kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Harga Acuan Target:</span>
                  <span className="font-bold text-brand">
                    {formatRupiah(selectedPriceRef.referencePrice)}/kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Batas Atas Belanja:</span>
                  <span className="font-bold text-gray-700">
                    {formatRupiah(selectedPriceRef.ceilingPrice)}/kg
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Kuantitas Panen (kg)
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Harga Ajuan per kg (Rp)
              </label>
              <Input
                type="number"
                step="100"
                min="100"
                value={addPrice}
                onChange={(e) => setAddPrice(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase">
                Tanggal Panen
              </label>
              {commodities?.find((c) => c.id === addCommodityId)?.shelfLifeDays && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Masa Simpan Segar: {commodities.find((c) => c.id === addCommodityId)?.shelfLifeDays} Hari
                </span>
              )}
            </div>
            <Input
              type="date"
              value={addHarvestDate}
              onChange={(e) => setAddHarvestDate(e.target.value)}
              required
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Dapur gizi massal hanya menerima hasil panen yang berumur maksimal toleransi simpan di atas sejak dipetik.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Keterangan Sumber / Varietas (Opsional)
            </label>
            <Input
              placeholder="Contoh: Lahan Sukamaju blok utara, petik pagi"
              value={addSourceText}
              onChange={(e) => setAddSourceText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              <Sprout className="w-4 h-4 mr-1.5" />
              Daftarkan Stok
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Stok Pasokan */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Ubah Stok: ${selectedOffer?.commodity?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          {selectedOffer && Number(selectedOffer.quantityReserved) > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2">
              <Layers className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Stok ini memiliki alokasi pesanan berjalan sebesar{' '}
                <strong>{formatKg(selectedOffer.quantityReserved)}</strong>. Kuantitas stok tidak boleh
                diturunkan di bawah nilai tersebut.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Kuantitas Stok (kg)
              </label>
              <Input
                type="number"
                step="0.5"
                min={Number(selectedOffer?.quantityReserved) || 0.5}
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Harga Ajuan per kg (Rp)
              </label>
              <Input
                type="number"
                step="100"
                min="100"
                value={editPrice}
                onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Tanggal Panen
            </label>
            <Input
              type="date"
              value={editHarvestDate}
              onChange={(e) => setEditHarvestDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
