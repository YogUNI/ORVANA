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
          label="Dana Terkunci Escrow (HOLD)"
          value={formatRupiah(totalHold)}
          subtext="Jaminan dana pesanan aktif yang disanggupi"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
        />

        <StatCard
          label="Dana Berhak Dicairkan (RELEASE)"
          value={formatRupiah(totalReleased)}
          subtext="Hasil pembayaran resmi lolos inspeksi QC"
          icon={<CheckCircle2 className="w-5 h-5 text-pine-800" />}
        />

        <StatCard
          label="Komoditas Afkir / Batal (VOID)"
          value={formatRupiah(totalVoid)}
          subtext="Potongan akibat penolakan QC atau pembatalan"
          icon={<XCircle className="w-5 h-5 text-stone-500" />}
        />
      </div>

      {/* Info Card Alur Pencairan Bertahap */}
      <div className="p-4 bg-stone-50 border border-surface-border rounded-card text-xs text-stone-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-pine-800 shrink-0" />
          <span>
            <strong>Prinsip Arus Kas Petani Orvana:</strong> Dana dialokasikan saat Anda menyanggupi tawaran, terkunci aman di penampungan (Escrow), dan langsung dicairkan penuh saat dapur memvalidasi mutu pangan.
          </span>
        </div>
        <div className="text-[11px] font-mono text-stone-500 shrink-0">
          Standar Akuntansi Pangan Lokal
        </div>
      </div>

      {/* Filter Tahapan Mutasi */}
      <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200 w-fit text-xs font-semibold">
        {[
          { key: 'ALL', label: 'Semua Mutasi' },
          { key: 'HOLD', label: 'Terkunci Escrow (HOLD)' },
          { key: 'RELEASE', label: 'Dicairkan (RELEASE)' },
          { key: 'VOID', label: 'Batal / Afkir (VOID)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStageFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              stageFilter === tab.key
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Mutasi Buku Besar */}
      <Card className="p-6 bg-white border border-surface-border rounded-card shadow-soft">
        <h3 className="font-heading font-bold text-stone-900 text-base mb-4 pb-3 border-b border-surface-border flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-pine-800" />
            Buku Rekening Mutasi Bertahap
          </span>
          <span className="text-xs font-mono font-normal text-stone-500">
            {entries.length} baris tercatat
          </span>
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            Belum ada catatan mutasi buku besar untuk penyaringan ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-surface-muted border-b border-surface-border text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Tanggal / Waktu</th>
                  <th className="px-4 py-3.5">No. Order</th>
                  <th className="px-4 py-3.5">Komoditas & Dapur</th>
                  <th className="px-4 py-3.5 text-center">Tahap Buku Besar</th>
                  <th className="px-4 py-3.5 text-right">Nominal Mutasi</th>
                  <th className="px-4 py-3.5">Catatan Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {entries.map((entry) => {
                  const isRelease = entry.stage === 'RELEASE';
                  const isHold = entry.stage === 'HOLD';
                  const isVoid = entry.stage === 'VOID';

                  return (
                    <tr key={entry.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-stone-500 whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-stone-900 text-xs">
                        {entry.order?.orderNo || entry.orderId}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-stone-900 block text-xs">
                          {entry.order?.commodity?.name || 'Komoditas Pangan'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {entry.order?.kitchen?.name || 'Dapur Gizi'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          color={
                            isRelease ? 'success' : isHold ? 'info' : isVoid ? 'neutral' : 'warning'
                          }
                        >
                          {entry.stage}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold text-sm ${
                          isRelease
                            ? 'text-emerald-800'
                            : isHold
                            ? 'text-pine-800'
                            : 'text-stone-400 line-through'
                        }`}
                      >
                        {isRelease && '+ '}
                        {formatRupiah(entry.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-stone-600 max-w-xs truncate">
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
