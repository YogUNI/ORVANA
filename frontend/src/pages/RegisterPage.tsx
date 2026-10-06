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

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

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

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!role) {
        setError('Pilih peran operasional terlebih dahulu.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!name.trim()) {
        setError('Nama lengkap penanggung jawab wajib diisi.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Masukkan alamat email yang valid.');
        return false;
      }
      if (!password || password.length < 8) {
        setError('Kata sandi minimal 8 karakter.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!displayName.trim()) {
        setError('Nama usaha/dapur/organisasi wajib diisi.');
        return false;
      }
      if (role === 'KITCHEN_MANAGER') {
        if (!kitchenCode.trim()) {
          setError('Kode dapur wajib diisi.');
          return false;
        }
        if (!portionCapacity || parseInt(portionCapacity, 10) < 50) {
          setError('Kapasitas porsi minimal 50.');
          return false;
        }
      }
      if (role === 'COORDINATOR' && !collectionPointName.trim()) {
        setError('Nama titik kumpul wajib diisi.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
                Pendaftaran Kemitraan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">Sudah memiliki akun?</span>
            <Link to="/login">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 text-stone-800 transition-all shadow-2xs"
              >
                Masuk ke Portal
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container - Fit Viewport (No Scroll) */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 min-h-0">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[calc(100vh-100px)] h-auto">
          
          {/* Header Step Progress Bar (Google Forms style) */}
          <div className="p-4 sm:p-6 pb-3 border-b border-stone-200/80 bg-stone-50/60 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {currentStep}
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-heading">
                  {currentStep === 1 && 'Pilih Peran Operasional'}
                  {currentStep === 2 && 'Informasi Akun & Masuk'}
                  {currentStep === 3 && `Detail Profil ${role === 'SUPPLIER' ? 'Produsen' : role === 'KITCHEN_MANAGER' ? 'Dapur Gizi' : 'Koordinator'}`}
                  {currentStep === 4 && 'Lokasi Operasional & Titik GPS'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-900">
                Langkah {currentStep} dari {totalSteps}
              </span>
            </div>

            {/* Visual Step Progress Line */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-800 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content Area with Internal Smooth Scroll if needed on tiny screens */}
          <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
            {/* Alert Error Box */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* STEP 1: Pilih Peran Operasional */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-stone-500 mb-1">
                  Pilih peran kemitraan yang sesuai dengan fungsi operasional Anda di rantai pasok:
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {ROLE_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = role === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleSelectRole(item.role)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between group ${
                          isSelected
                            ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-emerald-700/40 hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-emerald-900 text-white'
                                : 'bg-stone-100 text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-900'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-bold text-sm text-stone-900">
                                {item.title}
                              </h3>
                              <span className="text-[10px] font-mono font-semibold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 font-sans mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-stone-300 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Data Akun & Kredensial */}
            {currentStep === 2 && (
              <div className="space-y-3.5">
                <p className="text-xs text-stone-500 mb-2">
                  Lengkapi data penanggung jawab resmi untuk akses masuk ke aplikasi:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      Nama Lengkap Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      Alamat Email (Untuk Masuk)
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      Nomor WhatsApp / HP Aktif
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      Kata Sandi <span className="text-[10px] font-normal text-stone-500">(min. 8 karakter)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Profil Usaha / Fasilitas Operasional */}
            {currentStep === 3 && (
              <div className="space-y-3.5">
                <p className="text-xs text-stone-500 mb-2">
                  Lengkapi identitas operasional Anda untuk pencatatan kontrak dan penelusuran batch:
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      {role === 'SUPPLIER'
                        ? 'Nama Kelompok Tani / Usaha Produsen'
                        : role === 'KITCHEN_MANAGER'
                        ? 'Nama Satuan Dapur Gizi Massal'
                        : 'Nama Koperasi / Organisasi Hub'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        role === 'SUPPLIER'
                          ? 'Contoh: Poktan Makmur Hijau'
                          : role === 'KITCHEN_MANAGER'
                          ? 'Contoh: Dapur Berkah Gizi Mandiri'
                          : 'Contoh: Koperasi Lumbung Sukamaju'
                      }
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>

                  {role === 'SUPPLIER' && (
                    <div>
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                        Kategori Komoditas Pemasok
                      </label>
                      <select
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
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
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                        Nama Titik Kumpul / Gudang Antara
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Titik Kumpul Puncak Sukamaju"
                        value={collectionPointName}
                        onChange={(e) => setCollectionPointName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                      />
                    </div>
                  )}

                  {role === 'KITCHEN_MANAGER' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                          Kode Identifikasi Dapur
                        </label>
                        <input
                          type="text"
                          placeholder="DPR03"
                          value={kitchenCode}
                          onChange={(e) => setKitchenCode(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                          Kapasitas Porsi/Hari
                        </label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={portionCapacity}
                          onChange={(e) => setPortionCapacity(e.target.value)}
                          required
                          min="100"
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Titik Lokasi & Geospasial */}
            {currentStep === 4 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">
                    Tentukan titik koordinat untuk perhitungan jarak radius pengiriman (&lt;25 km):
                  </p>
                  <button
                    type="button"
                    onClick={handleApplyPresetCoordinates}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 hover:underline shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Auto Titik Demo</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                      Alamat Lengkap (Desa, Kecamatan, Jalan)
                    </label>
                    <input
                      type="text"
                      placeholder="Jl. Raya Pertanian No. 12, Desa..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                        Latitude GPS
                      </label>
                      <input
                        type="text"
                        placeholder="-6.5460"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold font-heading text-stone-700 block mb-1">
                        Longitude GPS
                      </label>
                      <input
                        type="text"
                        placeholder="106.8000"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50/50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white transition-all text-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-stone-600 font-sans flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span>
                      Koordinat GPS digunakan oleh mesin alokasi untuk menghitung radius pendek logistik & meminimalkan jejak karbon.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer Controls (Next / Prev / Submit) */}
          <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-stone-50/60 shrink-0 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 transition-all"
              >
                ← Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                variant="primary"
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs transition-all flex items-center gap-1.5"
                isLoading={isLoading}
              >
                <span>Selesaikan Pendaftaran</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
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
