import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDefaultDashboardRoute } from '../features/auth/authContext';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  UtensilsCrossed,
  Leaf,
  Truck,
  Users,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface DemoAccount {
  role: string;
  badge: string;
  name: string;
  email: string;
  icon: React.ElementType;
  tagColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Pengelola Dapur Gizi',
    badge: 'Dapur Berkah Gizi Mandiri (1.000 Porsi)',
    name: 'Ibu Ratna Dewi',
    email: 'dapur-a@orvana.test',
    icon: UtensilsCrossed,
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    role: 'Petani Pemasok',
    badge: 'Poktan Makmur Hijau',
    name: 'Pak Sugeng Riyadi',
    email: 's1@orvana.test',
    icon: Leaf,
    tagColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    role: 'Nelayan Pemasok',
    badge: 'Mina Lestari Bahari',
    name: 'Pak Wahyu Hidayat',
    email: 's5@orvana.test',
    icon: Leaf,
    tagColor: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  },
  {
    role: 'Koordinator Hub',
    badge: 'Koperasi Lumbung Tani Sukamaju',
    name: 'Bpk. Ahmad Fauzi',
    email: 'koordinator1@orvana.test',
    icon: Truck,
    tagColor: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  {
    role: 'Pengawas Mutu',
    badge: 'Dinas Ketahanan Pangan',
    name: 'dr. Nurul Hidayati, Sp.GK',
    email: 'mutu@orvana.test',
    icon: ShieldCheck,
    tagColor: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  {
    role: 'Admin Dinas',
    badge: 'Kepala Dinas Ketahanan Pangan',
    name: 'H. Bambang Sutrisno, M.Si',
    email: 'admin@orvana.test',
    icon: Users,
    tagColor: 'bg-pine-50 text-pine-900 border-pine-200',
  },
  {
    role: 'Auditor Publik',
    badge: 'Inspektorat Pengawasan Daerah',
    name: 'Drs. Tri Wahyudi, Ak., CA',
    email: 'auditor@orvana.test',
    icon: Eye,
    tagColor: 'bg-stone-100 text-stone-800 border-stone-300',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoPills, setShowDemoPills] = useState(true);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.status === 'PENDING') {
        navigate('/pending');
      } else {
        navigate(getDefaultDashboardRoute(user.role));
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
    setError(null);
  };

  return (
    <div className="h-screen bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800/20 selection:text-emerald-950 font-sans antialiased flex flex-col justify-between overflow-hidden">
      {/* Header Floating Glass Island yang Ringkas */}
      <header className="shrink-0 w-full px-4 sm:px-6 lg:px-8 py-2.5 transition-all pointer-events-none">
        <div className="max-w-7xl mx-auto rounded-full px-5 py-2.5 flex items-center justify-between gap-4 pointer-events-auto bg-white/90 backdrop-blur-xl border border-stone-200/90 shadow-xs">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size="sm" />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg text-stone-950 tracking-tight block leading-none group-hover:text-emerald-900 transition-colors">
                ORVANA
              </span>
              <span className="text-[9.5px] uppercase font-mono tracking-widest text-emerald-800 font-bold mt-0.5">
                Portal Masuk Sistem
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">Belum memiliki akun?</span>
            <Link to="/register">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 text-stone-800 transition-all shadow-2xs"
              >
                Daftar Kemitraan
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split Layout - Fit Exact Viewport */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 min-h-0">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-110px)] h-auto">
          
          {/* Kolom Kiri: Visual Branding & Hero Story */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 sm:p-8 flex-col justify-between relative overflow-hidden">
            {/* Background Texture & Photo with subtle dark overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-luminosity">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80"
                alt="Pertanian Nusantara"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-transparent pointer-events-none" />

            {/* Top Tagline */}
            <div className="relative z-10 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-mono text-emerald-200">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Portal Resmi Rantai Pasok Pangan</span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Menghubungkan <span className="text-amber-400 italic">Petani Lokal</span> dengan Dapur Gizi Massal.
              </h2>

              <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
                Akses aman dan real-time untuk alokasi menu, penyerapan panen, uji mutu, dan pencairan escrow.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 my-4 space-y-2.5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-white font-heading">Kepastian Alokasi & Escrow</h4>
                  <p className="text-[10px] text-emerald-200/80 leading-normal">
                    Dana pesanan di-HOLD demi kepastian bayar petani lokal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-white font-heading">Passport Mutu & Audit Trail</h4>
                  <p className="text-[10px] text-emerald-200/80 leading-normal">
                    Buku besar append-only tak dapat diubah untuk verifikasi publik.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Meta Badges */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-emerald-300/80">
              <span>Keamanan Enkripsi JWT</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Form Login & Quick Demo Switcher */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-center bg-white overflow-y-auto">
            <div className="max-w-sm mx-auto w-full space-y-4">
              
              {/* Header Title */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Autentikasi Akun
                </span>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-950 mt-1">
                  Selamat Datang Kembali
                </h1>
                <p className="text-xs text-stone-500">
                  Masukkan email dan kata sandi Anda untuk mengakses portal kerja.
                </p>
              </div>

              {/* Alert Error Box */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                    Alamat Email Terdaftar
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold font-heading text-stone-700">
                      Kata Sandi
                    </label>
                    <span className="text-[10px] font-mono text-stone-400">
                      Sandi: Demo1234!
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 rounded-xl font-heading font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white"
                  isLoading={isLoading}
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </form>

              {/* Quick Role Switcher Section (Compact 1-Click Pills) */}
              <div className="pt-3 border-t border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-900 font-heading">
                    <KeyRound className="w-3 h-3 text-amber-500" />
                    <span>Akses Cepat Demo Akun:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoPills(!showDemoPills)}
                    className="text-[10px] font-mono text-emerald-800 hover:underline"
                  >
                    {showDemoPills ? 'Tutup' : 'Buka'}
                  </button>
                </div>

                {showDemoPills && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isSelected = email === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => handleQuickFill(acc.email)}
                          className={`p-1.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                              : 'bg-stone-50 hover:bg-emerald-50/60 border-stone-200 text-stone-800'
                          }`}
                        >
                          <p className={`text-[10px] font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                            {acc.role}
                          </p>
                          <p className={`text-[8.5px] font-mono truncate mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-stone-500'}`}>
                            {acc.badge}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Register Redirect */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-stone-500">
                  Belum memiliki akun kemitraan?{' '}
                  <Link to="/register" className="font-semibold text-emerald-800 hover:underline inline-flex items-center gap-0.5">
                    Daftar di sini
                    <ArrowRight className="w-2.5 h-2.5 inline" />
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Info Ringkas */}
      <footer className="shrink-0 py-2 border-t border-stone-200/60 text-center text-[10.5px] text-stone-400 font-mono">
        ORVANA Platform Rantai Pasok Pangan Lokal • Dapur Gizi Massal © 2026
      </footer>
    </div>
  );
};
