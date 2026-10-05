import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Scale,
} from 'lucide-react';

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

interface GlobalSummaryResponse {
  data: {
    totalHold: number;
    totalReleased: number;
    totalVoid: number;
    totalAdjustment: number;
    effectiveReleased: number;
    remainingHold: number;
    supplierBreakdown: Array<{
      supplierId: string;
      supplierName: string;
      hold: number;
      released: number;
      voided: number;
    }>;
  };
}

export const AdminLedgerPage: React.FC = () => {
  const [filterStage, setFilterStage] = useState<string>('ALL');

  // Query mutasi buku besar
  const { data: ledgerResponse, isLoading: isLoadingEntries } = useQuery<LedgerEntryItem[]>({
    queryKey: ['admin-ledger', filterStage],
    queryFn: async () => {
      const stageParam = filterStage !== 'ALL' ? `?stage=${filterStage}` : '';
      const res: any = await apiClient.get(`/ledger${stageParam}`);
      return (res.data || res) as LedgerEntryItem[];
    },
  });

  // Query ringkasan global buku besar (docs/06 M7)
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery<GlobalSummaryResponse['data']>({
    queryKey: ['admin-ledger-summary'],
    queryFn: async () => {
      const res: any = await apiClient.get('/ledger/summary');
      return (res.data || res) as GlobalSummaryResponse['data'];
    },
  });

  const entries = ledgerResponse || [];
  const summary = summaryData;

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'HOLD':
        return <Badge color="warning">HOLD (Dicadangkan)</Badge>;
      case 'RELEASE':
        return <Badge color="success">RELEASE (Dicairkan)</Badge>;
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
      <PageHeader
        title="Buku Besar Transaksi & Pembayaran"
        subtitle="Pengawasan menyeluruh alur dana bertahap (HOLD, RELEASE, VOID) untuk menjaga akuntabilitas anggaran APBD."
        icon={<Receipt className="w-6 h-6 text-pine-800" />}
      />

      {/* Ringkasan Saldo Buku Besar Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total HOLD"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.totalHold || 0)}
          subtext="Dana komitmen dicadangkan"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />

        <StatCard
          label="Total RELEASE"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.effectiveReleased || 0)}
          subtext="Tercairkan ke petani/nelayan"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          label="Total VOID"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.totalVoid || 0)}
          subtext="Kembali karena tolak mutu/batal"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
        />

        <StatCard
          label="Sisa HOLD Tertahan"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.remainingHold || 0)}
          subtext="Menunggu pengiriman/inspeksi"
          icon={<Scale className="w-5 h-5 text-pine-700" />}
        />
      </div>

      {/* Rincian Realisasi per Pemasok */}
      {summary && summary.supplierBreakdown.length > 0 && (
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-gray-900 text-sm mb-3">
            Distribusi Realisasi Anggaran per Pemasok Lokal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.supplierBreakdown.map((s) => (
              <div key={s.supplierId} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-gray-900">{s.supplierName}</span>
                  <Badge color="neutral">Pemasok</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Dicadangkan (HOLD):</span>
                    <span className="font-mono">{formatRupiah(s.hold)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Dicairkan (RELEASE):</span>
                    <span className="font-mono">{formatRupiah(s.released)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Dibatalkan (VOID):</span>
                    <span className="font-mono">{formatRupiah(s.voided)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['ALL', 'HOLD', 'RELEASE', 'VOID', 'ADJUSTMENT'].map((st) => (
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
            Log Mutasi Buku Besar (Append-Only)
          </h2>
          <span className="text-xs text-gray-500">
            {entries.length} entri ditemukan
          </span>
        </div>

        {isLoadingEntries ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="font-medium">Belum ada mutasi buku besar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Waktu Transaksi</th>
                  <th className="px-4 py-3">No. Pesanan</th>
                  <th className="px-4 py-3">Dapur Penerima</th>
                  <th className="px-4 py-3">Pemasok</th>
                  <th className="px-4 py-3">Tahap</th>
                  <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                  <th className="px-4 py-3">Catatan</th>
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
                      {entry.order?.kitchen?.name || entry.kitchenName || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.order?.supplier?.displayName || entry.supplierName || '-'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
