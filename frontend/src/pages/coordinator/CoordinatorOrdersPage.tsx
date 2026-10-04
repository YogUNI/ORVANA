import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Truck,
  Calendar,
  Building,
  CheckSquare,
  Square,
  PackageCheck,
  Send,
} from 'lucide-react';

interface AvailableOrder {
  id: string;
  orderNo: string;
  commodityId: string;
  commodityName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  supplierId: string;
  supplierName: string;
  village?: string;
  latitude: number;
  longitude: number;
}

interface GroupedDemandOrders {
  kitchenId: string;
  kitchenName: string;
  kitchenCode: string;
  neededDate: string;
  totalOrders: number;
  totalQuantityKg: number;
  orders: AvailableOrder[];
}

export const CoordinatorOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedKitchenId, setSelectedKitchenId] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [transportCost, setTransportCost] = useState<number>(50000);
  const [routeNotes, setRouteNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const { data: groupedOrders = [], isLoading } = useQuery<GroupedDemandOrders[]>({
    queryKey: ['available-orders-for-shipment'],
    queryFn: async () => {
      const res: any = await apiClient.get('/orders/available-for-shipment');
      return res.data || [];
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/shipments', payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['available-orders-for-shipment'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-shipments'] });
      setSelectedOrderIds([]);
      alert(res?.data?.message || 'Rencana pengiriman berhasil dibuat!');
      navigate(`/coordinator/shipments/${res?.data?.shipment?.id || ''}`);
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error?.message ||
          'Gagal membuat rencana pengiriman. Pastikan seluruh pesanan ditujukan untuk satu dapur.'
      );
    },
  });

  // Handler toggle pilih order
  const handleToggleOrder = (kitchenId: string, orderId: string) => {
    setFormError('');
    // Jika ganti dapur, reset pilihan sebelumnya (aturan keras satu dapur docs/06 M5)
    if (selectedKitchenId && selectedKitchenId !== kitchenId) {
      if (
        !confirm(
          'Anda memilih pesanan dari dapur gizi berbeda. Pengiriman hanya dapat ditujukan untuk satu dapur. Ganti pilihan dapur?'
        )
      ) {
        return;
      }
      setSelectedKitchenId(kitchenId);
      setSelectedOrderIds([orderId]);
      return;
    }

    setSelectedKitchenId(kitchenId);
    if (selectedOrderIds.includes(orderId)) {
      const filtered = selectedOrderIds.filter((id) => id !== orderId);
      setSelectedOrderIds(filtered);
      if (filtered.length === 0) {
        setSelectedKitchenId('');
      }
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  // Hitung muatan terpilih
  const allOrders = groupedOrders.flatMap((g) => g.orders);
  const selectedOrdersList = allOrders.filter((o) => selectedOrderIds.includes(o.id));
  const totalSelectedKg = selectedOrdersList.reduce((sum, o) => sum + o.quantity, 0);
  const totalSelectedPrice = selectedOrdersList.reduce((sum, o) => sum + o.totalPrice, 0);

  const handleCreateShipment = () => {
    if (selectedOrderIds.length === 0) {
      setFormError('Pilih minimal 1 pesanan untuk dikirim');
      return;
    }
    if (!selectedKitchenId) {
      setFormError('Dapur tujuan belum ditentukan');
      return;
    }

    createShipmentMutation.mutate({
      kitchenId: selectedKitchenId,
      orderIds: selectedOrderIds,
      scheduledAt: new Date(scheduledAt).toISOString(),
      transportCost: Number(transportCost) || 0,
      routeNotes: routeNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-gray-900">
          Konsolidasi Pesanan Siap Kirim
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pilih dan gabungkan pesanan pangan lokal yang telah disanggupi pemasok menuju dapur gizi penerima.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Pesanan Siap Kirim Per Dapur (2 kolom) */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : groupedOrders.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <PackageCheck className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="font-semibold text-gray-700">Tidak ada pesanan siap kirim.</p>
              <p className="text-xs text-gray-400 mt-1">
                Semua pesanan yang disanggupi telah terkonsolidasi dalam armada pengiriman atau sedang menunggu respon pemasok.
              </p>
            </Card>
          ) : (
            groupedOrders.map((grp) => {
              const isCurrentSelectedKitchen = selectedKitchenId === grp.kitchenId;
              return (
                <Card
                  key={`${grp.kitchenId}_${grp.neededDate}`}
                  className={`p-5 transition-all ${
                    isCurrentSelectedKitchen
                      ? 'border-2 border-brand bg-white shadow-md'
                      : 'border border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-brand" />
                        <h3 className="font-heading font-bold text-gray-900 text-base">
                          {grp.kitchenName} ({grp.kitchenCode})
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Kebutuhan Dapur: {formatDate(grp.neededDate)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total Pasokan Tersedia</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {formatKg(grp.totalQuantityKg)} ({grp.totalOrders} pesanan)
                      </span>
                    </div>
                  </div>

                  {/* Daftar Order dalam Kelompok */}
                  <div className="mt-3 space-y-2">
                    {grp.orders.map((ord) => {
                      const isSelected = selectedOrderIds.includes(ord.id);
                      return (
                        <div
                          key={ord.id}
                          onClick={() => handleToggleOrder(grp.kitchenId, ord.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-brand bg-brand-soft/30 text-gray-900'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-brand shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleOrder(grp.kitchenId, ord.id);
                              }}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 fill-brand text-white" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-gray-800">
                                  {ord.orderNo}
                                </span>
                                <Badge color="info">Disanggupi</Badge>
                              </div>
                              <p className="font-semibold text-sm text-gray-900 mt-0.5">
                                {ord.commodityName} - {formatKg(ord.quantity)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Titik Jemput: <strong>{ord.supplierName}</strong> (Desa {ord.village || '-'})
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-brand text-sm block">
                              {formatRupiah(ord.totalPrice)}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              @{formatRupiah(ord.pricePerUnit)}/kg
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Kolom Kanan: Panel Form Konfirmasi Pengiriman (1 kolom) */}
        <div>
          <Card className="p-5 bg-white border border-gray-200 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Truck className="w-5 h-5 text-brand" />
              <h3 className="font-heading font-bold text-gray-900 text-base">
                Rencana Armada Pengiriman
              </h3>
            </div>

            {selectedOrderIds.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Pilih satu atau beberapa pesanan di sebelah kiri untuk membuat rencana pengiriman logistik.
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="bg-brand-soft/40 p-3 rounded-lg border border-brand/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 font-medium">Pesanan Terpilih</span>
                    <span className="font-bold text-gray-900 font-mono">
                      {selectedOrderIds.length} pesanan
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 font-medium">Total Bobot Muatan</span>
                    <span className="font-bold text-brand font-mono text-sm">
                      {formatKg(totalSelectedKg)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total Nilai Pangan</span>
                    <span className="font-bold text-gray-900 font-mono">
                      {formatRupiah(totalSelectedPrice)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Jadwal Berangkat Armada <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full text-xs rounded border border-gray-300 p-2.5 outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Estimasi Biaya Angkut Armada (Rp)
                  </label>
                  <Input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(Number(e.target.value))}
                    className="text-xs font-mono"
                    placeholder="Contoh: 75000"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Transparan per pengiriman, tidak memotong pembayaran petani.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Catatan Rute / Identitas Armada
                  </label>
                  <textarea
                    value={routeNotes}
                    onChange={(e) => setRouteNotes(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Pick-up Mitsubishi L300 Nopol F 1234 AB, supir Pak Hendra"
                    className="w-full text-xs rounded border border-gray-300 p-2 outline-none focus:border-brand"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-status-danger bg-red-50 p-2 rounded border border-red-200">
                    {formError}
                  </p>
                )}

                <Button
                  onClick={handleCreateShipment}
                  isLoading={createShipmentMutation.isPending}
                  className="w-full bg-brand text-white hover:bg-brand-hover text-xs font-semibold py-2.5 mt-2 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Buat Rencana Pengiriman
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
