import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Star, MessageSquare } from 'lucide-react';

interface SupplierReviewModalProps {
  orderId: string;
  orderNo: string;
  supplierName: string;
  commodityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupplierReviewModal: React.FC<SupplierReviewModalProps> = ({
  orderId,
  orderNo,
  supplierName,
  commodityName,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/orders/${orderId}/reviews`, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-dashboard'] });
      if (onSuccess) onSuccess();
      onClose();
      alert('Ulasan performa pemasok berhasil disimpan. Terima kasih atas umpan balik Anda!');
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal mengirim ulasan. Pastikan pesanan telah selesai diproses.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center pb-3 border-b border-stone-200 mb-4">
          <h3 className="font-serif font-bold text-pine-900 text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Ulas Pasokan & Produsen
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
          <p className="text-stone-500 font-sans">
            Nomor Pesanan: <strong className="text-stone-800 font-mono">{orderNo}</strong>
          </p>
          <p className="text-stone-500 font-sans mt-0.5">
            Komoditas: <strong className="text-stone-800">{commodityName}</strong> • Produsen:{' '}
            <strong className="text-pine-800">{supplierName}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-sans">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2 font-sans">
              Rating Penilaian Mutu & Pengiriman:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono font-bold text-sm text-stone-700">
                {rating} dari 5 Bintang
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1 font-sans">
              Catatan Ulasan / Masukan Mutu (Opsional):
            </label>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Misal: Kesegaran sayur sangat baik, penimbangan presisi, dan kemasan bersih siap olah..."
                className="w-full text-xs rounded-lg border border-stone-300 p-2.5 outline-none focus:border-pine-700 font-sans focus:ring-1 focus:ring-pine-700"
              />
              <MessageSquare className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 bottom-3" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={mutation.isPending}
              className="bg-pine-800 hover:bg-pine-900 text-white font-sans text-xs"
            >
              Simpan Ulasan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
