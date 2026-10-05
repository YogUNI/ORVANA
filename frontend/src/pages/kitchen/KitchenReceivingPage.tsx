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
  History,
  Camera,
  Truck,
} from 'lucide-react';

interface InTransitOrder {
  id: string;
  orderNo: string;
  quantity: number;
  status: string;
  createdAt: string;
  commodity: { name: string; category?: string };
  supplier: { displayName: string; village?: string };
  shipment?: { shipmentNo: string; scheduledAt?: string };
  batch?: {
    id: string;
    batchCode: string;
    shippedQuantity: number;
    receivedQuantity?: number;
    receivedAt?: string;
    receiveNote?: string;
  };
}

export const KitchenReceivingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'incoming' | 'history'>('incoming');
  const [selectedOrder, setSelectedOrder] = useState<InTransitOrder | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [receiveNote, setReceiveNote] = useState<string>('');
  const [receivePhotoUrls, setReceivePhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 1. Fetch order yang sedang dalam perjalanan menuju dapur (status IN_TRANSIT)
  const { data: incomingResponse, isLoading: isIncomingLoading } = useQuery({
    queryKey: ['kitchen-incoming-orders'],
    queryFn: async () => {
      const res: any = await apiClient.get('/orders?status=IN_TRANSIT');
      return res;
    },
  });

  // 2. Fetch riwayat order yang telah diterima dapur (status RECEIVED, QC_PASSED, QC_PARTIAL, PAID, COMPLETED)
  const { data: historyResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['kitchen-received-history', activeTab],
    queryFn: async () => {
      const res: any = await apiClient.get('/orders?limit=15');
      return res;
    },
    enabled: activeTab === 'history',
  });

  const incomingOrders: InTransitOrder[] = incomingResponse?.data || [];
  const allOrders: InTransitOrder[] = historyResponse?.data || [];
  const receivedOrders = allOrders.filter((o) =>
    ['RECEIVED', 'QC_PASSED', 'QC_PARTIAL', 'QC_FAILED', 'PAID', 'COMPLETED'].includes(o.status)
  );

  const receiveMutation = useMutation({
    mutationFn: async ({ orderId, payload }: { orderId: string; payload: any }) => {
      return apiClient.post(`/orders/${orderId}/receive`, payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-incoming-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-received-history'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-dashboard'] });
      setSelectedOrder(null);
      setReceiveNote('');
      setReceivePhotoUrls([]);
      setSuccessToast(res?.data?.message || 'Penerimaan fisik barang berhasil diverifikasi!');
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

  // Hitung persentase selisih timbangan riil vs dikirim
  const shipped = Number(selectedOrder?.batch?.shippedQuantity || selectedOrder?.quantity || 0);
  const diffQty = receivedQuantity - shipped;
  const diffPct = shipped > 0 ? (Math.abs(diffQty) / shipped) * 100 : 0;
  const isToleranceExceeded = diffPct > 2.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Penerimaan Pasokan Bahan Pangan"
        subtitle="Verifikasi timbangan fisik armada pangan yang tiba di dapur gizi sebelum dialihkan ke pengawas mutu pangan."
        icon={<PackageOpen className="w-6 h-6 text-pine-800" />}
      />

      {/* Toast Notifikasi Berhasil */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-soft">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tabs Navigasi: Kedatangan Armada & Riwayat */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all ${
            activeTab === 'incoming'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Armada Dalam Perjalanan ({incomingOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Diterima ({receivedOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: KEDATANGAN ARMADA (IN_TRANSIT) */}
      {activeTab === 'incoming' && (
        <>
          {isIncomingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : incomingOrders.length === 0 ? (
            <Card className="p-10 text-center text-stone-500 rounded-3xl bg-white border border-surface-border">
              <PackageOpen className="w-12 h-12 mx-auto mb-3 text-stone-300 stroke-1" />
              <p className="font-heading font-bold text-stone-800 text-base">
                Tidak Ada Armada yang Sedang Menuju Dapur
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Ketika koordinator memberangkatkan pengiriman logistik dari desa, rincian pesanan dan kode batch barcode akan otomatis muncul di sini.
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
                    className="p-5 bg-white border border-surface-border shadow-card rounded-3xl flex flex-col justify-between hover:border-brand/40 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-stone-500 block">
                            {ord.orderNo}
                          </span>
                          <h3 className="font-serif font-bold text-lg text-pine-950 mt-0.5">
                            {ord.commodity.name}
                          </h3>
                        </div>
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-harvest-amber" />
                        <span>
                          Asal: <strong>{ord.supplier.displayName}</strong> (Desa {ord.supplier.village || '-'})
                        </span>
                      </div>

                      <div className="bg-surface-muted/60 p-3.5 rounded-2xl border border-surface-border grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-stone-500 block">Kuantitas Dikirim</span>
                          <span className="font-bold text-pine-950 font-mono text-base">
                            {formatKg(ord.batch?.shippedQuantity || ord.quantity)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-500 block">Kode Batch Resmi</span>
                          <span className="font-bold text-brand font-mono text-xs truncate block mt-0.5">
                            {ord.batch?.batchCode || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-border/60">
                      <Button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setReceivedQuantity(Number(ord.batch?.shippedQuantity || ord.quantity));
                          setReceiveNote('');
                          setReceivePhotoUrls([]);
                          setErrorMsg('');
                        }}
                        className="w-full bg-brand text-white hover:bg-brand-hover text-xs font-heading font-semibold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Catat Timbangan Serah Terima</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: RIWAYAT PESANAN TELAH DITERIMA */}
      {activeTab === 'history' && (
        <>
          {isHistoryLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : receivedOrders.length === 0 ? (
            <Card className="p-8 text-center text-stone-400 rounded-3xl bg-white border border-surface-border">
              <p className="text-xs font-sans">Belum ada riwayat penerimaan sebelumnya.</p>
            </Card>
          ) : (
            <Card className="bg-white border border-surface-border rounded-3xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-muted/60 text-stone-600 font-mono border-b border-surface-border uppercase">
                    <tr>
                      <th className="px-4 py-3">No. Order</th>
                      <th className="px-4 py-3">Komoditas</th>
                      <th className="px-4 py-3">Pemasok</th>
                      <th className="px-4 py-3">Kuantitas Tiba</th>
                      <th className="px-4 py-3">Kode Batch</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/60">
                    {receivedOrders.map((ord) => {
                      const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                        label: ord.status,
                        color: 'neutral',
                      };
                      return (
                        <tr key={ord.id} className="hover:bg-surface-muted/30">
                          <td className="px-4 py-3 font-mono font-bold text-pine-950">{ord.orderNo}</td>
                          <td className="px-4 py-3 font-heading font-semibold text-stone-800">
                            {ord.commodity.name}
                          </td>
                          <td className="px-4 py-3 text-stone-600">{ord.supplier.displayName}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand">
                            {formatKg(ord.batch?.receivedQuantity || ord.quantity)}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                            {ord.batch?.batchCode || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal Dialog Form Serah Terima Timbangan */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white p-6 sm:p-7 shadow-elevated rounded-3xl border border-surface-border animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-5">
            <div>
              <span className="text-[11px] font-mono font-bold text-brand bg-brand-soft px-2.5 py-0.5 rounded border border-brand/20 uppercase">
                Verifikasi Serah Terima Dapur
              </span>
              <h3 className="font-serif font-bold text-xl text-pine-950 mt-1.5">
                Konfirmasi Timbangan & Mutu Fisik
              </h3>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Pesanan <strong>{selectedOrder.orderNo}</strong> • {selectedOrder.commodity.name} dari {selectedOrder.supplier.displayName}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Input Kuantitas */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1 font-heading">
                  Kuantitas Diterima Riil (Kg) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                    className="font-mono text-base font-bold pr-12 rounded-xl"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400">
                    kg
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-stone-500 mt-1.5">
                  <span>Dikirim armada: {formatKg(shipped)}</span>
                  <span className={isToleranceExceeded ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                    Selisih: {diffQty > 0 ? `+${diffQty.toFixed(1)}` : diffQty.toFixed(1)} kg ({diffPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Alert Toleransi */}
              {isToleranceExceeded && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Selisih &gt; 2% Terdeteksi!</span>
                    <p className="text-[11px] mt-0.5 text-amber-800 leading-tight">
                      Sesuai SOP, wajib menyertakan catatan serah terima (minimal 5 karakter) untuk penjelasan timbangan.
                    </p>
                  </div>
                </div>
              )}

              {/* Catatan Serah Terima */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1 font-heading">
                  Catatan Kondisi Serah Terima {isToleranceExceeded && <span className="text-rose-600">*</span>}
                </label>
                <textarea
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Kemasan bersih higienis, timbangan cocok dengan surat jalan koordinator..."
                  className="w-full text-xs rounded-xl border border-stone-300 p-2.5 outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              {/* Upload Foto */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1 font-heading flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-stone-500" />
                  <span>Foto Bukti Timbangan / Kemasan Bahan</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadPhoto}
                  disabled={uploading}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-surface-muted file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                />
                {uploading && <p className="text-[11px] text-brand mt-1 font-mono">Mengunggah foto...</p>}

                {receivePhotoUrls.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {receivePhotoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Bukti Serah Terima"
                        className="w-14 h-14 object-cover rounded-xl border border-stone-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReceive}
                isLoading={receiveMutation.isPending}
                className="text-xs font-semibold px-4"
              >
                Konfirmasi Timbang Terima
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
