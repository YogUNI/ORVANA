import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface BatchDetail {
  id: string;
  batchCode: string;
  orderId: string;
  originVillage?: string;
  harvestDate: string;
  shippedQuantity: number;
  receivedQuantity: number;
  receivedAt?: string;
  receiveNote?: string;
  order: {
    orderNo: string;
    quantity: number;
    pricePerUnit: number;
    commodity: {
      name: string;
      qualityStandard?: {
        passScore: number;
        checklist: { key: string; label: string; weight: number }[];
      };
    };
    kitchen: { name: string; code: string };
    supplier: { displayName: string; village?: string; qualityScore: number };
  };
}

export const QualityCheckDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [acceptedQty, setAcceptedQty] = useState<number>(0);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [qcNotes, setQcNotes] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const { data: batch, isLoading } = useQuery<BatchDetail>({
    queryKey: ['batch-detail-for-qc', batchId],
    queryFn: async () => {
      const res: any = await apiClient.get(`/batches/${batchId}`);
      return res.data;
    },
    enabled: !!batchId,
  });

  // Inisialisasi skor default saat batch dimuat
  React.useEffect(() => {
    if (batch) {
      const defaultChecklist = batch.order.commodity.qualityStandard?.checklist || [
        { key: 'freshness', label: 'Kesegaran', weight: 40 },
        { key: 'physicalCondition', label: 'Kondisi Fisik / Cacat', weight: 25 },
        { key: 'sizeUniformity', label: 'Keseragaman Ukuran', weight: 15 },
        { key: 'cleanliness', label: 'Kebersihan', weight: 10 },
        { key: 'handlingTemperature', label: 'Penanganan Suhu', weight: 10 },
      ];

      const initialScores: Record<string, number> = {};
      defaultChecklist.forEach((item) => {
        initialScores[item.key] = 85;
      });
      setScores(initialScores);
      setAcceptedQty(batch.receivedQuantity || batch.shippedQuantity);
      setRejectedQty(0);
    }
  }, [batch]);

  // Hitung total skor berbobot real-time
  const checklistItems = batch?.order.commodity.qualityStandard?.checklist || [
    { key: 'freshness', label: 'Kesegaran', weight: 40 },
    { key: 'physicalCondition', label: 'Kondisi Fisik / Cacat', weight: 25 },
    { key: 'sizeUniformity', label: 'Keseragaman Ukuran', weight: 15 },
    { key: 'cleanliness', label: 'Kebersihan', weight: 10 },
    { key: 'handlingTemperature', label: 'Penanganan Suhu', weight: 10 },
  ];

  const calculatedTotalScore = Math.round(
    checklistItems.reduce((sum, item) => {
      const score = scores[item.key] ?? 0;
      return sum + (score * item.weight) / 100;
    }, 0)
  );

  const passScore = batch?.order.commodity.qualityStandard?.passScore ?? 70;
  const isPassingScore = calculatedTotalScore >= passScore;

  const submitQcMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post(`/batches/${batchId}/quality-checks`, payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['quality-queue'] });
      alert(res?.data?.message || 'Pemeriksaan kontrol mutu berhasil disimpan!');
      navigate('/inspector/queue');
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal menyimpan hasil uji mutu. Periksa kuantitas diterima/ditolak dan catatan.'
      );
    },
  });

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res: any = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.data?.url) {
        setPhotoUrls((prev) => [...prev, res.data.url]);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Gagal mengunggah foto bukti');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!batch) return;
    setFormError('');

    const totalReceived = batch.receivedQuantity || batch.shippedQuantity;
    if (Math.abs(acceptedQty + rejectedQty - totalReceived) > 0.001) {
      setFormError(
        `Total kuantitas diterima (${acceptedQty} kg) + ditolak (${rejectedQty} kg) harus tepat sama dengan kuantitas tiba di dapur (${totalReceived} kg)`
      );
      return;
    }

    if (rejectedQty > 0 && (!qcNotes || qcNotes.trim().length < 10)) {
      setFormError('Setiap penolakan bahan makanan wajib disertai catatan alasan minimal 10 karakter');
      return;
    }

    if (calculatedTotalScore < passScore && rejectedQty === 0) {
      setFormError(
        `Skor mutu (${calculatedTotalScore}) berada di bawah ambang lulus (${passScore}). Wajib menolak sebagian atau seluruh kuantitas.`
      );
      return;
    }

    submitQcMutation.mutate({
      checklistScores: scores,
      acceptedQuantity: Number(acceptedQty),
      rejectedQuantity: Number(rejectedQty),
      notes: qcNotes.trim() || undefined,
      photoUrls,
    });
  };

  if (isLoading || !batch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3">
        <Link
          to="/inspector/queue"
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-gray-900">
              Formulir Kontrol Mutu Bahan
            </h1>
            <span className="font-mono text-xs font-bold text-brand bg-brand-soft/40 px-2 py-0.5 rounded border border-brand/20">
              {batch.batchCode}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Komoditas: <strong>{batch.order.commodity.name}</strong> • Dapur: {batch.order.kitchen.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Checklist Penilaian Mutu (2 kolom) */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 bg-white">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base">
                  Checklist Parameter Mutu Standar Gizi
                </h3>
                <p className="text-xs text-gray-500">
                  Beri skor 0 s.d. 100 pada masing-masing indikator mutu.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Ambang Minimum Lulus</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ≥ {passScore} Poin
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {checklistItems.map((item) => {
                const currentVal = scores[item.key] ?? 80;
                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-gray-800">
                        {item.label} <span className="text-gray-400 font-normal">({item.weight}%)</span>
                      </span>
                      <span className="font-mono font-bold text-sm text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {currentVal} Poin
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentVal}
                      onChange={(e) => {
                        setScores((prev) => ({
                          ...prev,
                          [item.key]: Number(e.target.value),
                        }));
                      }}
                      className="w-full accent-brand cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Keputusan Alokasi Kuantitas Lolos vs Ditolak */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="font-heading font-bold text-gray-900 text-base pb-2 border-b border-gray-100">
              Hasil Verifikasi Kuantitas Fisik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Kuantitas Lolos Mutu (Kg) <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={acceptedQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAcceptedQty(val);
                    setRejectedQty(Math.max(0, Number(batch.receivedQuantity) - val));
                  }}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Kuantitas Ditolak / Cacat (Kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={rejectedQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRejectedQty(val);
                    setAcceptedQty(Math.max(0, Number(batch.receivedQuantity) - val));
                  }}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Catatan Hasil Inspeksi Mutu {rejectedQty > 0 && <span className="text-status-danger">* (Wajib min 10 karakter jika ada penolakan)</span>}
              </label>
              <textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                rows={3}
                placeholder="Contoh: Kondisi daun hijau segar, tidak ada residu kimia, kemasan bersih dan higienis..."
                className="w-full text-xs rounded border border-gray-300 p-2.5 outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Foto Bukti Kondisi Fisik Mutu
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadPhoto}
                disabled={uploading}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700"
              />
              {uploading && <p className="text-xs text-brand mt-1">Mengunggah foto...</p>}

              {photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {photoUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Bukti QC"
                      className="w-14 h-14 object-cover rounded border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-status-danger text-xs flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Kolom Kanan: Rekomendasi Hasil & Pratinjau Efek Pembayaran (1 kolom) */}
        <div>
          <Card className="p-6 bg-white space-y-4 sticky top-6">
            <h3 className="font-heading font-bold text-gray-900 text-base pb-2 border-b border-gray-100">
              Ringkasan Rekomendasi
            </h3>

            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider block">
                Skor Mutu Terhitung
              </span>
              <div
                className={`text-4xl font-bold font-mono mt-1 ${
                  isPassingScore ? 'text-emerald-700' : 'text-status-danger'
                }`}
              >
                {calculatedTotalScore}
              </div>
              <span className="text-xs font-semibold mt-1 inline-block">
                {isPassingScore ? (
                  <span className="text-emerald-700">✓ Lolos Standar Gizi</span>
                ) : (
                  <span className="text-status-danger">✕ Di Bawah Ambang Kelulusan</span>
                )}
              </span>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Hasil Keputusan:</span>
                <Badge
                  color={
                    rejectedQty === 0 && isPassingScore
                      ? 'success'
                      : acceptedQty > 0
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {rejectedQty === 0 && isPassingScore
                    ? 'Lolos Penuh (PASS)'
                    : acceptedQty > 0
                    ? 'Lolos Sebagian (PARTIAL)'
                    : 'Ditolak Total (FAIL)'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Kuantitas Tiba:</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatKg(batch.receivedQuantity)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Lolos Diterima:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatKg(acceptedQty)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ditolak:</span>
                <span className="font-mono font-bold text-status-danger">
                  {formatKg(rejectedQty)}
                </span>
              </div>

              <div className="bg-brand-soft/40 p-3 rounded text-[11px] text-gray-700 space-y-1 border border-brand/20">
                <span className="font-bold text-brand block">Efek Buku Besar (Ledger):</span>
                <p>
                  • Pencairan (RELEASE):{' '}
                  <strong>{acceptedQty * Number(batch.order.pricePerUnit)}</strong> Rupiah
                </p>
                {rejectedQty > 0 && (
                  <p>
                    • Pembatalan (VOID):{' '}
                    <strong>{rejectedQty * Number(batch.order.pricePerUnit)}</strong> Rupiah
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              isLoading={submitQcMutation.isPending}
              className="w-full bg-brand text-white hover:bg-brand-hover text-xs font-semibold py-2.5 mt-4"
            >
              Kirim & Terbitkan Hasil QC
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
