import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, Scale, X } from 'lucide-react';

interface DisputeModalProps {
  orderId: string;
  orderNo: string;
  commodityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  orderId,
  orderNo,
  commodityName,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<string>('');
  const [evidenceInput, setEvidenceInput] = useState<string>('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const disputeMutation = useMutation({
    mutationFn: async (payload: { reason: string; evidenceUrls?: string[] }) => {
      const res = await apiClient.post(`/orders/${orderId}/disputes`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-payments'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payments-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.error?.message ||
        'Gagal mengajukan sengketa. Pastikan masih dalam batas waktu 48 jam pasca pemeriksaan mutu.';
      setErrorMsg(message);
    },
  });

  const handleAddEvidenceUrl = () => {
    if (!evidenceInput.trim()) return;
    setEvidenceUrls([...evidenceUrls, evidenceInput.trim()]);
    setEvidenceInput('');
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      setErrorMsg('Alasan pengajuan sengketa wajib diisi minimal 20 karakter.');
      return;
    }

    disputeMutation.mutate({
      reason: reason.trim(),
      evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white p-6 shadow-2xl border border-stone-300 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-pine-950">
                Ajukan Sengketa Mutu / Pembayaran
              </h3>
              <p className="text-xs text-stone-500">
                No. Pesanan: <strong className="font-mono text-stone-800">{orderNo}</strong> ({commodityName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 mb-4 font-sans">
          <p className="font-semibold text-stone-800 mb-0.5">Ketentuan Pengajuan Sengketa:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-600">
            <li>Sengketa diajukan maksimal <strong>48 jam</strong> setelah hasil QC diumumkan.</li>
            <li>Status pesanan akan dibekukan (<span className="font-mono text-amber-800 font-bold">DISPUTED</span>) sampai mediasi Admin selesai.</li>
            <li>Admin dapat memutuskan memenangkan salah satu pihak atau menetapkan kuantitas kompromi (<span className="font-mono text-pine-800 font-bold">SPLIT</span>).</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
              Alasan Sengketa Secara Rinci (min. 20 karakter) <span className="text-red-500">*</span>:
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Jelaskan secara objektif ketidaksesuaian penilaian QC, kondisi barang, atau selisih kuantitas..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-sans focus:ring-1 focus:ring-pine-700 outline-hidden"
            />
            <span className="text-[11px] text-stone-400 block mt-0.5">
              Panjang teks: {reason.trim().length}/20 karakter
            </span>
          </div>

          <div>
            <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
              URL Bukti Pendukung (Opsional):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="https://... (link foto / dokumen pendukung)"
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-pine-700 outline-hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEvidenceUrl}
                className="text-xs py-1.5 px-3 border-stone-300 text-stone-700"
              >
                Tambah
              </Button>
            </div>

            {evidenceUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {evidenceUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] bg-stone-100 px-2.5 py-1 rounded font-mono text-stone-700"
                  >
                    <span className="truncate max-w-xs">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceUrl(idx)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs py-2 px-3 border-stone-300 text-stone-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={disputeMutation.isPending}
              className="text-xs py-2 px-4 bg-terracotta-700 hover:bg-terracotta-800 text-white font-semibold"
            >
              Kirim Pengajuan Sengketa
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
