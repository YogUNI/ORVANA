import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah } from '../../lib/format';
import { ORDER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  MapPin,
  Sparkles,
  Scale,
} from 'lucide-react';
import { DisputeModal } from '../../features/disputes/DisputeModal';

interface OrderItem {
  id: string;
  orderNo: string;
  quantity: number;
  pricePerUnit: number;
  matchScore: number;
  status: string;
  offerExpiresAt: string;
  rejectionReason?: string;
  totalPrice: number;
  commodity: {
    name: string;
    unit: string;
  };
  kitchen: {
    name: string;
    code: string;
    address?: string;
    regionId: string;
  };
}

// Komponen hitung mundur respons 12 jam yang presisi
const ExpirationCountdown: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>(() => calculateTimeLeft(expiresAt));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  function calculateTimeLeft(target: string) {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { hours, minutes, seconds, isExpired: false };
  }

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-danger bg-red-50 px-2 py-0.5 rounded">
        <AlertCircle className="w-3.5 h-3.5" />
        Waktu Habis
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 2;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
        isUrgent
          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
          : 'bg-blue-50 text-blue-800'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      Sisa: {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
};

export const SupplierOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PROPOSED' | 'ACTIVE' | 'HISTORY'>('PROPOSED');
  const [selectedOrderForReject, setSelectedOrderForReject] = useState<OrderItem | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<OrderItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Fetch daftar order
  const { data: response, isLoading } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: async () => {
      const res: any = await apiClient.get('/orders?limit=50');
      return res;
    },
  });

  const orders: OrderItem[] = response?.data || [];

  // Filter per tab
  const proposedOrders = orders.filter((o) => o.status === 'PROPOSED');
  const activeOrders = orders.filter((o) =>
    ['ACCEPTED', 'CONSOLIDATED', 'IN_TRANSIT', 'RECEIVED'].includes(o.status)
  );
  const historyOrders = orders.filter((o) =>
    ['QC_PASSED', 'QC_PARTIAL', 'QC_FAILED', 'PAID', 'DISPUTED', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(
      o.status
    )
  );

  // Mutation Accept
  const acceptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiClient.post(`/orders/${orderId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      alert('Pesanan berhasil disanggupi! Dana pembayaran telah dicadangkan di sistem buku besar.');
    },
    onError: (err: any) => {
      alert(
        err?.response?.data?.error?.message ||
          'Gagal menyanggupi tawaran pesanan. Pastikan batas waktu belum terlewati.'
      );
    },
  });

  // Mutation Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      return apiClient.post(`/orders/${orderId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      setSelectedOrderForReject(null);
      setRejectionReason('');
      alert('Tawaran pesanan ditolak. Kuantitas stok telah dilepas untuk alokasi ulang.');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || 'Gagal menolak pesanan.');
    },
  });

  const handleConfirmReject = () => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setRejectError('Alasan penolakan minimal 5 karakter');
      return;
    }
    if (!selectedOrderForReject) return;

    rejectMutation.mutate({
      orderId: selectedOrderForReject.id,
      reason: rejectionReason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Tawaran & Pesanan Pangan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola penawaran yang dicocokkan oleh dapur gizi dan pantau komitmen pengiriman lokal.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('PROPOSED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'PROPOSED'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Tawaran Baru
            {proposedOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                {proposedOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-brand" />
            Sedang Berjalan ({activeOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'HISTORY'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Riwayat Selesai ({historyOrders.length})
          </button>
        </div>
      </div>

      {/* Konten Tab */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : activeTab === 'PROPOSED' ? (
        /* Tab Tawaran Baru (PROPOSED) */
        proposedOrders.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
            <p className="font-semibold text-gray-700">Tidak ada tawaran baru saat ini.</p>
            <p className="text-xs text-gray-400 mt-1">
              Saat dapur gizi menerbitkan permintaan kebutuhan bahan pangan, sistem akan mencocokkan stok aktif Anda.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposedOrders.map((ord) => (
              <Card
                key={ord.id}
                className="p-5 border-l-4 border-l-amber-500 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-500 block">
                        {ord.orderNo}
                      </span>
                      <h3 className="font-heading font-bold text-lg text-gray-900">
                        {ord.commodity.name}
                      </h3>
                    </div>
                    <ExpirationCountdown expiresAt={ord.offerExpiresAt} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Tujuan: <strong>{ord.kitchen.name}</strong> ({ord.kitchen.code})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs mb-4">
                    <div>
                      <span className="text-gray-400 block">Kuantitas</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">
                        {formatKg(ord.quantity)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Harga Tawaran</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">
                        {formatRupiah(ord.pricePerUnit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Total Komitmen</span>
                      <span className="font-bold text-brand font-mono text-sm">
                        {formatRupiah(ord.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          `Sanggupi tawaran pesanan ${ord.commodity.name} sejumlah ${formatKg(
                            ord.quantity
                          )} dengan total ${formatRupiah(ord.totalPrice)}?`
                        )
                      ) {
                        acceptMutation.mutate(ord.id);
                      }
                    }}
                    isLoading={acceptMutation.isPending}
                    className="flex-1 bg-brand text-white hover:bg-brand-hover text-xs font-semibold py-2"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Sanggupi Tawaran
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrderForReject(ord);
                      setRejectError('');
                      setRejectionReason('');
                    }}
                    className="border-gray-200 text-gray-600 hover:text-status-danger hover:border-red-200 text-xs py-2"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Tolak
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : activeTab === 'ACTIVE' ? (
        /* Tab Pesanan Sedang Berjalan */
        activeOrders.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Truck className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
            <p className="font-semibold text-gray-700">Belum ada pesanan aktif.</p>
            <p className="text-xs text-gray-400 mt-1">
              Pesanan yang telah disanggupi akan diproses oleh koordinator wilayah untuk penjemputan dan pengiriman ke dapur.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((ord) => {
              const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                label: ord.status,
                color: 'neutral',
              };
              return (
                <Card key={ord.id} className="p-4 bg-white shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {ord.orderNo}
                        </span>
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </div>
                      <p className="font-heading font-bold text-base text-gray-900 mt-0.5">
                        {ord.commodity.name} - {formatKg(ord.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tujuan: {ord.kitchen.name} • Kesepakatan: {formatRupiah(ord.totalPrice)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block">Status Operasional</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {ord.status === 'ACCEPTED'
                          ? 'Menunggu Penjemputan Koordinator'
                          : ord.status === 'CONSOLIDATED'
                          ? 'Tergabung dalam Pengiriman'
                          : ord.status === 'IN_TRANSIT'
                          ? 'Sedang Dalam Perjalanan'
                          : 'Telah Diterima di Dapur'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Tab Riwayat Selesai */
        historyOrders.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p className="font-semibold text-gray-700">Belum ada riwayat pesanan selesai.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">No. Order</th>
                  <th className="px-4 py-3">Komoditas</th>
                  <th className="px-4 py-3">Dapur Tujuan</th>
                  <th className="px-4 py-3 text-right">Kuantitas</th>
                  <th className="px-4 py-3 text-right">Total Komitmen</th>
                  <th className="px-4 py-3 text-center">Status Akhir</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyOrders.map((ord) => {
                  const statusMeta = ORDER_STATUS_LABELS[ord.status] || {
                    label: ord.status,
                    color: 'neutral',
                  };
                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/75">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {ord.orderNo}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ord.commodity.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {ord.kitchen.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                        {formatKg(ord.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-brand">
                        {formatRupiah(ord.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(ord.status === 'PAID' || ord.status === 'QC_FAILED') && (
                          <Button
                            variant="outline"
                            onClick={() => setDisputeOrder(ord)}
                            className="text-xs py-1 px-2.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            <Scale className="w-3.5 h-3.5 mr-1" />
                            Sengketa
                          </Button>
                        )}
                        {ord.status === 'DISPUTED' && (
                          <span className="text-xs font-semibold text-amber-700">
                            Dalam Mediasi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal Dialog Penolakan Tawaran */}
      {selectedOrderForReject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Tolak Tawaran Pesanan
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Nomor Pesanan: <strong>{selectedOrderForReject.orderNo}</strong> ({selectedOrderForReject.commodity.name})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Alasan Penolakan <span className="text-status-danger">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setRejectError('');
                  }}
                  rows={3}
                  placeholder="Contoh: Panen tertunda hujan atau kuantitas telah dialokasikan ke komitmen lain..."
                  className="w-full text-sm rounded border border-gray-300 p-2.5 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
                {rejectError && (
                  <p className="text-xs text-status-danger mt-1">{rejectError}</p>
                )}
              </div>

              <div className="bg-amber-50 p-3 rounded text-xs text-amber-800">
                Peringatan: Penolakan akan melepas kuantitas tereservasi dan memicu sistem mengalokasikan kebutuhan ini ke pemasok lain.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderForReject(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                isLoading={rejectMutation.isPending}
                className="bg-status-danger text-white hover:bg-red-700"
              >
                Konfirmasi Tolak
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Pengajuan Sengketa */}
      {disputeOrder && (
        <DisputeModal
          orderId={disputeOrder.id}
          orderNo={disputeOrder.orderNo}
          commodityName={disputeOrder.commodity.name}
          onClose={() => setDisputeOrder(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
          }}
        />
      )}
    </div>
  );
};
