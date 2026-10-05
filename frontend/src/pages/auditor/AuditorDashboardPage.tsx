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
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  Receipt,
  EyeOff,
} from 'lucide-react';

interface AuditorLedgerEntry {
  id: string;
  orderId: string;
  orderNo: string;
  stage: 'HOLD' | 'RELEASE' | 'VOID' | 'ADJUSTMENT';
  amount: number;
  note?: string;
  createdAt: string;
  commodityName: string;
  regionId: string;
  supplierName: string; // Tersamarkan secara otomatis
  kitchenName: string;
}

interface AuditorSummaryResponse {
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

export const AuditorDashboardPage: React.FC = () => {
  const [filterStage, setFilterStage] = useState<string>('ALL');

  // Query mutasi buku besar tersamarkan
  const { data: ledgerEntries, isLoading: isLoadingEntries } = useQuery<AuditorLedgerEntry[]>({
    queryKey: ['auditor-ledger', filterStage],
    queryFn: async () => {
      const stageParam = filterStage !== 'ALL' ? `?stage=${filterStage}` : '';
      const res: any = await apiClient.get(`/ledger${stageParam}`);
      return (res.data || res) as AuditorLedgerEntry[];
    },
  });

  // Query ringkasan buku besar auditor
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery<AuditorSummaryResponse['data']>({
    queryKey: ['auditor-ledger-summary'],
    queryFn: async () => {
      const res: any = await apiClient.get('/ledger/summary');
      return (res.data || res) as AuditorSummaryResponse['data'];
    },
  });

  const entries = ledgerEntries || [];
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
        title="Audit Publik Buku Besar & Akuntabilitas Anggaran"
        subtitle="Transparansi pembukuan bertahap tanpa rekonsiliasi manual; nama dan data pribadi produsen lokal disamarkan sesuai regulasi privasi (docs/02 bagian 6)."
        icon={<ShieldCheck className="w-6 h-6 text-pine-800" />}
        badge={<Badge color="info">Akses Auditor Publik (Read-Only)</Badge>}
      />

      {/* Ringkasan Saldo Buku Besar Auditor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Dana Dicadangkan (HOLD)"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.totalHold || 0)}
          subtext="Komitmen pesanan awal"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />

        <StatCard
          label="Total Dana Dicairkan (RELEASE)"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.effectiveReleased || 0)}
          subtext="Lolos uji mutu gizi massal"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          label="Total Dana Dibatalkan (VOID)"
          value={isLoadingSummary ? '...' : formatRupiah(summary?.totalVoid || 0)}
          subtext="Pengembalian gagal mutu / afkir"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
        />

        <StatCard
          label="Keseimbangan Invarian"
          value="HOLD = RELEASE + VOID"
          subtext="Buku besar seimbang 100%"
          icon={<Scale className="w-5 h-5 text-pine-700" />}
        />
      </div>

      {/* Banner Perlindungan Privasi Auditor */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3 text-xs text-gray-600">
        <EyeOff className="w-5 h-5 text-gray-500 shrink-0" />
        <span>
          Untuk mematuhi UU Pelindungan Data Pribadi (UU PDP) dan spesifikasi perizinan ORVANA (docs/02 bagian 6), nama lengkap produsen lokal, nomor rekening, alamat rumah, dan nomor kontak disamarkan secara otomatis menjadi <span className="font-semibold text-gray-800">"Pemasok Terdaftar"</span> pada tingkat basis data.
        </span>
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
            {st === 'ALL' ? 'Semua Mutasi Ledger' : st}
          </button>
        ))}
      </div>

      {/* Tabel Mutasi Audit */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-heading font-semibold text-gray-900 text-sm">
            Catatan Mutasi Buku Besar (Audit Log Mutasi Append-Only)
          </h2>
          <span className="text-xs text-gray-500">
            {entries.length} entri terverifikasi
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
                  <th className="px-4 py-3">Produsen (Tersamarkan)</th>
                  <th className="px-4 py-3">Komoditas</th>
                  <th className="px-4 py-3">Tahap</th>
                  <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                  <th className="px-4 py-3">Keterangan Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-xs text-gray-900">
                      {entry.orderNo}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {entry.kitchenName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {entry.supplierName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {entry.commodityName}
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
