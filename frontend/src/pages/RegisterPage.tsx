import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { Role, SupplierType } from '../features/auth/types';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import {
  Leaf,
  UtensilsCrossed,
  Truck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface RoleOption {
  role: Role;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  presetAddress: string;
  presetLat: string;
  presetLng: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'SUPPLIER',
    title: 'Petani / Nelayan / Peternak',
    subtitle: 'Produsen Pangan Lokal',
    description: 'Pasok panen segar langsung ke dapur gizi dengan proteksi harga dasar dan dana pesanan escrow.',
    icon: Leaf,
    badge: 'Penetapan Harga Adil',
    presetAddress: 'Desa Sukamaju, Kec. Megamendung, Kabupaten Demo',
    presetLat: '-6.5460',
    presetLng: '106.8000',
  },
  {
    role: 'KITCHEN_MANAGER',
    title: 'Pengelola Dapur Gizi',
    subtitle: 'Satuan Pelayanan Dapur Sekolah',
    description: 'Susun menu gizi anak sekolah, otomasi kebutuhan bahan baku, dan terima pasokan segar terverifikasi.',
    icon: UtensilsCrossed,
    badge: 'Kapasitas 500-2.500 Porsi',
    presetAddress: 'Jl. Dapur Sehat No. 1, Kecamatan Ciawi, Kabupaten Demo',
    presetLat: '-6.6000',
    presetLng: '106.8000',
  },
  {
    role: 'COORDINATOR',
    title: 'Koordinator / Koperasi Hub',
    subtitle: 'Pengepul & Konsolidator Rute',
    description: 'Konsolidasikan pasokan petani pedesaan, buat armada pengiriman, dan terbitkan batch barcode.',
    icon: Truck,
    badge: 'Logistik Rute Pendek',
    presetAddress: 'Titik Kumpul Sukamaju, Jalur Puncak KM 12, Kabupaten Demo',
    presetLat: '-6.5700',
    presetLng: '106.8100',
  },
];

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('SUPPLIER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Profil spesifik
  const [displayName, setDisplayName] = useState('');
  const [supplierType, setSupplierType] = useState<SupplierType>('FARMER');
  const [address, setAddress] = useState(ROLE_OPTIONS[0].presetAddress);
  const [latitude, setLatitude] = useState(ROLE_OPTIONS[0].presetLat);
  const [longitude, setLongitude] = useState(ROLE_OPTIONS[0].presetLng);

  // Khusus Koordinator
  const [collectionPointName, setCollectionPointName] = useState('');

  // Khusus Dapur
  const [kitchenCode, setKitchenCode] = useState('DPR03');
  const [portionCapacity, setPortionCapacity] = useState('1000');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    const preset = ROLE_OPTIONS.find((r) => r.role === selectedRole);
    if (preset) {
      setAddress(preset.presetAddress);
      setLatitude(preset.presetLat);
      setLongitude(preset.presetLng);
    }
  };

  const handleApplyPresetCoordinates = () => {
    const preset = ROLE_OPTIONS.find((r) => r.role === role);
    if (preset) {
      setAddress(preset.presetAddress);
      setLatitude(preset.presetLat);
      setLongitude(preset.presetLng);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        phone: phone || undefined,
        role,
      };

      if (role === 'SUPPLIER') {
        payload.supplierProfile = {
          displayName: displayName || name,
          type: supplierType,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      } else if (role === 'COORDINATOR') {
        payload.coordinatorProfile = {
          organizationName: displayName || name,
          collectionPointName: collectionPointName || 'Titik Kumpul Utama',
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      } else if (role === 'KITCHEN_MANAGER') {
        payload.kitchenProfile = {
          code: kitchenCode,
          name: displayName || name,
          address,
          portionCapacity: parseInt(portionCapacity, 10),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }

      await register(payload);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Periksa kembali isian formulir.');
    } finally {
      setIsLoading(false);
    }
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
                Pendaftaran Kemitraan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">Sudah memiliki akun?</span>
            <Link to="/login">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 text-stone-800 transition-all shadow-2xs"
              >
                Masuk ke Portal
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Register Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Intro */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300/80 text-xs font-semibold text-emerald-950">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pendaftaran Kemitraan Rantai Pasok Pangan</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-950 tracking-tight">
            Bergabung dengan Ekosistem ORVANA
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            Wujudkan kemandirian pangan dapur gizi sekolah dengan alokasi otomatis, penjaminan dana escrow, dan pencatatan mutu yang akuntabel.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-card border border-surface-border p-6 sm:p-10 space-y-8">
          
          {/* Alert Error Box */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* STEP 1: Pilih Peran Operasional */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-pine-950 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">1</span>
                <span>Pilih Peran Operasional Anda:</span>
              </label>
              <span className="text-[11px] font-mono text-stone-400">Verifikasi Berdasarkan Peran</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectRole(item.role)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[140px] group ${
                      isSelected
                        ? 'border-brand bg-emerald-50/40 ring-2 ring-brand/20 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-brand/40 hover:bg-surface-muted/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-brand text-white'
                              : 'bg-stone-100 text-stone-600 group-hover:bg-brand-soft group-hover:text-brand'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-brand" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-stone-300" />
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-sm text-stone-900 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-stone-500 font-sans mt-0.5 line-clamp-2 leading-tight">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-brand font-semibold">{item.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* STEP 2: Data Akun & Kredensial */}
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-pine-950 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">2</span>
                <span>Informasi Akun Utama</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Nama Lengkap Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Alamat Email (Untuk Masuk)
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Kata Sandi <span className="text-[11px] font-normal text-stone-500">(min. 8 karakter & 1 angka)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Nomor WhatsApp / HP Aktif
                  </label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Profil Usaha / Fasilitas Operasional */}
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-pine-950 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">3</span>
                <span>
                  Profil {role === 'SUPPLIER' ? 'Produsen Pemasok' : role === 'KITCHEN_MANAGER' ? 'Dapur Gizi' : 'Koordinator Hub'}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    {role === 'SUPPLIER'
                      ? 'Nama Usaha / Kelompok Tani'
                      : role === 'KITCHEN_MANAGER'
                      ? 'Nama Satuan Dapur Gizi'
                      : 'Nama Organisasi / Koperasi'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      role === 'SUPPLIER'
                        ? 'Contoh: Kelompok Tani Mandiri'
                        : role === 'KITCHEN_MANAGER'
                        ? 'Contoh: Dapur Gizi Ciawi Mandiri'
                        : 'Contoh: Koperasi Tani Makmur Sejahtera'
                    }
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                  />
                </div>

                {role === 'SUPPLIER' && (
                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                      Kategori Komoditas Pemasok
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900"
                      value={supplierType}
                      onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                    >
                      <option value="FARMER">Petani Sayur & Pangan Pokok (FARMER)</option>
                      <option value="FISHER">Nelayan / Pembudidaya Ikan Segar (FISHER)</option>
                      <option value="LIVESTOCK">Peternak Unggas & Telur (LIVESTOCK)</option>
                      <option value="PROCESSOR">UMKM Olahan Tempe / Tahu / Pangan (PROCESSOR)</option>
                    </select>
                  </div>
                )}

                {role === 'COORDINATOR' && (
                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                      Nama Titik Kumpul / Gudang Antara
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Titik Kumpul Puncak Sukamaju"
                      value={collectionPointName}
                      onChange={(e) => setCollectionPointName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                )}

                {role === 'KITCHEN_MANAGER' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                        Kode Identifikasi Dapur
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: DPR03"
                        value={kitchenCode}
                        onChange={(e) => setKitchenCode(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                        Target Kapasitas (Porsi/Hari)
                      </label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={portionCapacity}
                        onChange={(e) => setPortionCapacity(e.target.value)}
                        required
                        min="100"
                        className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* STEP 4: Titik Lokasi & Geospasial */}
            <div className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-pine-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Lokasi Operasional & Titik GPS</span>
                </label>
                <button
                  type="button"
                  onClick={handleApplyPresetCoordinates}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-brand hover:underline self-start sm:self-auto"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Isi Otomatis Titik Wilayah Demo</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                  Alamat Lengkap (Desa, Kecamatan, Jalan)
                </label>
                <input
                  type="text"
                  placeholder="Jl. Raya Pertanian No. 12, Desa..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Latitude GPS (Garis Lintang)
                  </label>
                  <input
                    type="text"
                    placeholder="-6.5460"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold font-heading text-stone-700 block mb-1.5">
                    Longitude GPS (Garis Bujur)
                  </label>
                  <input
                    type="text"
                    placeholder="106.8000"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-muted/60 rounded-xl border border-surface-border text-xs text-stone-500 font-sans flex items-start gap-2">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>
                  Koordinat GPS diperlukan oleh algoritma ORVANA untuk mengkalkulasi radius pengiriman logistik rute terpendek dan mengukur jejak karbon pangan.
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-surface-border space-y-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full min-h-[48px] rounded-xl font-heading font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                isLoading={isLoading}
              >
                <span>Kirim Formulir Pendaftaran Mitra</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="text-center text-xs text-stone-500 font-sans">
                Sudah memiliki akun terdaftar?{' '}
                <Link to="/login" className="font-semibold text-brand hover:underline inline-flex items-center gap-0.5">
                  Masuk di sini
                  <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>
            </div>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-surface-border/60 text-center text-xs text-stone-400 font-mono">
        ORVANA Platform Rantai Pasok Pangan Lokal • Dapur Gizi Massal © 2026
      </footer>
    </div>
  );
};
