import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { formatDate } from '../lib/format';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Inbox,
  Filter,
  AlertTriangle,
  ShoppingBag,
  Scale,
  Sparkles,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

interface NotificationsPageResponse {
  data: NotificationItem[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<NotificationsPageResponse>({
    queryKey: ['notifications-page', unreadOnly, page],
    queryFn: async () => {
      const unreadParam = unreadOnly ? '&unread=true' : '';
      const res = await apiClient.get<NotificationsPageResponse>(
        `/notifications?page=${page}&limit=20${unreadParam}`,
      );
      return res.data;
    },
  });

  const notifications = response?.data || [];
  const meta = response?.meta;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes('DISPUTE')) return <Scale className="w-5 h-5 text-terracotta-600" />;
    if (type.includes('QC') || type.includes('MUTU'))
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (type.includes('ORDER')) return <ShoppingBag className="w-5 h-5 text-pine-700" />;
    return <Sparkles className="w-5 h-5 text-pine-600" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Notifikasi & Informasi Sistem"
        subtitle="Riwayat lengkap pemberitahuan alokasi kebutuhan bahan, hasil inspeksi mutu, pencairan dana, dan mediasi."
        icon={<Bell className="w-6 h-6 text-pine-800" />}
        actions={
          <div className="flex items-center gap-2">
            {meta && meta.unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                isLoading={markAllReadMutation.isPending}
                className="text-xs border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Tandai Semua Dibaca
              </Button>
            )}

            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-2 rounded-lg border text-xs font-sans font-semibold transition-colors flex items-center gap-1.5 ${
                unreadOnly
                  ? 'bg-pine-800 text-white border-pine-800'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {unreadOnly ? 'Hanya Belum Dibaca' : 'Semua Notifikasi'}
            </button>
          </div>
        }
      />

      {/* Konten Notifikasi */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center text-stone-500 bg-white shadow-soft">
          <Inbox className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-1" />
          <p className="font-serif font-bold text-lg text-pine-900">
            Tidak ada notifikasi {unreadOnly ? 'yang belum dibaca' : ''}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Aktivitas rantai pasok Anda akan dilaporkan secara otomatis di halaman ini.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.readAt;
            return (
              <Card
                key={notif.id}
                className={`p-4 transition-all shadow-soft flex items-start gap-4 border ${
                  isUnread
                    ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-stone-100 shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm ${
                          isUnread
                            ? 'font-serif font-bold text-pine-950'
                            : 'font-sans font-semibold text-stone-800'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {isUnread && <Badge color="warning">Baru</Badge>}
                    </div>
                    <span className="text-xs text-stone-400 font-sans">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 font-sans leading-relaxed">
                    {notif.body}
                  </p>

                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-stone-100/80">
                    {notif.link && (
                      <button
                        onClick={() => {
                          if (isUnread) markAsReadMutation.mutate(notif.id);
                          navigate(notif.link!);
                        }}
                        className="text-xs text-pine-700 hover:text-pine-900 font-sans font-semibold inline-flex items-center gap-1"
                      >
                        Tinjau di Halaman Terkait <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                        className="text-xs text-stone-500 hover:text-stone-800 font-sans ml-auto"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigasi Paginasi */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <p className="text-xs text-stone-500 font-sans">
            Menampilkan halaman <span className="font-semibold text-stone-800">{meta.page}</span> dari{' '}
            <span className="font-semibold text-stone-800">{meta.totalPages}</span> (Total{' '}
            <span className="font-mono font-medium text-stone-800">{meta.total}</span> notifikasi)
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
    </div>
  );
};
