import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ShieldCheck,
  CheckCircle2,
  Building,
  QrCode,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';

interface QueueBatchItem {
  id: string;
  batchCode: string;
  orderId: string;
  orderNo: string;
  commodityId: string;
  commodityName: string;
  kitchenName: string;
  supplierName: string;
  originVillage?: string;
  harvestDate: string;
  shippedQuantity: number;
  receivedQuantity: number;
  receivedAt: string;
  qualityStandard?: {
    passScore: number;
    checklist: any[];
  };
}

export const QualityQueuePage: React.FC = () => {
  const { data: queue = [], isLoading } = useQuery<QueueBatchItem[]>({
    queryKey: ['quality-queue'],
    queryFn: async () => {
      const res: any = await apiClient.get('/quality-queue');
      return res.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900">
            Antrean Uji Kontrol Mutu
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Daftar batch bahan pangan yang telah tiba di dapur gizi dan menunggu inspeksi mutu standar ahli gizi.
          </p>
        </div>

        <Link to="/inspector/standards">
          <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" />
            Standar Mutu Komoditas
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : queue.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
          <p className="font-semibold text-gray-700">Semua batch telah selesai diuji mutu!</p>
          <p className="text-xs text-gray-400 mt-1">
            Tidak ada antrean bahan makanan yang menunggu inspeksi saat ini.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queue.map((b) => (
            <Card
              key={b.id}
              className="p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand bg-brand-soft/40 px-2 py-0.5 rounded border border-brand/20">
                    <QrCode className="w-3.5 h-3.5" />
                    {b.batchCode}
                  </div>
                  <Badge color="warning">Menunggu QC</Badge>
                </div>

                <h3 className="font-heading font-bold text-lg text-gray-900 mt-2">
                  {b.commodityName}
                </h3>

                <div className="space-y-1 text-xs text-gray-500 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>Dapur Penerima: <strong>{b.kitchenName}</strong></span>
                  </div>
                  <p>
                    Produsen: <strong>{b.supplierName}</strong> (Desa {b.originVillage || '-'})
                  </p>
                  <p>
                    Waktu Tiba: {formatDate(b.receivedAt)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-xs mt-4">
                  <div>
                    <span className="text-gray-400 block">Kuantitas Tiba Riil</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {formatKg(b.receivedQuantity)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block">Ambang Kelulusan</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      ≥ {b.qualityStandard?.passScore ?? 70} Poin
                    </span>
                  </div>
                </div>
              </div>

              <Link to={`/inspector/check/${b.id}`} className="mt-4">
                <Button className="w-full bg-brand text-white hover:bg-brand-hover text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Mulai Uji Mutu
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
