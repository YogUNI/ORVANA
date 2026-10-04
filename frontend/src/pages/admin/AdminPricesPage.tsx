import React, { useState } from 'react';
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
import { Plus, Tag, Search, AlertCircle } from 'lucide-react';

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
}

export const AdminPricesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commodityId, setCommodityId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [floorPrice, setFloorPrice] = useState<number>(0);
  const [referencePrice, setReferencePrice] = useState<number>(0);
  const [ceilingPrice, setCeilingPrice] = useState<number>(0);
  const [validFrom, setValidFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch commodities & regions untuk dropdown
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

  // Fetch price references
  const { data: priceReferences, isLoading, error } = useQuery({
    queryKey: ['price-references'],
    queryFn: async () => {
      const res: any = await apiClient.get('/price-references');
      return (res.data || res) as PriceReference[];
    },
  });

  const openCreateModal = () => {
    const defaultCommId = commodities?.[0]?.id || '';
    const defaultRegId = regions?.[0]?.id || '';
    setCommodityId(defaultCommId);
    setRegionId(defaultRegId);
    setFloorPrice(6000);
    setReferencePrice(8000);
    setCeilingPrice(12000);
    setValidFrom(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/price-references', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-references'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menetapkan harga acuan. Pastikan aturan: Harga Dasar ≤ Acuan ≤ Batas Atas.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!commodityId || !regionId) {
      setFormError('Komoditas dan wilayah wajib dipilih');
      return;
    }

    if (floorPrice <= 0 || referencePrice <= 0 || ceilingPrice <= 0) {
      setFormError('Seluruh nominal harga harus lebih besar dari Rp 0');
      return;
    }

    if (floorPrice > referencePrice) {
      setFormError('Harga Dasar tidak boleh melebihi Harga Acuan');
      return;
    }

    if (referencePrice > ceilingPrice) {
      setFormError('Harga Acuan tidak boleh melebihi Batas Atas');
      return;
    }

    mutation.mutate({
      commodityId,
      regionId,
      floorPrice: Number(floorPrice),
      referencePrice: Number(referencePrice),
      ceilingPrice: Number(ceilingPrice),
      validFrom,
    });
  };

  const filteredPrices = priceReferences?.filter((p) => {
    const cName = p.commodity?.name?.toLowerCase() || '';
    const rName = p.region?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return cName.includes(q) || rName.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standar Harga Acuan Wilayah"
        subtitle="Koridor harga wajar pangan lokal: perlindungan harga dasar produsen dan batas atas belanja dapur gizi."
        icon={<Tag className="w-6 h-6 text-pine-800" />}
        actions={
          <Button
            onClick={openCreateModal}
            className="w-full sm:w-auto bg-pine-800 hover:bg-pine-900 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Tetapkan Harga Acuan
          </Button>
        }
      />

      {/* Info Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
        <Tag className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Invarian Perlindungan Petani & Dapur:</strong> Penawaran pemasok di bawah{' '}
          <em>Harga Dasar</em> akan ditolak sistem untuk melindungi pendapatan petani. Permintaan dapur tidak boleh
          melebihi <em>Batas Atas</em> untuk menjaga anggaran dinas. Menetapkan harga baru otomatis menutup masa berlaku
          harga lama.
        </div>
      </div>

      {/* Search Filter */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <Input
            placeholder="Cari komoditas atau nama wilayah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Data Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
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
      ) : !filteredPrices || filteredPrices.length === 0 ? (
        <EmptyState
          title="Belum Ada Harga Acuan"
          description="Tetapkan standar harga dasar, acuan, dan batas atas komoditas per wilayah."
          actionText="Tetapkan Harga"
          onAction={openCreateModal}
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
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrices.map((p) => {
                  const isActive = !p.validTo;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {p.commodity?.name || 'Komoditas'}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {p.region?.name || 'Wilayah'}
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

      {/* Modal Tetapkan Harga Acuan */}
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
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Komoditas
              </label>
              <select
                value={commodityId}
                onChange={(e) => setCommodityId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                {commodities?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Wilayah
              </label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.province})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Harga Dasar
              </label>
              <Input
                type="number"
                min="100"
                step="100"
                value={floorPrice}
                onChange={(e) => setFloorPrice(parseInt(e.target.value) || 0)}
                required
              />
              <span className="text-[10px] text-gray-500">Min perlindungan petani</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Harga Acuan
              </label>
              <Input
                type="number"
                min="100"
                step="100"
                value={referencePrice}
                onChange={(e) => setReferencePrice(parseInt(e.target.value) || 0)}
                required
              />
              <span className="text-[10px] text-gray-500">Harga wajar target</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Batas Atas
              </label>
              <Input
                type="number"
                min="100"
                step="100"
                value={ceilingPrice}
                onChange={(e) => setCeilingPrice(parseInt(e.target.value) || 0)}
                required
              />
              <span className="text-[10px] text-gray-500">Maks anggaran dapur</span>
            </div>
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
