import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ShieldCheck, Edit, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChecklistItem {
  key: string;
  label: string;
  weight: number;
}

interface QualityStandard {
  id: string;
  commodityId: string;
  passScore: number;
  checklist: ChecklistItem[];
}

interface Commodity {
  id: string;
  name: string;
  category: string;
  unit: string;
  qualityStandard?: QualityStandard | null;
}

export const QualityStandardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);
  const [passScore, setPassScore] = useState<number>(70);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch commodities with their quality standards
  const { data: commodities, isLoading, error } = useQuery({
    queryKey: ['commodities-with-standards'],
    queryFn: async () => {
      const res: any = await apiClient.get('/commodities');
      return (res.data || res) as Commodity[];
    },
  });

  const openEditModal = (c: Commodity) => {
    setSelectedCommodity(c);
    setPassScore(c.qualityStandard?.passScore ?? 70);

    const existingChecklist = c.qualityStandard?.checklist;
    if (existingChecklist && Array.isArray(existingChecklist) && existingChecklist.length > 0) {
      setChecklist(
        existingChecklist.map((item: any) => ({
          key: item.key,
          label: item.label,
          weight: Number(item.weight),
        }))
      );
    } else {
      // Default checklist standar mutu Orvana
      setChecklist([
        { key: 'freshness', label: 'Kesegaran', weight: 40 },
        { key: 'physical_condition', label: 'Kondisi fisik/cacat', weight: 25 },
        { key: 'size_uniformity', label: 'Keseragaman ukuran', weight: 15 },
        { key: 'cleanliness', label: 'Kebersihan', weight: 10 },
        { key: 'handling_temperature', label: 'Penanganan/suhu', weight: 10 },
      ]);
    }

    setFormError(null);
    setIsModalOpen(true);
  };

  const handleWeightChange = (index: number, weight: number) => {
    const updated = [...checklist];
    updated[index].weight = weight;
    setChecklist(updated);
  };

  const totalWeight = checklist.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedCommodity) return;
      return apiClient.put(`/commodities/${selectedCommodity.id}/quality-standard`, {
        passScore: Number(passScore),
        checklist,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commodities-with-standards'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal memperbarui standar mutu. Pastikan jumlah bobot tepat 100.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (passScore < 0 || passScore > 100) {
      setFormError('Skor minimal kelulusan (passScore) harus di antara 0 dan 100');
      return;
    }

    if (!isWeightValid) {
      setFormError(`Jumlah bobot kriteria wajib bernilai tepat 100 (saat ini ${totalWeight})`);
      return;
    }

    mutation.mutate();
  };

  const filteredCommodities = commodities?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standar Mutu & Parameter Pengawasan"
        subtitle="Daftar ambang batas kelulusan (passScore) dan pembobotan checklist uji mutu fisik oleh Ahli Gizi / Pengawas Mutu."
        icon={<ShieldCheck className="w-6 h-6 text-pine-800" />}
      />

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Kriteria Kelulusan QC (docs/04):</strong> Skor uji batch $\ge \text{passScore}$ (baku: 70) dan 
          tanpa penolakan kuantitas akan dinyatakan <strong>Lolos Penuh (PASS)</strong>. Jika skor uji di bawah 
          skor minimal, bahan wajib ditolak sebagian atau seluruhnya.
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <Input
            placeholder="Cari komoditas pangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat data standar mutu.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['commodities-with-standards'] })}
          >
            Coba Lagi
          </Button>
        </Card>
      ) : !filteredCommodities || filteredCommodities.length === 0 ? (
        <EmptyState
          title="Tidak Ada Komoditas Ditemukan"
          description="Silakan periksa filter pencarian Anda."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommodities.map((c) => {
            const qs = c.qualityStandard;
            const items = (qs?.checklist as ChecklistItem[]) || [];

            return (
              <Card key={c.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-gray-900 text-base">
                        {c.name}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        Satuan: {c.unit}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(c)}
                      title="Sesuaikan Standar Mutu"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Ubah
                    </Button>
                  </div>

                  {/* Skor Ambang Kelulusan */}
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-100 rounded">
                    <span className="text-xs font-semibold text-emerald-900">
                      Ambang Kelulusan (Pass Score)
                    </span>
                    <span className="text-sm font-bold font-mono text-brand">
                      ≥ {qs?.passScore ?? 70} poin
                    </span>
                  </div>

                  {/* Checklist Bobot */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Pembobotan Kriteria Checklist (Total: 100):
                    </span>
                    <div className="space-y-1.5">
                      {items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded"
                        >
                          <span className="font-medium text-gray-800">{it.label}</span>
                          <span className="font-mono font-semibold text-gray-700">
                            {it.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Sesuaikan Standar Mutu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Standar Mutu: ${selectedCommodity?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-status-danger border border-red-200 rounded text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Ambang Skor Kelulusan (Pass Score: 0 s.d. 100)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={passScore}
              onChange={(e) => setPassScore(parseInt(e.target.value) || 0)}
              required
            />
            <span className="text-[11px] text-gray-500">
              Standar baku kelulusan kualitas mutu Orvana: 70 poin.
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">
              Bobot Kriteria Checklist Uji Mutu (Wajib Total 100)
            </label>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div key={item.key} className="flex justify-between items-center bg-gray-50 p-2.5 rounded">
                  <span className="text-xs font-medium text-gray-800">{item.label}</span>
                  <div className="w-24 flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.weight}
                      onChange={(e) => handleWeightChange(idx, parseInt(e.target.value) || 0)}
                      className="text-right py-1"
                      required
                    />
                    <span className="text-xs text-gray-500 font-mono">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 rounded flex justify-between items-center text-xs bg-gray-100 font-medium">
              <span>Total Bobot:</span>
              <span
                className={`font-bold font-mono text-sm ${
                  isWeightValid ? 'text-emerald-700' : 'text-status-danger'
                }`}
              >
                {totalWeight} / 100%
              </span>
            </div>
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
            <Button
              type="submit"
              disabled={!isWeightValid || mutation.isPending}
              isLoading={mutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Simpan Standar Mutu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
