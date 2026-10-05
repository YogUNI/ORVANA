import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Plus, Tag, Search, AlertCircle, RefreshCw,
  CheckCircle2, Globe, MapPin, ChevronDown,
} from 'lucide-react';

interface Commodity {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  province: string;
}

interface PriceReference {
  id: string;
  commodityId: string;
  regionId: string;
  referencePrice: number | string;
  floorPrice: number | string;
  ceilingPrice: number | string;
  validFrom: string;
  validTo?: string | null;
  commodity?: Commodity;
  region?: Region;
  setBy?: { id: string; name: string; email: string; role: string };
}

// ───────────────────────────────────────────────────────────
// Komponen utama
// ───────────────────────────────────────────────────────────
export const AdminPricesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // ── State Filter ──
  const [search, setSearch]               = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterRegionId, setFilterRegionId] = useState('');

  // ── State Modal Harga Manual ──
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [commodityId, setCommodityId]   = useState('');
  const [regionId, setRegionId]         = useState('');
  const [floorPrice, setFloorPrice]     = useState<number>(0);
  const [referencePrice, setReferencePrice] = useState<number>(0);
  const [ceilingPrice, setCeilingPrice] = useState<number>(0);
  const [validFrom, setValidFrom]       = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError]       = useState<string | null>(null);

  // ── State Modal Sinkronisasi ──
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // ── Queries ──
  const { data: commodities } = useQuery({
    queryKey: ['commodities-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/commodities');
      return (res.data || res) as Commodity[];
    },
  });

  const { data: regions } = useQuery({
    queryKey: ['regions-all'],
    queryFn: async () => {
      const res: any = await apiClient.get('/regions');
      return (res.data || res) as Region[];
    },
  });

  const { data: priceReferences, isLoading, error } = useQuery({
    queryKey: ['price-references'],
    queryFn: async () => {
      const res: any = await apiClient.get('/price-references');
      return (res.data || res) as PriceReference[];
    },
  });

  // ── Derived: daftar provinsi unik untuk filter ──
  const provinces = useMemo(() => {
    if (!regions) return [];
    return [...new Set(regions.map((r) => r.province))].sort();
  }, [regions]);

  // Wilayah yang tersedia dalam provinsi yang dipilih
  const regionsInProvince = useMemo(() => {
    if (!regions) return [];
    if (!filterProvince) return regions;
    return regions.filter((r) => r.province === filterProvince);
  }, [regions, filterProvince]);

  // ── Filter data tabel ──
  const filteredPrices = useMemo(() => {
    if (!priceReferences) return [];
    return priceReferences.filter((p) => {
      const cName = (p.commodity?.name ?? '').toLowerCase();
      const rName = (p.region?.name ?? '').toLowerCase();
      const rProv = (p.region?.province ?? '').toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = !q || cName.includes(q) || rName.includes(q) || rProv.includes(q);
      const matchProvince = !filterProvince || p.region?.province === filterProvince;
      const matchRegion = !filterRegionId || p.regionId === filterRegionId;
      return matchSearch && matchProvince && matchRegion;
    });
  }, [priceReferences, search, filterProvince, filterRegionId]);

  // Statistik ringkasan
  const activeCount  = filteredPrices.filter((p) => !p.validTo).length;
  const regionCount  = new Set(filteredPrices.map((p) => p.regionId)).size;
  const totalRegions = regions?.length ?? 0;

  // ── Mutation: Tetapkan Harga Manual ──
  const openCreateModal = () => {
    setCommodityId(commodities?.[0]?.id ?? '');
    setRegionId(regions?.[0]?.id ?? '');
    setFloorPrice(6000);
    setReferencePrice(8000);
    setCeilingPrice(12000);
    setValidFrom(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => apiClient.post('/price-references', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-references'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ??
          'Gagal menetapkan harga acuan. Pastikan aturan: Harga Dasar ≤ Acuan ≤ Batas Atas.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!commodityId || !regionId) { setFormError('Komoditas dan wilayah wajib dipilih'); return; }
    if (floorPrice <= 0 || referencePrice <= 0 || ceilingPrice <= 0) {
      setFormError('Seluruh nominal harga harus lebih besar dari Rp 0'); return;
    }
    if (floorPrice > referencePrice) { setFormError('Harga Dasar tidak boleh melebihi Harga Acuan'); return; }
    if (referencePrice > ceilingPrice) { setFormError('Harga Acuan tidak boleh melebihi Batas Atas'); return; }
    mutation.mutate({
      commodityId,
      regionId,
      floorPrice: Number(floorPrice),
      referencePrice: Number(referencePrice),
      ceilingPrice: Number(ceilingPrice),
      validFrom,
    });
  };

  // ── Mutation: Sinkronisasi Harga ──
  const syncMutation = useMutation({
    mutationFn: async (payload: { regionId?: string; syncAll?: boolean }) => {
      const res: any = await apiClient.post('/price-references/sync-market', payload);
      return res.data || res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['price-references'] });
      setIsSyncModalOpen(false);
      setSyncFeedback({ type: 'success', message: data.message ?? 'Sinkronisasi berhasil.' });
      setTimeout(() => setSyncFeedback(null), 8000);
    },
    onError: (err: any) => {
      setIsSyncModalOpen(false);
      setSyncFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message ?? 'Gagal melakukan sinkronisasi harga pasar.',
      });
      setTimeout(() => setSyncFeedback(null), 8000);
    },
  });

  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Standar Harga Acuan Wilayah"
        subtitle="Koridor harga wajar pangan lokal — perlindungan harga dasar produsen & batas atas belanja dapur gizi."
        icon={<Tag className="w-6 h-6 text-pine-800" />}
        actions={
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsSyncModalOpen(true)}
              isLoading={syncMutation.isPending}
              className="w-full sm:w-auto border-pine-700 text-pine-800 hover:bg-pine-50 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Sinkronisasi harga pasar dari Panel Bapanas"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pine-700 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sinkronisasi Harga Bapanas
            </Button>
            <Button
              onClick={openCreateModal}
              className="w-full sm:w-auto bg-pine-800 hover:bg-pine-900 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Tetapkan Harga Manual
            </Button>
          </div>
        }
      />

      {/* Notifikasi Sinkronisasi */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm animate-fadeIn ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-status-danger border border-red-200'
          }`}
        >
          {syncFeedback.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />}
          <span className="font-medium">{syncFeedback.message}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
          <Globe className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="text-xs text-emerald-950 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Integrasi Panel Harga Pangan Nasional (Bapanas) & PIHPS Bank Indonesia</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              Realtime Harian
            </span>
          </div>
          <p className="text-emerald-900">
            Harga diperbarui otomatis setiap pukul 05.00 WIB. Harga antar wilayah disesuaikan berdasarkan
            <strong> Zona Harga Bapanas</strong> (Zona 1 Jawa/Bali · Zona 2 Sumatera/Kalimantan/Sulawesi · Zona 3 Papua).
          </p>
        </div>
      </div>

      {/* Statistik Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Wilayah Terdaftar',  value: totalRegions,  color: 'text-pine-800' },
          { label: 'Wilayah Ditampilkan',       value: regionCount,   color: 'text-blue-700' },
          { label: 'Harga Aktif',              value: activeCount,   color: 'text-emerald-700' },
          { label: 'Total Entri',              value: filteredPrices.length, color: 'text-gray-700' },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Cari komoditas / wilayah */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <Input
              placeholder="Cari komoditas atau wilayah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Provinsi */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
            <select
              value={filterProvince}
              onChange={(e) => {
                setFilterProvince(e.target.value);
                setFilterRegionId(''); // reset region saat ganti provinsi
              }}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand appearance-none"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Filter Wilayah/Kabupaten */}
          <div className="relative">
            <select
              value={filterRegionId}
              onChange={(e) => setFilterRegionId(e.target.value)}
              className="w-full px-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand appearance-none"
            >
              <option value="">Semua Wilayah{filterProvince ? ` di ${filterProvince}` : ''}</option>
              {regionsInProvince.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Chip aktif filter */}
        {(filterProvince || filterRegionId || search) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Filter aktif:</span>
            {search && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">
                "{search}"
              </span>
            )}
            {filterProvince && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {filterProvince}
              </span>
            )}
            {filterRegionId && (
              <span className="px-2 py-0.5 bg-pine-50 text-pine-800 rounded-full border border-pine-200">
                {regions?.find((r) => r.id === filterRegionId)?.name}
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setFilterProvince(''); setFilterRegionId(''); }}
              className="ml-1 text-red-500 hover:text-red-700 font-medium"
            >
              Reset
            </button>
          </div>
        )}
      </Card>

      {/* Tabel Data */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat data harga acuan.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['price-references'] })}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : filteredPrices.length === 0 ? (
        <EmptyState
          title="Tidak Ada Data Harga"
          description={
            filterProvince || filterRegionId || search
              ? 'Tidak ada harga acuan yang cocok dengan filter ini. Coba reset filter.'
              : 'Belum ada harga acuan. Klik "Sinkronisasi Harga Bapanas" untuk mengambil data nasional.'
          }
          actionText="Sinkronisasi Nasional"
          onAction={() => setIsSyncModalOpen(true)}
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Komoditas</th>
                  <th className="px-5 py-3.5">Wilayah</th>
                  <th className="px-5 py-3.5 text-right text-amber-700">Harga Dasar</th>
                  <th className="px-5 py-3.5 text-right text-brand">Harga Acuan</th>
                  <th className="px-5 py-3.5 text-right text-gray-800">Batas Atas</th>
                  <th className="px-5 py-3.5 text-center">Berlaku Sejak</th>
                  <th className="px-5 py-3.5">Sumber</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrices.map((p) => {
                  const isActive = !p.validTo;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {p.commodity?.name ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900 text-sm">{p.region?.name ?? '—'}</div>
                        <div className="text-[11px] text-stone-400">{p.region?.province ?? '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-amber-700">
                        {formatRupiah(p.floorPrice)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-brand">
                        {formatRupiah(p.referencePrice)}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-800">
                        {formatRupiah(p.ceilingPrice)}
                      </td>
                      <td className="px-5 py-4 text-center text-xs text-gray-600">
                        {formatDate(p.validFrom)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Panel Bapanas & PIHPS BI</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge color={isActive ? 'success' : 'neutral'}>
                          {isActive ? 'Aktif' : 'Riwayat'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal Sinkronisasi Harga ─── */}
      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Sinkronisasi Harga Pasar Bapanas"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
            Pilih cakupan sinkronisasi. Data harga akan diperbarui sesuai{' '}
            <strong>Panel Harga Pangan Nasional (Bapanas)</strong> dengan penyesuaian zona antarpulau.
          </div>

          <div className="space-y-3">
            {/* Opsi 1: Sinkronisasi Nasional */}
            <button
              onClick={() => syncMutation.mutate({ syncAll: true })}
              disabled={syncMutation.isPending}
              className="w-full text-left p-4 border-2 border-pine-300 bg-pine-50 hover:bg-pine-100 rounded-xl transition-colors disabled:opacity-60"
            >
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-pine-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-pine-900 text-sm">Sinkronisasi Seluruh Wilayah Nasional</div>
                  <div className="text-xs text-pine-700 mt-0.5">
                    Perbarui harga di semua {totalRegions} wilayah Indonesia — Jawa, Sumatera, Kalimantan,
                    Sulawesi, Bali, NTB, Papua, NTT. Proses ini mungkin memerlukan beberapa detik.
                  </div>
                </div>
              </div>
            </button>

            {/* Opsi 2: Sinkronisasi Satu Wilayah */}
            <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-800 text-sm">Sinkronisasi Satu Wilayah</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  onChange={(e) => {
                    // Filter wilayah dalam select bawah
                    setFilterProvince(e.target.value);
                    setFilterRegionId('');
                  }}
                  value={filterProvince}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  onChange={(e) => setFilterRegionId(e.target.value)}
                  value={filterRegionId}
                >
                  <option value="">Pilih Wilayah</option>
                  {regionsInProvince.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs"
                isLoading={syncMutation.isPending}
                disabled={!filterRegionId || syncMutation.isPending}
                onClick={() => syncMutation.mutate({ regionId: filterRegionId })}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Sinkronisasi Wilayah Ini
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setIsSyncModalOpen(false)}
              disabled={syncMutation.isPending}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal Tetapkan Harga Manual ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tetapkan Harga Acuan Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Komoditas</label>
              <select
                value={commodityId}
                onChange={(e) => setCommodityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                {commodities?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Wilayah</label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.province})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Harga Dasar', hint: 'Min perlindungan petani', val: floorPrice, set: setFloorPrice },
              { label: 'Harga Acuan', hint: 'Harga wajar target',      val: referencePrice, set: setReferencePrice },
              { label: 'Batas Atas',  hint: 'Maks anggaran dapur',     val: ceilingPrice, set: setCeilingPrice },
            ] as const).map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">{field.label}</label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  value={field.val}
                  onChange={(e) => field.set(parseInt(e.target.value) || 0)}
                  required
                />
                <span className="text-[10px] text-gray-500">{field.hint}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Mulai Berlaku Tanggal
            </label>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              required
            />
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
              Simpan Harga Acuan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
