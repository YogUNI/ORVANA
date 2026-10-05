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
import { PageHeader } from '../../components/ui/PageHeader';
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
  const [quickNoteText, setQuickNoteText] = useState('');
  const [parsedNotes, setParsedNotes] = useState<any[]>([]);

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
      <PageHeader
        title="Daftar Pengiriman Logistik"
        subtitle="Pantau pergerakan armada penjemputan dari kelompok tani menuju dapur gizi penerima."
        icon={<Truck className="w-6 h-6 text-pine-800" />}
        actions={
          <Link to="/coordinator/orders">
            <Button className="bg-pine-800 hover:bg-pine-900 text-white flex items-center gap-1.5 text-xs font-semibold">
              <Plus className="w-4 h-4" />
              Konsolidasi Pesanan Baru
            </Button>
          </Link>
        }
      />

      {/* Asisten Catatan Cepat Lapangan (AI NLP) */}
      <div className="bg-white border border-emerald-300 rounded-card p-4 sm:p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Pencatatan Cepat Setoran Petani (AI NLP)
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-pine-800 bg-pine-100 px-2 py-0.5 rounded-full">
            AI Active
          </span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Ketik setoran yang baru tiba dari petani, contoh: <em className="text-stone-800 font-medium">"terima 100 kg tomat dan 50 kg cabai rawit dari desa sukamaju"</em>. Sistem akan menguraikan komoditas dan bobotnya secara instan.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder="Ketik catatan setoran lapangan..."
            className="flex-1 px-3.5 py-2.5 border border-surface-border rounded-lg text-xs bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-pine-800"
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (!quickNoteText.trim()) return;
              try {
                const res: any = await apiClient.post('/demand-requests/parse-text', { text: quickNoteText.trim() });
                const candidates = res?.data?.candidates || [];
                setParsedNotes(candidates);
              } catch (err: any) {
                alert('Gagal menguraikan catatan.');
              }
            }}
            className="text-xs py-2.5 px-4 border-pine-700 text-pine-800 hover:bg-pine-50 font-semibold shrink-0"
          >
            Urai Catatan
          </Button>
        </div>

        {parsedNotes.length > 0 && (
          <div className="pt-2 border-t border-emerald-100 space-y-2 animate-fadeIn">
            <span className="text-[11px] font-bold text-pine-900 block">
              Daftar Muatan Terekstrak ({parsedNotes.length} item):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {parsedNotes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-stone-900 block">{item.commodityName}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Muatan: {item.quantityKg ? `${item.quantityKg} kg` : '-'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white border border-emerald-300 text-pine-800 px-2 py-0.5 rounded font-semibold">
                    {item.commodityCategory}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
