import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { formatDate } from '../../lib/format';
import { Badge } from '../../components/ui/Badge';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Inbox,
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

interface NotificationsResponse {
  data: NotificationItem[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Polling notifikasi setiap 30 detik (docs/06 M11)
  const { data: response } = useQuery<NotificationsResponse>({
    queryKey: ['notifications-bell'],
    queryFn: async () => {
      const res = await apiClient.get<NotificationsResponse>('/notifications?limit=10');
      return res.data;
    },
    refetchInterval: 30000, // 30 detik polling
    refetchIntervalInBackground: true,
  });

  const notifications = response?.data || [];
  const unreadCount = response?.meta?.unreadCount || 0;

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mutasi: Tandai 1 notifikasi dibaca
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  // Mutasi: Tandai semua dibaca
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.readAt) {
      markAsReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('DISPUTE')) return <Scale className="w-4 h-4 text-terracotta-600" />;
    if (type.includes('QC') || type.includes('MUTU'))
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (type.includes('ORDER')) return <ShoppingBag className="w-4 h-4 text-pine-700" />;
    return <Sparkles className="w-4 h-4 text-pine-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi sistem"
        className="relative p-2 rounded-lg text-stone-600 hover:text-pine-900 hover:bg-stone-100 transition-colors focus:outline-hidden"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold text-white bg-terracotta-600 rounded-full animate-in zoom-in-50 shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown (10 Terbaru) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-stone-200 z-50 animate-in fade-in zoom-in-95 overflow-hidden">
          {/* Header Popover */}
          <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-pine-950">Notifikasi</span>
              {unreadCount > 0 && (
                <Badge color="warning">{unreadCount} Baru</Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] font-sans text-pine-700 hover:text-pine-900 flex items-center gap-1 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          {/* List Notifikasi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-1" />
                <p className="text-xs font-serif font-medium text-stone-600">
                  Belum ada notifikasi
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Setiap pembaruan pesanan, QC, dan pembayaran akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-3 hover:bg-stone-50 ${
                      isUnread ? 'bg-amber-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-stone-100 shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong
                          className={`text-xs block truncate ${
                            isUnread ? 'font-serif font-bold text-pine-950' : 'font-sans font-medium text-stone-700'
                          }`}
                        >
                          {notif.title}
                        </strong>
                        <span className="text-[10px] text-stone-400 font-sans shrink-0">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-0.5 line-clamp-2 leading-relaxed font-sans">
                        {notif.body}
                      </p>

                      {notif.link && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-pine-700 font-medium mt-1">
                          Lihat detail <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-terracotta-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Popover Menuju Halaman Lengkap */}
          <div className="p-2.5 border-t border-stone-100 bg-stone-50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-sans font-semibold text-pine-800 hover:text-pine-950 transition-colors"
            >
              Buka Semua Notifikasi & Riwayat Lengkap →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
