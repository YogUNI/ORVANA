import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
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
  const { data: ledgerResponse, isLoading: isLoadingEntries } = useQuery<{ data: AuditorLedgerEntry[] }>({
    queryKey: ['auditor-ledger', filterStage],
    queryFn: async () => {
      const stageParam = filterStage !== 'ALL' ? `?stage=${filterStage}` : '';
      const res = await apiClient.get<{ data: AuditorLedgerEntry[] }>(`/ledger${stageParam}`);
      return res.data;
    },
  });

  // Query ringkasan buku besar auditor
  const { data: summaryResponse, isLoading: isLoadingSummary } = useQuery<AuditorSummaryResponse>({
    queryKey: ['auditor-ledger-summary'],
    queryFn: async () => {
      const res = await apiClient.get<AuditorSummaryResponse>('/ledger/summary');
      return res.data;
    },
  });

  const entries = ledgerResponse?.data || [];
  const summary = summaryResponse?.data;

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
      {/* Header Auditor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Audit Publik Buku Besar & Akuntabilitas Anggaran
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Transparansi pembukuan bertahap tanpa rekonsiliasi manual; nama dan data pribadi produsen lokal disamarkan sesuai regulasi privasi (docs/02 bagian 6).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="info">Akses Auditor Publik (Read-Only)</Badge>
        </div>
      </div>

      {/* Ringkasan Saldo Buku Besar Auditor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Dana Dicadangkan (HOLD)
            </p>
            <p className="text-xl font-heading font-bold text-gray-900 mt-1">
              {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : formatRupiah(summary?.totalHold || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Komitmen pesanan awal</p>
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
              {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : formatRupiah(summary?.effectiveReleased || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Lolos uji mutu gizi massal</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Dana Dibatalkan (VOID)
            </p>
            <p className="text-xl font-heading font-bold text-red-600 mt-1">
              {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : formatRupiah(summary?.totalVoid || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Pengembalian gagal mutu / afkir</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-brand flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Verifikasi Keseimbangan Invarian
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>HOLD = RELEASE + VOID</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Buku besar seimbang 100%</p>
          </div>
          <div className="p-3 bg-brand-soft text-brand rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
        </Card>
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
