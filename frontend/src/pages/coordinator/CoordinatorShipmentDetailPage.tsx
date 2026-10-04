import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { SHIPMENT_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  QrCode,
  MapPin,
  Play,
} from 'lucide-react';

interface ShipmentDetail {
  id: string;
  shipmentNo: string;
  status: string;
  scheduledAt: string;
  departedAt?: string;
  arrivedAt?: string;
  transportCost: number;
  lossKg: number;
  lossReason?: string;
  routeNotes?: string;
  totalQuantityKg: number;
  kitchen: {
    name: string;
    code: string;
    address?: string;
  };
  coordinator?: {
    user: { name: string; phone?: string };
  };
  orders: {
    id: string;
    orderNo: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    status: string;
    commodity: { name: string };
    supplier: {
      displayName: string;
      village?: string;
      latitude?: number;
      longitude?: number;
      user?: { phone?: string };
    };
    batch?: {
      id: string;
      batchCode: string;
      originVillage?: string;
    };
  }[];
}

const STEPS = [
  { key: 'PLANNED', label: 'Direncanakan', desc: 'Konsolidasi order selesai' },
  { key: 'PICKING_UP', label: 'Penjemputan', desc: 'Armada menjemput ke pemasok' },
  { key: 'IN_TRANSIT', label: 'Dalam Perjalanan', desc: 'Berangkat & Batch terbit' },
  { key: 'ARRIVED', label: 'Tiba di Dapur', desc: 'Serah terima & input susut' },
];

