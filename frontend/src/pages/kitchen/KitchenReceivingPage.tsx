import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg } from '../../lib/format';
import { ORDER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  CheckCircle2,
  AlertTriangle,
  PackageOpen,
  MapPin,
} from 'lucide-react';

interface InTransitOrder {
  id: string;
  orderNo: string;
  quantity: number;
  status: string;
  commodity: { name: string };
  supplier: { displayName: string; village?: string };
  shipment?: { shipmentNo: string };
  batch?: { id: string; batchCode: string; shippedQuantity: number };
}

export const KitchenReceivingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<InTransitOrder | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [receiveNote, setReceiveNote] = useState<string>('');
  const [receivePhotoUrls, setReceivePhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch order yang sedang dalam perjalanan menuju dapur (status IN_TRANSIT)
  const { data: response, isLoading } = useQuery({
    queryKey: ['kitchen-incoming-orders'],
    queryFn: async () => {
      const res: any = await apiClient.get('/orders?status=IN_TRANSIT');
      return res;
    },
  });

  const incomingOrders: InTransitOrder[] = response?.data || [];

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const receiveMutation = useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string; payload: any }) => {
      return apiClient.post(`/orders/${orderId}/receive`, payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-incoming-orders'] });
      setSelectedOrder(null);
      setReceiveNote('');
      setReceivePhotoUrls([]);
      setSuccessToast(res?.data?.message || 'Penerimaan pesanan berhasil dicatat!');
      setTimeout(() => setSuccessToast(null), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Gagal mencatat penerimaan barang. Periksa toleransi selisih dan catatan.'
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
        setReceivePhotoUrls((prev) => [...prev, res.data.url]);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Gagal mengunggah foto bukti');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmReceive = () => {
    if (!selectedOrder) return;
    setErrorMsg('');

    receiveMutation.mutate({
      orderId: selectedOrder.id,
      payload: {
        receivedQuantity: Number(receivedQuantity),
        note: receiveNote.trim() || undefined,
        photoUrls: receivePhotoUrls,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan Pasokan Bahan Pangan"
        subtitle="Periksa fisik armada yang tiba dan catat serah terima kuantitas riil sebelum dialihkan ke pengawas mutu gizi."
        icon={<PackageOpen className="w-5 h-5 text-pine-800" />}
      />

      {successToast && (
        <div className="p-4 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-soft">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : incomingOrders.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <PackageOpen className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
          <p className="font-semibold text-gray-700">Tidak ada pengiriman dalam perjalanan menuju dapur.</p>
          <p className="text-xs text-gray-400 mt-1">
            Saat koordinator memberangkatkan armada pengiriman, daftar pesanan akan muncul di halaman ini.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomingOrders.map((ord) => {
            const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
              label: ord.status,
              color: 'neutral',
            };

            return (
              <Card
                key={ord.id}
                className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-gray-500 block">
                        {ord.orderNo}
                      </span>
                      <h3 className="font-heading font-bold text-lg text-gray-900">
                        {ord.commodity.name}
                      </h3>
                    </div>
                    <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Asal: <strong>{ord.supplier.displayName}</strong> (Desa {ord.supplier.village || '-'})
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="text-gray-400 block">Kuantitas Dikirim</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">
                        {formatKg(ord.batch?.shippedQuantity || ord.quantity)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Kode Batch Resmi</span>
                      <span className="font-bold text-brand font-mono text-xs truncate block">
                        {ord.batch?.batchCode || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedOrder(ord);
                    setReceivedQuantity(Number(ord.batch?.shippedQuantity || ord.quantity));
                    setReceiveNote('');
                    setReceivePhotoUrls([]);
                    setErrorMsg('');
                  }}
                  className="w-full bg-brand text-white hover:bg-brand-hover text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Catat Penerimaan Fisik
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Form Penerimaan */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Catat Penerimaan Barang
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Nomor Pesanan: <strong>{selectedOrder.orderNo}</strong> ({selectedOrder.commodity.name})
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Kuantitas Diterima Riil (Kg) <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Kuantitas awal dikirim: {formatKg(selectedOrder.batch?.shippedQuantity || selectedOrder.quantity)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Catatan Serah Terima (Wajib jika ada selisih &gt; 2%)
                </label>
                <textarea
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Kondisi kemasan utuh, berat sesuai timbangan dapur..."
                  className="w-full text-xs rounded border border-gray-300 p-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Foto Bukti Serah Terima Fisik (Maks 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700"
                />
                {uploading && <p className="text-xs text-brand mt-1">Mengunggah foto...</p>}

                {receivePhotoUrls.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {receivePhotoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Bukti Serah Terima"
                        className="w-14 h-14 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-status-danger text-xs flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReceive}
                isLoading={receiveMutation.isPending}
                className="bg-brand text-white hover:bg-brand-hover"
              >
                Konfirmasi Terima
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
