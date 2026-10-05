import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { ROLE_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/Button';
import {
  Users,
  LogOut,
  Menu,
  X,
  Truck,
  CheckCircle,
  FileText,
  Apple,
  Utensils,
  Tag,
  Sliders,
  ShieldCheck,
  CalendarDays,
  ShoppingBag,
  Sprout,
  PackageOpen,
  CreditCard,
  LayoutDashboard,
  Scale,
  History,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';
import { NotificationBell } from '../../features/notifications/NotificationBell';

export const RoleLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  // Navigasi menu berdasarkan peran (docs/07)
  const getNavLinks = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard Dampak', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Pengguna & Verifikasi', icon: Users },
          { to: '/admin/master/commodities', label: 'Katalog Komoditas', icon: Apple },
          { to: '/admin/master/recipes', label: 'Resep Baku Gizi', icon: Utensils },
          { to: '/admin/master/prices', label: 'Standar Harga Acuan', icon: Tag },
          { to: '/admin/settings', label: 'Konfigurasi Sistem', icon: Sliders },
          { to: '/admin/disputes', label: 'Adjudikasi Sengketa', icon: Scale },
          { to: '/admin/ledger', label: 'Buku Besar & Keuangan', icon: CreditCard },
          { to: '/admin/audit', label: 'Log Audit Sistem', icon: History },
          { to: '/admin/reports', label: 'Laporan & Ekspor CSV', icon: FileSpreadsheet },
          { to: '/admin/ai-lab', label: 'Pusat AI & Model Lab', icon: Cpu },
        ];
      case 'KITCHEN_MANAGER':
        return [
          { to: '/kitchen/dashboard', label: 'Dasbor Dapur', icon: LayoutDashboard },
          { to: '/kitchen/menu', label: 'Menu Mingguan', icon: CalendarDays },
          { to: '/kitchen/demand', label: 'Kebutuhan Bahan', icon: ShoppingBag },
          { to: '/kitchen/receiving', label: 'Penerimaan Pasokan', icon: PackageOpen },
          { to: '/kitchen/payments', label: 'Buku Besar Dapur', icon: CreditCard },
        ];
      case 'SUPPLIER':
        return [
          { to: '/supplier/dashboard', label: 'Dasbor Produsen', icon: LayoutDashboard },
          { to: '/supplier/stock', label: 'Stok Pasokan', icon: Sprout },
          { to: '/supplier/harvest-plan', label: 'Rencana Panen', icon: CalendarDays },
          { to: '/supplier/calendar', label: 'Kalender Kolektif', icon: CalendarDays },
          { to: '/supplier/orders', label: 'Tawaran Pesanan', icon: ShoppingBag },
          { to: '/supplier/payments', label: 'Riwayat Pembayaran', icon: CreditCard },
        ];
      case 'COORDINATOR':
        return [
          { to: '/coordinator/dashboard', label: 'Dasbor Logistik', icon: LayoutDashboard },
          { to: '/coordinator/shipments', label: 'Pengiriman Armada', icon: Truck },
          { to: '/coordinator/orders', label: 'Konsolidasi Pesanan', icon: ShoppingBag },
        ];
      case 'QUALITY_INSPECTOR':
        return [
          { to: '/inspector/queue', label: 'Antrean Mutu', icon: CheckCircle },
          { to: '/inspector/standards', label: 'Standar Mutu', icon: ShieldCheck },
        ];
      case 'AUDITOR':
        return [
          { to: '/auditor/dashboard', label: 'Audit Buku Besar', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Sidebar Desktop: Posisi Fixed/Sticky Setinggi Layar Viewport */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-surface-border p-5 shrink-0 justify-between shadow-soft sticky top-0 h-screen z-30">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo & Header Peran (Fixed di Atas Sidebar) */}
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border shrink-0">
            <img src="/logo-icon.svg" alt="ORVANA" className="w-10 h-10 object-contain drop-shadow-sm" />
            <div>
              <span className="font-heading font-extrabold text-lg text-gray-950 block leading-tight tracking-tight">
                ORVANA
              </span>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>

          {/* Navigasi Links dengan Scroll Internal jika item sangat banyak */}
          <nav className="space-y-1 py-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-DEFAULT text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand text-white font-semibold shadow-sm'
                        : 'text-gray-700 hover:bg-surface-muted hover:text-gray-950'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout (Tetap Terkunci Rapi di Bawah Sidebar Viewport) */}
        <div className="pt-4 border-t border-surface-border space-y-3 shrink-0">
          <div className="p-3 bg-surface-muted/70 rounded-DEFAULT border border-surface-border">
            <p className="text-xs font-heading font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white border-b border-surface-border px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src="/logo-icon.svg" alt="ORVANA" className="w-8 h-8 object-contain" />
          <span className="font-heading font-extrabold text-base text-gray-950 tracking-tight">ORVANA</span>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1 rounded">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-gray-700 hover:bg-surface-muted"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto border-t border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="font-heading font-bold text-gray-900">Menu Navigasi</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-DEFAULT text-sm font-medium ${
                        isActive
                          ? 'bg-brand text-white font-semibold'
                          : 'text-gray-700 hover:bg-surface-muted'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-3 border-t border-surface-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-rose-700 border-rose-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area dengan Desktop Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 bg-white/80 backdrop-blur-xs border-b border-surface-border px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-stone-600 bg-stone-100 px-3 py-1.5 rounded-md border border-stone-200 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Wilayah Operasional: <strong className="text-stone-900 font-semibold">{user.region?.name || 'Kabupaten Bogor'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-6 w-px bg-stone-200 mx-1" />
            <div className="text-right">
              <span className="text-xs font-heading font-bold text-stone-900 block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
