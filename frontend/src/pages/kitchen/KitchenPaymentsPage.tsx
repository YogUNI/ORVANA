import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatRupiah, formatDate } from '../../lib/format';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Scale,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
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
  // Auditor masked fields fallback
  orderNo?: string;
  commodityName?: string;
  supplierName?: string;
  kitchenName?: string;
}

export const KitchenPaymentsPage: React.FC = () => {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [disputeEntry, setDisputeEntry] = useState<LedgerEntryItem | null>(null);
  const [reviewEntry, setReviewEntry] = useState<LedgerEntryItem | null>(null);

  const { data: ledgerData, isLoading, error } = useQuery<LedgerEntryItem[]>({
    queryKey: ['ledger-kitchen', filterStage],
    queryFn: async () => {
      const stageParam = filterStage !== 'ALL' ? `?stage=${filterStage}` : '';
      const res: any = await apiClient.get(`/ledger${stageParam}`);
      return (res.data || res) as LedgerEntryItem[];
    },
  });

  const entries = ledgerData || [];

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
        return <Badge color="warning">HOLD (Escrow Dicadangkan)</Badge>;
      case 'RELEASE':
        return <Badge color="success">RELEASE (Dicairkan)</Badge>;
      case 'VOID':
        return <Badge color="danger">VOID (Batal / Kembali)</Badge>;
      case 'ADJUSTMENT':
        return <Badge color="info">ADJUSTMENT (Koreksi)</Badge>;
      default:
        return <Badge color="neutral">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Pembukuan & Mutasi Dana Dapur"
        subtitle="Pantau status pencadangan dana pesanan dapur (escrow), pencairan pasokan lulus uji mutu, dan riwayat penyesuaian saldo buku besar."
        icon={<Receipt className="w-6 h-6 text-pine-800" />}
      />

      {/* Ringkasan Saldo Transaksi Dapur */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-amber-300 transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Dana Dicadangkan (HOLD)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
            {formatRupiah(totalHold)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Tersimpan aman di penampungan escrow
          </span>
        </div>

        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-brand-border transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Dana Dicairkan (RELEASE)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {formatRupiah(totalReleased)}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium mt-1 block">
            Dibayarkan lunas ke petani & nelayan
          </span>
        </div>

        <div className="bg-white border border-surface-border rounded-card p-5 shadow-soft hover:border-surface-border transition-colors group space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <span className="group-hover:text-stone-900 transition-colors">Dana Batal / Kembali (VOID)</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-700 mt-1">
            {formatRupiah(totalVoid)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Pengembalian dana afkir / pembatalan
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-surface-border rounded-card p-4 shadow-soft flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Semua Mutasi' },
            { id: 'HOLD', label: 'HOLD (Pencadangan)' },
            { id: 'RELEASE', label: 'RELEASE (Pencairan)' },
            { id: 'VOID', label: 'VOID (Pembatalan)' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStage(st.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterStage === st.id
                  ? 'bg-brand text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:bg-stone-100 bg-stone-50 border border-surface-border'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-stone-500">
          Menampilkan <strong className="text-stone-900 font-mono">{entries.length}</strong> catatan pembukuan
        </span>
      </div>

      {/* Tabel Mutasi Buku Besar */}
      <div className="bg-white border border-surface-border rounded-card overflow-hidden shadow-soft">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/60">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-pine-800" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Jurnal Rekam Transaksi Escrow Dapur
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Terhubung otomatis dengan status QC & Pengiriman
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-status-danger">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold text-sm">Gagal memuat catatan transaksi buku besar.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-1" />
            <p className="font-medium text-gray-700">Belum ada mutasi buku besar tercatat</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Pencadangan dana otomatis masuk ke rekening escrow saat pesanan diterima oleh pemasok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Waktu Pencatatan</th>
                  <th className="px-4 py-3.5">No. Pesanan</th>
                  <th className="px-4 py-3.5">Pemasok Lokal</th>
                  <th className="px-4 py-3.5">Komoditas</th>
                  <th className="px-4 py-3.5">Tahapan Escrow</th>
                  <th className="px-4 py-3.5 text-right">Nominal Transaksi</th>
                  <th className="px-4 py-3.5">Keterangan / Dasar</th>
                  <th className="px-4 py-3.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-medium">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-gray-900 whitespace-nowrap">
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
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {formatRupiah(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {entry.note || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {entry.stage === 'RELEASE' && (
                          <Button
                            size="sm"
                            onClick={() => setReviewEntry(entry)}
                            className="text-xs py-1 px-2.5 bg-pine-800 hover:bg-pine-900 text-white font-semibold shadow-2xs"
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
      </div>

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
            // Data otomatis refresh via query
          }}
        />
      )}
    </div>
  );
};
