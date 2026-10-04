import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { formatDate } from '../../lib/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  History,
  Search,
  ShieldAlert,
  Calendar,
  Layers,
  FileCode,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, any> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AuditLogResponse {
  data: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const AdminAuditPage: React.FC = () => {
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMeta, setSelectedMeta] = useState<Record<string, any> | null>(null);

  const { data: response, isLoading } = useQuery<AuditLogResponse>({
    queryKey: ['admin-audit-logs', entityFilter, actionFilter, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const res = await apiClient.get<AuditLogResponse>(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs = response?.data || [];
  const meta = response?.meta;

  const getActionBadge = (action: string) => {
    if (action.includes('REJECT') || action.includes('CANCEL') || action.includes('FAILED')) {
      return <Badge color="danger">{action}</Badge>;
    }
    if (action.includes('RESOLVE') || action.includes('ACCEPT') || action.includes('PASS')) {
      return <Badge color="success">{action}</Badge>;
    }
    if (action.includes('HOLD') || action.includes('DISPUTE') || action.includes('REVIEW')) {
      return <Badge color="warning">{action}</Badge>;
    }
    return <Badge color="neutral">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jejak Rekam Log Audit Sistem"
        subtitle="Pencatatan append-only yang tidak dapat diubah (immutable) untuk setiap operasi status, QC, ledger, dan sengketa."
        icon={<History className="w-6 h-6 text-pine-800" />}
      />

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-sans font-bold text-stone-600 block mb-1">
              Entitas
            </label>
            <div className="relative">
              <input
                type="text"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Contoh: Order, Batch..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700"
              />
              <Layers className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-sans font-bold text-stone-600 block mb-1">
              Nama Aksi
            </label>
            <div className="relative">
              <input
                type="text"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Contoh: ORDER_ACCEPTED..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-sans font-bold text-stone-600 block mb-1">
              Dari Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700"
              />
              <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-sans font-bold text-stone-600 block mb-1">
              Sampai Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-pine-700"
              />
              <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {(entityFilter || actionFilter || fromDate || toDate) && (
          <div className="flex justify-end mt-3 pt-3 border-t border-stone-100">
            <button
              onClick={() => {
                setEntityFilter('');
                setActionFilter('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 font-sans"
            >
              Reset Filter
            </button>
          </div>
        )}
      </Card>

      {/* Tabel Log Audit */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center text-stone-500 bg-white">
          <ShieldAlert className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="font-serif font-bold text-lg text-pine-900">
            Tidak ada entri log audit yang sesuai
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Ubah kriteria filter atau tunggu aktivitas baru pada sistem.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 shadow-soft">
          <table className="w-full text-left text-xs font-sans text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Waktu Kejadian</th>
                <th className="px-4 py-3.5">Aksi Sistem</th>
                <th className="px-4 py-3.5">Entitas Terkait</th>
                <th className="px-4 py-3.5">Pelaku / Pengguna</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5 text-center">Payload Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-stone-600 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-stone-800">{log.entity}</span>
                    {log.entityId && (
                      <span className="text-[10px] font-mono text-stone-400 block truncate max-w-[140px]">
                        ID: {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <div>
                        <span className="font-semibold text-stone-900 block">{log.user.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {log.user.email} ({log.user.role})
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Sistem Internal</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-500 whitespace-nowrap">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {log.meta && Object.keys(log.meta).length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMeta(log.meta!)}
                        className="text-[11px] py-1 px-2 border-stone-300 text-stone-700 hover:bg-stone-50"
                      >
                        <FileCode className="w-3.5 h-3.5 mr-1" />
                        Lihat Data
                      </Button>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Navigasi Paginasi */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-stone-500 font-sans">
            Menampilkan halaman <span className="font-semibold text-stone-800">{meta.page}</span> dari{' '}
            <span className="font-semibold text-stone-800">{meta.totalPages}</span> (Total{' '}
            <span className="font-mono font-medium text-stone-800">{meta.total}</span> entri)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Modal Detail Meta JSON */}
      {selectedMeta && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-serif font-bold text-pine-900 text-base flex items-center gap-2">
                <FileCode className="w-5 h-5 text-pine-700" />
                Rincian Metadata Log
              </h3>
              <button
                onClick={() => setSelectedMeta(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-900 text-stone-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-80 leading-relaxed">
              <pre>{JSON.stringify(selectedMeta, null, 2)}</pre>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMeta(null)}
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
