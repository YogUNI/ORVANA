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
    commodity: { name: string };
    kitchen: { name: string };
    supplier: { displayName: string };
  };
}

export const SupplierPaymentsPage: React.FC = () => {
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const { data: response, isLoading } = useQuery({
    queryKey: ['supplier-payments-ledger', stageFilter],
    queryFn: async () => {
      const url = stageFilter === 'ALL' ? '/ledger' : `/ledger?stage=${stageFilter}`;
      const res: any = await apiClient.get(url);
      return res;
    },
  });

  const entries: LedgerEntryItem[] = response?.data || [];

  // Hitung ringkasan
  const totalHold = entries
    .filter((e) => e.stage === 'HOLD')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalReleased = entries
    .filter((e) => e.stage === 'RELEASE')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalVoid = entries
    .filter((e) => e.stage === 'VOID')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pembayaran & Pencadangan Dana"
        subtitle="Transparansi buku besar bertahap dari pencadangan order, pencairan hasil QC, hingga pembatalan komoditas."
        icon={<Receipt className="w-6 h-6 text-pine-800" />}
      />

      {/* 3 Kartu Ringkasan Metrik Finansial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Dana Dicadangkan (HOLD)"
          value={formatRupiah(totalHold)}
          subtext="Jaminan dana pesanan aktif yang disanggupi"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />

        <StatCard
          label="Total Dana Dicairkan (RELEASE)"
          value={formatRupiah(totalReleased)}
          subtext="Pembayaran berhak diterima hasil lolos QC"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          label="Total Pembatalan / Cacat (VOID)"
          value={formatRupiah(totalVoid)}
          subtext="Pengurangan akibat barang ditolak QC / batal"
          icon={<XCircle className="w-5 h-5 text-stone-500" />}
        />
      </div>

      {/* Filter Tahapan Mutasi */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 w-fit text-xs font-semibold">
        {[
          { key: 'ALL', label: 'Semua Mutasi' },
          { key: 'HOLD', label: 'Dicadangkan (HOLD)' },
          { key: 'RELEASE', label: 'Dicairkan (RELEASE)' },
          { key: 'VOID', label: 'Dibatalkan (VOID)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStageFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              stageFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Mutasi Buku Besar */}
      <Card className="p-6 bg-white">
        <h3 className="font-heading font-bold text-gray-900 text-base mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand" />
          Buku Besar Transaksi Bertahap ({entries.length})
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Belum ada catatan mutasi buku besar untuk akun pemasok ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">No. Order</th>
                  <th className="px-4 py-3">Komoditas & Dapur</th>
                  <th className="px-4 py-3 text-center">Tahap Buku Besar</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => {
                  const isRelease = entry.stage === 'RELEASE';
                  const isHold = entry.stage === 'HOLD';
                  const isVoid = entry.stage === 'VOID';

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/75">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">
                        {entry.order?.orderNo || entry.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900 block text-xs">
                          {entry.order?.commodity?.name || 'Komoditas'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {entry.order?.kitchen?.name || 'Dapur Gizi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          color={
                            isRelease ? 'success' : isHold ? 'info' : isVoid ? 'neutral' : 'warning'
                          }
                        >
                          {entry.stage}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold text-sm ${
                          isRelease
                            ? 'text-emerald-700'
                            : isHold
                            ? 'text-blue-700'
                            : 'text-gray-500 line-through'
                        }`}
                      >
                        {formatRupiah(entry.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                        {entry.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
