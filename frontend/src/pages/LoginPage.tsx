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
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-emerald-800/20 selection:text-emerald-950 font-sans antialiased flex flex-col justify-between">
      {/* Header Floating Glass Island yang Lega */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300 pointer-events-none">
        <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-full px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 pointer-events-auto bg-white/90 backdrop-blur-xl border border-stone-200/90 shadow-md shadow-stone-900/5">
          <Link to="/" className="flex items-center gap-3.5 group">
            <Logo size="md" />
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-stone-950 tracking-tight block leading-none group-hover:text-emerald-900 transition-colors">
                ORVANA
              </span>
              <span className="text-[10.5px] uppercase font-mono tracking-widest text-emerald-800 font-bold mt-1">
                Portal Masuk Sistem
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">Belum memiliki akun?</span>
            <Link to="/register">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 text-stone-800 transition-all shadow-2xs"
              >
                Daftar Kemitraan
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Kolom Kiri: Visual Branding & Hero Story */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
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
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal Resmi Rantai Pasok Pangan</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Menghubungkan <span className="text-amber-400 italic">Petani Lokal</span> dengan Dapur Gizi Massal.
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                Akses aman dan real-time untuk perencanaan menu, penyerapan panen, inspeksi mutu higienis, serta transparansi dana escrow.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 my-8 space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white font-heading">Kepastian Alokasi & Escrow</h4>
                  <p className="text-[11px] text-emerald-200/80 leading-normal mt-0.5">
                    Dana pesanan otomatis di-HOLD demi kepastian bayar petani lokal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white font-heading">Passport Mutu & Audit Trail</h4>
                  <p className="text-[11px] text-emerald-200/80 leading-normal mt-0.5">
                    Buku besar append-only tak dapat diubah untuk verifikasi publik.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Meta Badges */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-emerald-300/80">
              <span>Keamanan Enkripsi JWT</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Aktif 99,9%
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Form Login & Quick Demo Switcher */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
            <div className="max-w-md mx-auto w-full space-y-6">
              
              {/* Header Title */}
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Autentikasi Akun
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 mt-2">
                  Selamat Datang Kembali
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Masukkan email dan kata sandi Anda untuk mengakses portal kerja.
                </p>
              </div>

              {/* Alert Error Box */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com atau klik akun mitra di bawah"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold font-heading text-stone-700">
                      Kata Sandi
                    </label>
                    <span className="text-[11px] font-mono text-stone-400">
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
                      className="w-full pl-3.5 pr-10 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[46px] rounded-xl font-heading font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white"
                  isLoading={isLoading}
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Quick Role Switcher Section */}
              <div className="pt-4 border-t border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-pine-950 font-heading">
                    <KeyRound className="w-3.5 h-3.5 text-harvest-gold" />
                    <span>Akses Cepat Pengujian Peran Mitra</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoPills(!showDemoPills)}
                    className="text-[11px] font-mono text-brand hover:underline"
                  >
                    {showDemoPills ? 'Sembunyikan' : 'Tampilkan Akun'}
                  </button>
                </div>

                {showDemoPills && (
                  <div className="bg-surface-muted/60 p-3 rounded-2xl border border-surface-border space-y-2">
                    <p className="text-[11px] text-stone-500 font-sans leading-tight">
                      Klik salah satu peran di bawah untuk mengisi formulir secara instan:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const Icon = acc.icon;
                        const isSelected = email === acc.email;
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => handleQuickFill(acc.email)}
                            className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[58px] ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-xs'
                                : 'bg-white hover:bg-emerald-50/50 border-stone-200/80 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-[10px] font-bold font-heading truncate ${isSelected ? 'text-emerald-100' : 'text-stone-700'}`}>
                                {acc.role}
                              </span>
                              <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-harvest-gold' : 'text-stone-400'}`} />
                            </div>
                            <span className={`text-[10px] font-mono truncate mt-1 ${isSelected ? 'text-white' : 'text-stone-500'}`}>
                              {acc.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Register Redirect */}
              <div className="text-center pt-2">
                <p className="text-xs text-stone-500 font-sans">
                  Belum memiliki akun kemitraan?{' '}
                  <Link to="/register" className="font-semibold text-brand hover:underline inline-flex items-center gap-0.5">
                    Daftar di sini
                    <ArrowRight className="w-3 h-3 inline" />
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 border-t border-surface-border/60 text-center text-xs text-stone-400 font-mono">
        ORVANA Platform Rantai Pasok Pangan Lokal • Dapur Gizi Massal © 2026
      </footer>
    </div>
  );
};
