import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { Logo } from '../components/ui/Logo';
import { Card } from '../components/ui/Card';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';

export const PendingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800/20 selection:text-emerald-950 font-sans antialiased flex flex-col justify-between">
      {/* Header Floating Glass Island */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300 pointer-events-none">
        <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-full px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 pointer-events-auto bg-white/90 backdrop-blur-xl border border-stone-200/90 shadow-md shadow-stone-900/5">
          <Link to="/" className="flex items-center gap-3.5 group">
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-stone-950 tracking-tight block leading-none group-hover:text-emerald-900 transition-colors">
                ORVANA
              </span>
              <span className="text-[10.5px] uppercase font-mono tracking-widest text-emerald-800 font-bold mt-1">
                Status Verifikasi Akun
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 text-stone-800 transition-all shadow-2xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-lg w-full text-center p-8 sm:p-10 bg-white border border-stone-200/90 shadow-xl rounded-3xl">
          <div className="w-18 h-18 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-200/80 shadow-2xs">
            <Clock className="w-9 h-9" />
          </div>
          
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
            Status: Menunggu Persetujuan
          </span>

          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-950 mb-3">
            Akun Menunggu Verifikasi
          </h1>

          <div className="text-left space-y-4">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed text-center">
              Halo <span className="font-bold text-stone-950">{user?.name}</span>, formulir pendaftaran kemitraan Anda sebagai{' '}
              <span className="font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{user?.role}</span> telah berhasil masuk ke sistem ORVANA dan saat ini sedang ditinjau oleh Admin Dinas Ketahanan Pangan.
            </p>

            <div className="p-4 bg-stone-50 rounded-2xl text-xs text-stone-600 border border-stone-200/80 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Informasi Alur Verifikasi:</span>
              </div>
              <p className="leading-relaxed">
                • Admin dinas memeriksa keabsahan lokasi, legalitas kelompok tani/dapur gizi, dan kuota wilayah.
              </p>
              <p className="leading-relaxed">
                • Fitur transaksi, pencocokan pasokan, dan kalender pesanan akan terbuka otomatis setelah status akun diaktifkan (ACTIVE).
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl font-heading font-semibold text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-950 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun & Masuk Nanti</span>
              </button>

              <Link to="/" className="block text-center text-xs text-emerald-800 hover:underline pt-1">
                ← Kembali ke Halaman Depan
              </Link>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-stone-200/80 text-center text-xs text-stone-400 font-mono">
        ORVANA Platform Rantai Pasok Pangan Lokal • Dapur Gizi Massal © 2026
      </footer>
    </div>
  );
};
