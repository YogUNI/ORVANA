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
          { to: '/admin/users', label: 'Pengguna & Verifikasi', icon: Users },
          { to: '/admin/master/commodities', label: 'Katalog Komoditas', icon: Apple },
          { to: '/admin/master/recipes', label: 'Resep Baku Gizi', icon: Utensils },
          { to: '/admin/master/prices', label: 'Standar Harga Acuan', icon: Tag },
          { to: '/admin/settings', label: 'Konfigurasi Sistem', icon: Sliders },
        ];
      case 'KITCHEN_MANAGER':
        return [
          { to: '/kitchen/menu', label: 'Menu Mingguan', icon: CalendarDays },
          { to: '/kitchen/demand', label: 'Kebutuhan Bahan', icon: ShoppingBag },
        ];
      case 'SUPPLIER':
        return [
          { to: '/supplier/stock', label: 'Stok Pasokan', icon: Sprout },
        ];
      case 'COORDINATOR':
        return [
          { to: '/coordinator', label: 'Beranda Koordinator', icon: Truck },
        ];
      case 'QUALITY_INSPECTOR':
        return [
          { to: '/inspector', label: 'Antrean Mutu', icon: CheckCircle },
          { to: '/inspector/standards', label: 'Standar Mutu', icon: ShieldCheck },
        ];
      case 'AUDITOR':
        return [
          { to: '/auditor', label: 'Audit & Dampak', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9FAFB]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Info Peran */}
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white font-heading font-black text-xl">
              O
            </span>
            <div>
              <span className="font-heading font-bold text-lg text-gray-900 block leading-tight">
                ORVANA
              </span>
              <span className="text-xs text-gray-500 font-medium">
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-soft text-brand font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-gray-100">
          <div className="mb-3 px-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-status-danger border-gray-200 hover:bg-red-50 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-heading font-bold text-sm">
            O
          </span>
          <span className="font-heading font-bold text-base text-gray-900">ORVANA</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Drawer Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 flex justify-end">
          <div className="w-64 bg-white h-full p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-heading font-bold text-gray-900">{user.name}</span>
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
                        `flex items-center gap-3 px-3.5 py-2.5 rounded text-sm font-medium ${
                          isActive
                            ? 'bg-brand-soft text-brand font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-status-danger"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </Button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation untuk peran lapangan (docs/07 bagian 3) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand font-bold' : 'text-gray-500'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
