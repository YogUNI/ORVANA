import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { Sliders, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [weights, setWeights] = useState({
    distance: 0.3,
    quality: 0.25,
    price: 0.2,
    freshness: 0.15,
    reliability: 0.1,
  });

  const [thresholds, setThresholds] = useState({
    minQualityScore: 60,
    maxDistanceKm: 50,
    maxAllocPerSupplier: 0.6,
  });

  const [operational, setOperational] = useState({
    offerExpiryHours: 2,
    disputeWindowHours: 24,
    shrinkageTolerancePct: 2,
    ewmaAlpha: 0.2,
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all system settings
  const { isLoading, error } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res: any = await apiClient.get('/settings');
      const list = (res.data || res) as SystemSetting[];

      // Inisialisasi state dari backend
      const weightObj = list.find((s) => s.key === 'matching.weights')?.value;
      if (weightObj) {
        setWeights({
          distance: Number(weightObj.distance ?? 0.3),
          quality: Number(weightObj.quality ?? 0.25),
          price: Number(weightObj.price ?? 0.2),
          freshness: Number(weightObj.freshness ?? 0.15),
          reliability: Number(weightObj.reliability ?? 0.1),
        });
      }

      const minScore = list.find((s) => s.key === 'matching.min_quality_score')?.value;
      const maxDist = list.find((s) => s.key === 'matching.max_distance_km')?.value;
      const maxAlloc = list.find((s) => s.key === 'matching.max_allocation_per_supplier')?.value;

      setThresholds({
        minQualityScore: minScore !== undefined ? Number(minScore) : 60,
        maxDistanceKm: maxDist !== undefined ? Number(maxDist) : 50,
        maxAllocPerSupplier: maxAlloc !== undefined ? Number(maxAlloc) : 0.6,
      });

      const expHours = list.find((s) => s.key === 'order.offer_expiry_hours')?.value;
      const dispHours = list.find((s) => s.key === 'dispute.window_hours')?.value;
      const shrinkTol = list.find((s) => s.key === 'qc.shrinkage_tolerance_percent')?.value;
      const ewma = list.find((s) => s.key === 'supplier.ewma_alpha')?.value;

      setOperational({
        offerExpiryHours: expHours !== undefined ? Number(expHours) : 2,
        disputeWindowHours: dispHours !== undefined ? Number(dispHours) : 24,
        shrinkageTolerancePct: shrinkTol !== undefined ? Number(shrinkTol) : 2,
        ewmaAlpha: ewma !== undefined ? Number(ewma) : 0.2,
      });

      return list;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: { key: string; value: any }) => {
      return apiClient.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setStatusMessage({ type: 'success', text: 'Pengaturan berhasil disimpan ke sistem!' });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: any) => {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Gagal menyimpan konfigurasi sistem.',
      });
    },
  });

  const sumWeights = (
    Number(weights.distance) +
    Number(weights.quality) +
    Number(weights.price) +
    Number(weights.freshness) +
    Number(weights.reliability)
  );

  const isWeightValid = Math.abs(sumWeights - 1.0) < 0.0001;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      setStatusMessage({
        type: 'error',
        text: `Jumlah bobot harus tepat 1.0 (saat ini ${sumWeights.toFixed(2)})`,
      });
      return;
    }

    mutation.mutate({
      key: 'matching.weights',
      value: {
        distance: Number(weights.distance),
        quality: Number(weights.quality),
        price: Number(weights.price),
        freshness: Number(weights.freshness),
        reliability: Number(weights.reliability),
      },
    });
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      key: 'matching.min_quality_score',
      value: Number(thresholds.minQualityScore),
    });
    mutation.mutate({
      key: 'matching.max_distance_km',
      value: Number(thresholds.maxDistanceKm),
    });
    mutation.mutate({
      key: 'matching.max_allocation_per_supplier',
      value: Number(thresholds.maxAllocPerSupplier),
    });
  };

  const handleSaveOperational = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      key: 'order.offer_expiry_hours',
      value: Number(operational.offerExpiryHours),
    });
    mutation.mutate({
      key: 'dispute.window_hours',
      value: Number(operational.disputeWindowHours),
    });
    mutation.mutate({
      key: 'qc.shrinkage_tolerance_percent',
      value: Number(operational.shrinkageTolerancePct),
    });
    mutation.mutate({
      key: 'supplier.ewma_alpha',
      value: Number(operational.ewmaAlpha),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-gray-900">
          Konfigurasi Parameter Sistem
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Atur parameter operasional rantai pasok: formula pencocokan cerdas, batas alokasi, toleransi susut, dan jendela sengketa.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-status-danger border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-status-danger">
          <p>Terjadi kesalahan saat memuat konfigurasi sistem.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Bobot Pencocokan Pangan */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="p-2 rounded-lg bg-brand-soft text-brand">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-gray-900">
                  Bobot Algoritma Pencocokan
                </h2>
                <p className="text-xs text-gray-500">
                  Total penjumlahan kelima bobot wajib bernilai tepat 1.0 (100%).
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWeights} className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700">Jarak Tempuh (wJarak)</span>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.distance}
                    onChange={(e) =>
                      setWeights({ ...weights, distance: parseFloat(e.target.value) || 0 })
                    }
                    className="text-right py-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700">Skor Mutu Historis (wMutu)</span>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.quality}
                    onChange={(e) =>
                      setWeights({ ...weights, quality: parseFloat(e.target.value) || 0 })
                    }
                    className="text-right py-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700">Harga Penawaran (wHarga)</span>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.price}
                    onChange={(e) =>
                      setWeights({ ...weights, price: parseFloat(e.target.value) || 0 })
                    }
                    className="text-right py-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700">Tingkat Kesegaran Panen (wSegar)</span>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.freshness}
                    onChange={(e) =>
                      setWeights({ ...weights, freshness: parseFloat(e.target.value) || 0 })
                    }
                    className="text-right py-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-700">Tingkat Keandalan Pengiriman (wAndal)</span>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights.reliability}
                    onChange={(e) =>
                      setWeights({ ...weights, reliability: parseFloat(e.target.value) || 0 })
                    }
                    className="text-right py-1"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-gray-500">Total Bobot: </span>
                  <span
                    className={`font-bold font-mono ${
                      isWeightValid ? 'text-emerald-600' : 'text-status-danger'
                    }`}
                  >
                    {sumWeights.toFixed(2)} / 1.00
                  </span>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isWeightValid || mutation.isPending}
                  isLoading={mutation.isPending}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Bobot
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Ambang Batas & Radius */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="p-2 rounded-lg bg-accent/10 text-accent">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-gray-900">
                  Ambang Batas & Radius Pengiriman
                </h2>
                <p className="text-xs text-gray-500">
                  Kriteria batas penapisan pemasok lokal untuk satu pesanan dapur.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Skor Mutu Minimum Pemasok (0 s.d. 100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholds.minQualityScore}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      minQualityScore: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
                <span className="text-[11px] text-gray-500">Baku: 60 poin</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Radius Maksimum Pemasok (km)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={thresholds.maxDistanceKm}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      maxDistanceKm: parseInt(e.target.value) || 50,
                    })
                  }
                  required
                />
                <span className="text-[11px] text-gray-500">Baku: 50 km dari lokasi dapur gizi</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Batas Alokasi Maksimal Per Pemasok (Cap)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={thresholds.maxAllocPerSupplier}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      maxAllocPerSupplier: parseFloat(e.target.value) || 0.6,
                    })
                  }
                  required
                />
                <span className="text-[11px] text-gray-500">Contoh: 0.6 = maks 60% per pemasok</span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <Button type="submit" size="sm" isLoading={mutation.isPending}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Batas
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 3: Operasional & Waktu Tanggap */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading font-bold text-gray-900">
                  Jendela Waktu & Toleransi Operasional
                </h2>
                <p className="text-xs text-gray-500">
                  Batas waktu tanggap tawaran, penyelesaian sengketa, dan peredaman skor reputasi (EWMA).
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveOperational}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Batas Jawaban Tawaran (Jam)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={operational.offerExpiryHours}
                    onChange={(e) =>
                      setOperational({
                        ...operational,
                        offerExpiryHours: parseInt(e.target.value) || 2,
                      })
                    }
                    required
                  />
                  <span className="text-[11px] text-gray-500">Baku: 2 jam</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Jendela Sengketa QC (Jam)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={operational.disputeWindowHours}
                    onChange={(e) =>
                      setOperational({
                        ...operational,
                        disputeWindowHours: parseInt(e.target.value) || 24,
                      })
                    }
                    required
                  />
                  <span className="text-[11px] text-gray-500">Baku: 24 jam setelah QC</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Toleransi Susut Angkut (%)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={operational.shrinkageTolerancePct}
                    onChange={(e) =>
                      setOperational({
                        ...operational,
                        shrinkageTolerancePct: parseFloat(e.target.value) || 2,
                      })
                    }
                    required
                  />
                  <span className="text-[11px] text-gray-500">Baku: 2% penyusutan wajar</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Faktor Bobot EWMA (α)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="1"
                    value={operational.ewmaAlpha}
                    onChange={(e) =>
                      setOperational({
                        ...operational,
                        ewmaAlpha: parseFloat(e.target.value) || 0.2,
                      })
                    }
                    required
                  />
                  <span className="text-[11px] text-gray-500">Baku: 0.2 (20% bobot hasil terbaru)</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
                <Button type="submit" size="sm" isLoading={mutation.isPending}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Konfigurasi Operasional
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