export const CoordinatorShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [lossKg, setLossKg] = useState<number>(0);
  const [lossReason, setLossReason] = useState<string>('');
  const [showArriveModal, setShowArriveModal] = useState<boolean>(false);

  const { data: shipment, isLoading, error } = useQuery<ShipmentDetail>({
    queryKey: ['coordinator-shipment-detail', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/shipments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { status: string; lossKg?: number; lossReason?: string }) => {
      return apiClient.patch(`/shipments/${id}/status`, payload);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-shipment-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-shipments'] });
      setShowArriveModal(false);
      alert(res?.data?.message || 'Status pengiriman berhasil diperbarui!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || 'Gagal memperbarui status pengiriman.');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <Card className="p-8 text-center text-status-danger">
        <p>Data pengiriman logistik tidak ditemukan.</p>
        <Link to="/coordinator/shipments" className="mt-4 inline-block">
          <Button variant="outline">Kembali ke Daftar</Button>
        </Link>
      </Card>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === shipment.status);
  const statusMeta = SHIPMENT_STATUS_LABELS[shipment.status] || {
    label: shipment.status,
    color: 'neutral',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/coordinator/shipments"
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-gray-900 font-mono">
                {shipment.shipmentNo}
              </h1>
              <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Dapur Tujuan: {shipment.kitchen.name} ({shipment.kitchen.code})
            </p>
          </div>
        </div>

        {/* Tombol Aksi Transisi Status */}
        <div className="flex items-center gap-2">
          {shipment.status === 'PLANNED' && (
            <Button
              onClick={() => updateStatusMutation.mutate({ status: 'PICKING_UP' })}
              isLoading={updateStatusMutation.isPending}
              className="bg-brand text-white hover:bg-brand-hover text-xs font-semibold"
            >
              <Play className="w-4 h-4 mr-1.5" />
              Mulai Penjemputan Pemasok
            </Button>
          )}

          {shipment.status === 'PICKING_UP' && (
            <Button
              onClick={() => {
                if (
                  confirm(
                    'Konfirmasi armada selesai menjemput seluruh pasokan dan berangkat ke dapur? Seluruh kode batch resmi akan diterbitkan.'
                  )
                ) {
                  updateStatusMutation.mutate({ status: 'IN_TRANSIT' });
                }
              }}
              isLoading={updateStatusMutation.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold"
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Berangkat ke Dapur (Terbitkan Batch)
            </Button>
          )}

          {shipment.status === 'IN_TRANSIT' && (
            <Button
              onClick={() => setShowArriveModal(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Konfirmasi Tiba di Dapur
            </Button>
          )}
        </div>
      </div>

      {/* Visual Stepper Progres Operasional */}
      <Card className="p-6 bg-white border border-gray-200">
        <h3 className="font-heading font-bold text-gray-900 text-sm mb-6">
          Linimasa Progres Perjalanan Armada
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || shipment.status === 'ARRIVED';
            const isCurrent = currentStepIndex === idx && shipment.status !== 'ARRIVED';

            return (
              <div
                key={step.key}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-2 border-brand bg-brand-soft/20 shadow-sm'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-gray-900'
                    : 'border-gray-200 bg-gray-50/60 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <span className="font-semibold text-sm">{step.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Informasi Rute & Manifest Muatan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 bg-white">
            <h3 className="font-heading font-bold text-gray-900 text-base mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand" />
              Manifest Muatan & Titik Jemput Petani ({shipment.orders.length})
            </h3>

            <div className="space-y-3">
              {shipment.orders.map((ord, idx) => {
                const ordStatusMeta = ORDER_STATUS_LABELS[ord.status] || {
                  label: ord.status,
                  color: 'neutral',
                };
                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-xs text-gray-800">
                          {ord.orderNo}
                        </span>
                        <Badge color={ordStatusMeta.color}>{ordStatusMeta.label}</Badge>
                      </div>

                      <p className="font-heading font-bold text-base text-gray-900 mt-1">
                        {ord.commodity.name} - {formatKg(ord.quantity)}
                      </p>

                      <p className="text-xs text-gray-600 mt-0.5">
                        Pemasok: <strong>{ord.supplier.displayName}</strong> (Desa {ord.supplier.village || '-'})
                      </p>

                      {ord.batch && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand font-mono font-bold bg-white px-2 py-1 rounded border border-brand/30 w-fit">
                          <QrCode className="w-3.5 h-3.5" />
                          Batch: {ord.batch.batchCode}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block">Nilai Order</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {formatRupiah(ord.totalPrice)}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono block">
                        @{formatRupiah(ord.pricePerUnit)}/kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Informasi Ringkasan Pengiriman */}
        <div>
          <Card className="p-6 bg-white space-y-4">
            <h3 className="font-heading font-bold text-gray-900 text-base pb-2 border-b border-gray-100">
              Rincian Pengiriman
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block">Dapur Penerima</span>
                <span className="font-bold text-gray-900 text-sm">
                  {shipment.kitchen.name} ({shipment.kitchen.code})
                </span>
                {shipment.kitchen.address && (
                  <span className="text-gray-500 block mt-0.5">{shipment.kitchen.address}</span>
                )}
              </div>

              <div>
                <span className="text-gray-400 block">Jadwal Keberangkatan</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(shipment.scheduledAt)}
                </span>
              </div>

              {shipment.departedAt && (
                <div>
                  <span className="text-gray-400 block">Waktu Berangkat Aktual</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(shipment.departedAt)}
                  </span>
                </div>
              )}

              {shipment.arrivedAt && (
                <div>
                  <span className="text-gray-400 block">Waktu Tiba di Dapur</span>
                  <span className="font-semibold text-emerald-700">
                    {formatDate(shipment.arrivedAt)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block">Total Muatan</span>
                <span className="font-mono font-bold text-brand text-base">
                  {formatKg(shipment.totalQuantityKg)}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block">Biaya Angkut Transport</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatRupiah(shipment.transportCost)}
                </span>
              </div>

              {shipment.lossKg > 0 && (
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                  <span className="text-amber-800 font-semibold block">Catatan Susut:</span>
                  <span className="text-amber-900 font-mono font-bold">
                    {formatKg(shipment.lossKg)}
                  </span>
                  {shipment.lossReason && (
                    <p className="text-amber-700 text-[11px] mt-0.5">{shipment.lossReason}</p>
                  )}
                </div>
              )}

              {shipment.routeNotes && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block">Catatan Armada / Rute:</span>
                  <p className="text-gray-700 mt-0.5">{shipment.routeNotes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Tiba & Susut */}
      {showArriveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">
              Konfirmasi Armada Tiba di Dapur
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Pengiriman {shipment.shipmentNo} telah sampai di {shipment.kitchen.name}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Susut Selama Perjalanan (Kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={lossKg}
                  onChange={(e) => setLossKg(Number(e.target.value))}
                  placeholder="0 (jika tidak ada susut)"
                  className="text-xs font-mono"
                />
              </div>

              {lossKg > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Alasan Terjadinya Susut
                  </label>
                  <textarea
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Penguapan daun alami dan sortasi tangkai layu..."
                    className="w-full text-xs rounded border border-gray-300 p-2.5 outline-none focus:border-brand"
                  />
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                Pemberitahuan: Konfirmasi tiba akan memperbarui skor keandalan ketepatan waktu pemasok dan memindahkan batch ke antrean penerimaan dapur.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArriveModal(false)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  updateStatusMutation.mutate({
                    status: 'ARRIVED',
                    lossKg: Number(lossKg) || 0,
                    lossReason: lossReason.trim() || undefined,
                  })
                }
                isLoading={updateStatusMutation.isPending}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Konfirmasi Tiba
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
