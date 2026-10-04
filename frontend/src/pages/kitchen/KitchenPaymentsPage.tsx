import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Scale,
  Star,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DisputeModal } from '../../features/disputes/DisputeModal';
import { SupplierReviewModal } from '../../features/reviews/SupplierReviewModal';

interface LedgerEntryItem {
  id: string;
  orderId: string;
  stage: 'HOLD' | 'RELEASE' | 'VOID' | 'ADJUSTMENT';
  amount: number;
  note?: string;
  createdAt: string;
  order?: {
    orderNo: string;
    quantity: number;
    pricePerUnit: number;
    commodity: {
      name: string;
      unit: string;
    };
    supplier?: {
      displayName: string;
    };
    kitchen?: {
      name: string;
    };
  };
  // Auditor masked fields
  orderNo?: string;
  commodityName?: string;
  supplierName?: string;
  kitchenName?: string;
}

export const KitchenPaymentsPage: React.FC = () => {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [disputeEntry, setDisputeEntry] = useState<LedgerEntryItem | null>(null);
  const [reviewEntry, setReviewEntry] = useState<LedgerEntryItem | null>(null);

  const { data: ledgerResponse, isLoading } = useQuery<{ data: LedgerEntryItem[] }>({
    queryKey: ['ledger-kitchen', filterStage],
    queryFn: async () => {
      const stageParam = filterStage !== 'ALL' ? `?stage=${filterStage}` : '';
      const res = await apiClient.get<{ data: LedgerEntryItem[] }>(`/ledger${stageParam}`);
      return res.data;
    },
  });

  const entries = ledgerResponse?.data || [];

  const totalHold = entries
    .filter((e) => e.stage === 'HOLD')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalReleased = entries
    .filter((e) => e.stage === 'RELEASE')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalVoid = entries
    .filter((e) => e.stage === 'VOID')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'HOLD':
        return <Badge color="warning">HOLD (Dicadangkan)</Badge>;
      case 'RELEASE':
        return <Badge color="success">RELEASE (Dibayarkan)</Badge>;
      case 'VOID':
        return <Badge color="danger">VOID (Dibatalkan)</Badge>;
      case 'ADJUSTMENT':
        return <Badge color="info">ADJUSTMENT</Badge>;
      default:
        return <Badge color="neutral">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Pembukuan & Pembayaran Dapur
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau status pencadangan dana pesanan dapur, pencairan pasokan lulus mutu, dan pembatalan dana.
        </p>
      </div>

      {/* Ringkasan Saldo Transaksi Dapur */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Dana Dicadangkan (HOLD)
            </p>
            <p className="text-xl font-heading font-bold text-gray-900 mt-1">
              {formatRupiah(totalHold)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Dana Dicairkan (RELEASE)
            </p>
            <p className="text-xl font-heading font-bold text-emerald-600 mt-1">
              {formatRupiah(totalReleased)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Dana Batal/Kembali (VOID)
            </p>
            <p className="text-xl font-heading font-bold text-red-600 mt-1">
              {formatRupiah(totalVoid)}
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['ALL', 'HOLD', 'RELEASE', 'VOID'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStage(st)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterStage === st
                ? 'bg-brand text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {st === 'ALL' ? 'Semua Mutasi' : st}
          </button>
        ))}
      </div>

      {/* Tabel Mutasi Buku Besar */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-heading font-semibold text-gray-900 text-sm">
            Riwayat Pembukuan Dana Dapur
          </h2>
          <span className="text-xs text-gray-500">
            {entries.length} entri tercatat
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="font-medium">Belum ada mutasi buku besar</p>
            <p className="text-xs text-gray-400 mt-1">
              Pencadangan dana otomatis tercatat saat pesanan diterima oleh pemasok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">No. Pesanan</th>
                  <th className="px-4 py-3">Pemasok</th>
                  <th className="px-4 py-3">Komoditas</th>
                  <th className="px-4 py-3">Tahapan</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-xs text-gray-900">
                      {entry.order?.orderNo || entry.orderNo}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {entry.order?.supplier?.displayName || entry.supplierName || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.order?.commodity?.name || entry.commodityName || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStageBadge(entry.stage)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                      {formatRupiah(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {entry.note || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {entry.stage === 'RELEASE' && (
                          <Button
                            size="sm"
                            onClick={() => setReviewEntry(entry)}
                            className="text-xs py-1 px-2.5 bg-pine-800 hover:bg-pine-900 text-white font-sans"
                          >
                            <Star className="w-3.5 h-3.5 mr-1 text-amber-300 fill-amber-300" />
                            Ulas
                          </Button>
                        )}
                        {(entry.stage === 'RELEASE' || entry.stage === 'VOID') && (
                          <Button
                            variant="outline"
                            onClick={() => setDisputeEntry(entry)}
                            className="text-xs py-1 px-2.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            <Scale className="w-3.5 h-3.5 mr-1" />
                            Sengketa
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Ulas Pemasok */}
      {reviewEntry && (
        <SupplierReviewModal
          orderId={reviewEntry.orderId}
          orderNo={reviewEntry.order?.orderNo || reviewEntry.orderNo || ''}
          supplierName={reviewEntry.order?.supplier?.displayName || reviewEntry.supplierName || 'Pemasok'}
          commodityName={reviewEntry.order?.commodity?.name || reviewEntry.commodityName || 'Komoditas'}
          onClose={() => setReviewEntry(null)}
        />
      )}

      {/* Modal Sengketa Dapur */}
      {disputeEntry && (
        <DisputeModal
          orderId={disputeEntry.orderId}
          orderNo={disputeEntry.order?.orderNo || disputeEntry.orderNo || ''}
          commodityName={disputeEntry.order?.commodity?.name || disputeEntry.commodityName || ''}
          onClose={() => setDisputeEntry(null)}
          onSuccess={() => {
            // refresh data
          }}
        />
      )}
    </div>
  );
};
