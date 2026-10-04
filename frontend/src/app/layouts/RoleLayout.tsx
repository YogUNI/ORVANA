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
} from 'lucide-react';

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
          { to: '/admin/ledger', label: 'Buku Besar & Keuangan', icon: CreditCard },
        ];
      case 'KITCHEN_MANAGER':
        return [
          { to: '/kitchen/menu', label: 'Menu Mingguan', icon: CalendarDays },
          { to: '/kitchen/demand', label: 'Kebutuhan Bahan', icon: ShoppingBag },
          { to: '/kitchen/receiving', label: 'Penerimaan Pasokan', icon: PackageOpen },
          { to: '/kitchen/payments', label: 'Buku Besar Dapur', icon: CreditCard },
        ];
      case 'SUPPLIER':
        return [
          { to: '/supplier/stock', label: 'Stok Pasokan', icon: Sprout },
          { to: '/supplier/orders', label: 'Tawaran Pesanan', icon: ShoppingBag },
          { to: '/supplier/payments', label: 'Riwayat Pembayaran', icon: CreditCard },
        ];
      case 'COORDINATOR':
        return [
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
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-surface-border p-5 shrink-0 justify-between shadow-soft">
        <div className="space-y-6">
          {/* Logo & Header Peran */}
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <span className="w-10 h-10 rounded-card bg-brand flex items-center justify-center text-white font-serif font-black text-2xl shadow-sm border border-brand-light">
              O
            </span>
            <div>
              <span className="font-heading font-extrabold text-lg text-gray-950 block leading-tight tracking-tight">
                ORVANA
              </span>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>

          {/* Navigasi Links */}
          <nav className="space-y-1">
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

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-surface-border space-y-3">
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
          <span className="w-8 h-8 rounded-DEFAULT bg-brand flex items-center justify-center text-white font-serif font-bold text-lg">
            O
          </span>
          <span className="font-heading font-extrabold text-base text-gray-950 tracking-tight">ORVANA</span>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1 rounded">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded text-gray-700 hover:bg-surface-muted"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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

      {/* Konten Halaman */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
