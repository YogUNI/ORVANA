import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatKg, formatRupiah, formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  AlertTriangle,
  Scale,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface DisputeItem {
  id: string;
  orderId: string;
  raisedById: string;
  reason: string;
  evidenceUrls: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  outcome?: 'FAVOR_SUPPLIER' | 'FAVOR_KITCHEN' | 'SPLIT';
  adjustedAcceptedQuantity?: number;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
  order: {
    id: string;
    orderNo: string;
    quantity: number;
    pricePerUnit: number;
    commodity: { name: string; unit: string };
    kitchen: { name: string };
    supplier: { displayName: string };
  };
  raisedBy: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export const AdminDisputesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  // Form State untuk Resolusi
  const [outcome, setOutcome] = useState<'FAVOR_SUPPLIER' | 'FAVOR_KITCHEN' | 'SPLIT'>('SPLIT');
  const [adjustedQty, setAdjustedQty] = useState<number>(0);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Fetch daftar sengketa
  const { data: response, isLoading } = useQuery<{ data: DisputeItem[] }>({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' ? '/disputes' : `/disputes?status=${statusFilter}`;
      const res = await apiClient.get<{ data: DisputeItem[] }>(url);
      return res.data;
    },
  });

  const disputes = response?.data || [];

  // Mutasi: Ubah status menjadi UNDER_REVIEW
  const reviewMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      await apiClient.patch(`/disputes/${disputeId}/review`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      if (selectedDispute) {
        setSelectedDispute({ ...selectedDispute, status: 'UNDER_REVIEW' });
      }
    },
  });

  // Mutasi: Putuskan sengketa (RESOLVE)
  const resolveMutation = useMutation({
    mutationFn: async ({
      disputeId,
      body,
    }: {
      disputeId: string;
      body: {
        outcome: string;
        adjustedAcceptedQuantity?: number;
        resolutionNote: string;
      };
    }) => {
      await apiClient.patch(`/disputes/${disputeId}/resolve`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-admin'] });
      setSelectedDispute(null);
      setResolutionNote('');
      setActionError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Gagal menyelesaikan putusan sengketa';
      setActionError(msg);
    },
  });

  const handleOpenResolveModal = (disp: DisputeItem) => {
    setSelectedDispute(disp);
    setOutcome('SPLIT');
    setAdjustedQty(disp.order.quantity);
    setResolutionNote('');
    setActionError('');
  };

  const handleSubmitResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!resolutionNote || resolutionNote.trim().length < 5) {
      setActionError('Catatan pertimbangan putusan wajib diisi minimal 5 karakter.');
      return;
    }

    if (outcome === 'SPLIT' && (adjustedQty === undefined || adjustedQty < 0)) {
      setActionError('Kuantitas penyesuaian harus bernilai 0 atau lebih.');
      return;
    }

    resolveMutation.mutate({
      disputeId: selectedDispute.id,
      body: {
        outcome,
        adjustedAcceptedQuantity: outcome === 'SPLIT' ? Number(adjustedQty) : undefined,
        resolutionNote,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge color="warning">Terbuka (Menunggu Review)</Badge>;
      case 'UNDER_REVIEW':
        return <Badge color="info">Dalam Peninjauan</Badge>;
      case 'RESOLVED':
        return <Badge color="success">Selesai Diputus</Badge>;
      default:
        return <Badge color="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adjudikasi Sengketa Pasokan"
        subtitle="Peninjauan dan penetapan keputusan resmi atas selisih mutu, kuantitas, atau komitmen pembayaran antara Dapur dan Pemasok."
        icon={<Scale className="w-6 h-6 text-pine-800" />}
        actions={
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
            <Filter className="w-3.5 h-3.5 text-stone-400 ml-2" />
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-pine-900 shadow-sm'
                    : 'text-stone-600 hover:text-pine-900'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua'
                  : st === 'OPEN'
                  ? 'Terbuka'
                  : st === 'UNDER_REVIEW'
                  ? 'Ditinjau'
                  : 'Selesai'}
              </button>
            ))}
          </div>
        }
      />

      {/* Konten Daftar Sengketa */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : disputes.length === 0 ? (
        <Card className="p-12 text-center text-stone-500 bg-white">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 stroke-1" />
          <p className="font-serif font-bold text-lg text-pine-900">
            Tidak ada sengketa {statusFilter !== 'ALL' ? `berstatus ${statusFilter}` : 'aktif'}
          </p>
          <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
            Semua serah terima dan pembayaran berjalan lancar tanpa ada perselisihan yang dilaporkan oleh Dapur maupun Pemasok.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((disp) => (
            <Card
              key={disp.id}
              className="p-5 bg-white border border-stone-200 hover:border-pine-300 transition-all shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-pine-700 bg-pine-50 px-2 py-0.5 rounded border border-pine-100">
                    {disp.order.orderNo}
                  </span>
                  {getStatusBadge(disp.status)}
                  <span className="text-[11px] text-stone-400 font-sans">
                    Diajukan {formatDate(disp.createdAt)}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-pine-950">
                  {disp.order.commodity.name} • {disp.order.kitchen.name} ↔ {disp.order.supplier.displayName}
                </h3>

                <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded border border-stone-200/60 font-sans italic">
                  "{disp.reason}"
                </p>

                <div className="text-[11px] text-stone-500 flex items-center gap-2">
                  <span>
                    Pelapor: <strong>{disp.raisedBy.name}</strong> ({disp.raisedBy.role})
                  </span>
                  {disp.evidenceUrls.length > 0 && (
                    <span>• {disp.evidenceUrls.length} Bukti Lampiran Terlampir</span>
                  )}
                </div>

                {disp.status === 'RESOLVED' && (
                  <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200">
                    <strong>Putusan: {disp.outcome}</strong>
                    {disp.adjustedAcceptedQuantity !== null && disp.adjustedAcceptedQuantity !== undefined && (
                      <span> • Kuantitas Akhir: {formatKg(disp.adjustedAcceptedQuantity)}</span>
                    )}
                    {disp.resolutionNote && <p className="mt-0.5 text-stone-600">Catatan: {disp.resolutionNote}</p>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-end gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                {disp.status === 'OPEN' && (
                  <Button
                    variant="outline"
                    onClick={() => reviewMutation.mutate(disp.id)}
                    isLoading={reviewMutation.isPending}
                    className="text-xs py-1.5 px-3 border-stone-300 text-stone-700 hover:bg-stone-50"
                  >
                    Tinjau Kasus
                  </Button>
                )}

                {disp.status !== 'RESOLVED' && (
                  <Button
                    onClick={() => handleOpenResolveModal(disp)}
                    className="text-xs py-1.5 px-4 bg-terracotta-700 hover:bg-terracotta-800 text-white font-sans font-semibold shadow-sm"
                  >
                    <Scale className="w-3.5 h-3.5 mr-1.5" />
                    Putuskan Sengketa
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog Penetapan Putusan Sengketa */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white p-6 shadow-2xl border border-stone-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
              <Scale className="w-5 h-5 text-terracotta-600" />
              <div>
                <h3 className="font-serif font-bold text-lg text-pine-950">
                  Keputusan Adjudikasi Sengketa
                </h3>
                <p className="text-xs text-stone-500">
                  No. Pesanan: <strong>{selectedDispute.order.orderNo}</strong> ({selectedDispute.order.commodity.name})
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitResolve} className="space-y-4">
              {/* Opsi Putusan */}
              <div>
                <label className="text-xs font-sans font-semibold text-stone-800 block mb-1.5">
                  Pilihan Putusan Resmi Dinas:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-stone-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="outcome"
                      value="FAVOR_SUPPLIER"
                      checked={outcome === 'FAVOR_SUPPLIER'}
                      onChange={() => setOutcome('FAVOR_SUPPLIER')}
                      className="mt-0.5 text-pine-700"
                    />
                    <div>
                      <strong className="text-pine-900 block font-sans">
                        FAVOR_SUPPLIER (Memenangkan Pemasok)
                      </strong>
                      <span className="text-stone-500">
                        Mengakui seluruh kuantitas bahan yang tiba di dapur. Pembayaran dicairkan penuh.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-stone-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="outcome"
                      value="FAVOR_KITCHEN"
                      checked={outcome === 'FAVOR_KITCHEN'}
                      onChange={() => setOutcome('FAVOR_KITCHEN')}
                      className="mt-0.5 text-pine-700"
                    />
                    <div>
                      <strong className="text-pine-900 block font-sans">
                        FAVOR_KITCHEN (Memenangkan Dapur)
                      </strong>
                      <span className="text-stone-500">
                        Menetapkan hasil inspeksi mutu (QC) awal adalah sah. Tidak ada penambahan saldo.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-stone-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="outcome"
                      value="SPLIT"
                      checked={outcome === 'SPLIT'}
                      onChange={() => setOutcome('SPLIT')}
                      className="mt-0.5 text-pine-700"
                    />
                    <div>
                      <strong className="text-pine-900 block font-sans">
                        SPLIT (Kompromi / Penetapan Kuantitas Baru)
                      </strong>
                      <span className="text-stone-500">
                        Admin menetapkan jumlah kuantitas riil yang disepakati layak konsumsi.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Input Kuantitas Disesuaikan jika SPLIT */}
              {outcome === 'SPLIT' && (
                <div>
                  <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                    Kuantitas Layak yang Disetujui (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={selectedDispute.order.quantity}
                    value={adjustedQty}
                    onChange={(e) => setAdjustedQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-pine-700 outline-hidden"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Kuantitas pesanan: {formatKg(selectedDispute.order.quantity)} @{' '}
                    {formatRupiah(selectedDispute.order.pricePerUnit)}/kg
                  </span>
                </div>
              )}

              {/* Catatan Pertimbangan */}
              <div>
                <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                  Catatan Pertimbangan & Dasar Hukum Putusan (min. 5 karakter):
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Contoh: Berdasarkan mediasi bersama dan uji sampel ulang, disepakati bahan layak pakai sebesar 27 kg."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-sans focus:ring-1 focus:ring-pine-700 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDispute(null)}
                  className="text-xs py-2 px-3 border-stone-300 text-stone-600"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={resolveMutation.isPending}
                  className="text-xs py-2 px-4 bg-terracotta-700 hover:bg-terracotta-800 text-white font-semibold"
                >
                  Simpan & Terapkan Putusan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
