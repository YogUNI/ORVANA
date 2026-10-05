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
    role: 'Pengelola Dapur',
    badge: 'Dapur A (1.000 Porsi)',
    name: 'Pengelola Dapur A',
    email: 'dapur-a@orvana.test',
    icon: UtensilsCrossed,
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    role: 'Petani Pemasok',
    badge: 'S1 (Tani Makmur)',
    name: 'Tani Makmur',
    email: 's1@orvana.test',
    icon: Leaf,
    tagColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    role: 'Koordinator Hub',
    badge: 'Koperasi Lumbung Desa',
    name: 'Koperasi Lumbung Desa',
    email: 'koordinator1@orvana.test',
    icon: Truck,
    tagColor: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  {
    role: 'Pengawas Mutu',
    badge: 'Inspektur QC Gizi',
    name: 'Pengawas Mutu Demo',
    email: 'mutu@orvana.test',
    icon: ShieldCheck,
    tagColor: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  {
    role: 'Admin Dinas',
    badge: 'Dinas Pembina Wilayah',
    name: 'Admin Dinas Demo',
    email: 'admin@orvana.test',
    icon: Users,
    tagColor: 'bg-pine-50 text-pine-900 border-pine-200',
  },
  {
    role: 'Auditor Publik',
    badge: 'Pemantau Transparansi',
    name: 'Auditor Publik Demo',
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
    <div className="min-h-screen bg-surface flex flex-col justify-between">
      {/* Top Simple Bar */}
      <header className="border-b border-surface-border/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-95 transition-opacity">
            <Logo size="sm" withText={true} />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">Belum memiliki akun?</span>
            <Link to="/register">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Daftar Mitra
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Kolom Kiri: Visual Branding & Hero Story */}
          <div className="lg:col-span-5 bg-gradient-to-br from-pine-950 via-pine-900 to-pine-950 text-white p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Background Texture & Photo with subtle dark overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-luminosity">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80"
                alt="Pertanian Nusantara"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-pine-950 via-pine-950/70 to-transparent pointer-events-none" />

            {/* Top Tagline */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-harvest-gold" />
                <span>Portal Resmi Rantai Pasok Pangan</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Menghubungkan <span className="text-harvest-gold italic">Petani Lokal</span> dengan Dapur Gizi Massal.
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                Akses aman dan real-time untuk perencanaan menu, penyerapan panen, inspeksi mutu higienis, serta transparansi dana escrow.
              </p>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 my-8 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
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

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-harvest-gold/20 border border-harvest-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-harvest-gold" />
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
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-soft px-2.5 py-1 rounded border border-brand/20">
                  Autentikasi Akun
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-pine-950 mt-2">
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
                    placeholder="nama@email.com atau akun demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold font-heading text-stone-700">
                      Kata Sandi
                    </label>
                    <span className="text-[11px] font-mono text-stone-400">
                      Demo: Demo1234!
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[46px] rounded-xl font-heading font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                  isLoading={isLoading}
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Quick Demo Switcher Section */}
              <div className="pt-4 border-t border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-pine-950 font-heading">
                    <KeyRound className="w-3.5 h-3.5 text-harvest-gold" />
                    <span>Akses Cepat Pengujian Demo</span>
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
