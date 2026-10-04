import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { SHIPMENT_STATUS_LABELS } from '../../lib/labels';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Truck,
  Building,
  Calendar,
  ChevronRight,
  Package,
  Plus,
} from 'lucide-react';

interface ShipmentItem {
  id: string;
  shipmentNo: string;
  status: string;
  scheduledAt: string;
  transportCost: number;
  lossKg: number;
  totalQuantityKg: number;
  routeNotes?: string;
  kitchen: {
    name: string;
    code: string;
  };
  orders: {
    id: string;
    orderNo: string;
    quantity: number;
    commodity: { name: string };
    supplier: { displayName: string; village?: string };
    batch?: { batchCode: string };
  }[];
}

export const CoordinatorShipmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: response, isLoading } = useQuery({
    queryKey: ['coordinator-shipments', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' ? '/shipments' : `/shipments?status=${statusFilter}`;
      const res: any = await apiClient.get(url);
      return res;
    },
  });

  const shipments: ShipmentItem[] = response?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Daftar Pengiriman Logistik
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau pergerakan armada penjemputan dari kelompok tani menuju dapur gizi penerima.
          </p>
        </div>

        <Link to="/coordinator/orders">
          <Button className="bg-brand text-white hover:bg-brand-hover flex items-center gap-1.5 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            Konsolidasi Pesanan Baru
          </Button>
        </Link>
      </div>

      {/* Filter Status */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 w-fit text-xs font-semibold">
        {[
          { key: 'ALL', label: 'Semua Status' },
          { key: 'PLANNED', label: 'Direncanakan' },
          { key: 'PICKING_UP', label: 'Penjemputan' },
          { key: 'IN_TRANSIT', label: 'Dalam Perjalanan' },
          { key: 'ARRIVED', label: 'Tiba di Dapur' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Konten Pengiriman */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : shipments.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
          <p className="font-semibold text-gray-700">Belum ada pengiriman dalam status ini.</p>
          <p className="text-xs text-gray-400 mt-1">
            Gunakan tombol "Konsolidasi Pesanan Baru" untuk menggabungkan order pangan yang siap dikirim.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shipments.map((shp) => {
            const statusMeta = SHIPMENT_STATUS_LABELS[shp.status] || {
              label: shp.status,
              color: 'neutral',
            };

            return (
              <Card
                key={shp.id}
                className="p-5 bg-white border border-gray-200 shadow-sm hover:border-brand/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {shp.shipmentNo}
                      </span>
                      <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900 text-base">
                        {shp.kitchen.name} ({shp.kitchen.code})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Jadwal: {formatDate(shp.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        Muatan: <strong>{formatKg(shp.totalQuantityKg)}</strong> ({shp.orders.length} pesanan)
                      </span>
                      {shp.transportCost > 0 && (
                        <span>Biaya Angkut: {formatRupiah(shp.transportCost)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link to={`/coordinator/shipments/${shp.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold flex items-center gap-1"
                      >
                        Buka Operasional
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Ringkasan Titik Jemput Produsen */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
                  <span className="font-medium text-gray-500">Titik Jemput:</span>
                  {shp.orders.map((ord) => (
                    <span
                      key={ord.id}
                      className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
                    >
                      {ord.supplier.displayName} ({ord.commodity.name} - {formatKg(ord.quantity)})
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
