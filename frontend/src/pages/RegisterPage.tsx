import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { Role, SupplierType } from '../features/auth/types';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('-6.5460');
  const [longitude, setLongitude] = useState('106.8000');

  // Khusus Koordinator
  const [collectionPointName, setCollectionPointName] = useState('');

  // Khusus Dapur
  const [kitchenCode, setKitchenCode] = useState('DPR01');
  const [portionCapacity, setPortionCapacity] = useState('1000');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <img src="/logo-icon.svg" alt="ORVANA" className="w-10 h-10 object-contain drop-shadow-sm" />
            <span className="font-heading font-extrabold text-2xl text-pine-950 tracking-tight">ORVANA</span>
          </Link>
          <h2 className="font-serif font-bold text-2xl text-pine-950">
            Daftar Akun Baru
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-sans">
            Pilih peran Anda untuk terhubung ke ekosistem rantai pasok pangan gizi massal
          </p>
        </div>

        <Card>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-status-danger text-sm rounded">
                {error}
              </div>
            )}

            {/* Pilihan Peran */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Daftar Sebagai:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: 'SUPPLIER', label: 'Petani / Nelayan' },
                  { r: 'KITCHEN_MANAGER', label: 'Pengelola Dapur' },
                  { r: 'COORDINATOR', label: 'Koordinator' },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setRole(item.r as Role)}
                    className={`py-2 px-2 text-xs font-semibold rounded border text-center transition-colors min-h-[44px] ${
                      role === item.r
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="font-heading font-semibold text-sm text-gray-800 border-b pb-1">
                Data Akun
              </h4>
              <Input
                label="Nama Lengkap"
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Alamat Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Kata Sandi (min 8 karakter + 1 angka)"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Nomor Telepon / WhatsApp"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <h4 className="font-heading font-semibold text-sm text-gray-800 border-b pb-1 pt-2">
                Profil {role === 'SUPPLIER' ? 'Pemasok' : role === 'KITCHEN_MANAGER' ? 'Dapur' : 'Koordinator'}
              </h4>

              <Input
                label={
                  role === 'SUPPLIER'
                    ? 'Nama Usaha / Kelompok Tani'
                    : role === 'KITCHEN_MANAGER'
                    ? 'Nama Dapur Gizi'
                    : 'Nama Organisasi / Koperasi'
                }
                placeholder="Contoh: Tani Makmur"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              {role === 'SUPPLIER' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Jenis Pemasok
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-gray-300 rounded focus:ring-2 focus:ring-brand focus:outline-none"
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                  >
                    <option value="FARMER">Petani Sayur / Pangan (FARMER)</option>
                    <option value="FISHER">Nelayan / Pembudidaya Ikan (FISHER)</option>
                    <option value="LIVESTOCK">Peternak Unggas / Telur (LIVESTOCK)</option>
                    <option value="PROCESSOR">UMKM Olahan Pangan (PROCESSOR)</option>
                  </select>
                </div>
              )}

              {role === 'COORDINATOR' && (
                <Input
                  label="Nama Titik Kumpul"
                  placeholder="Contoh: Titik Kumpul Sukamaju"
                  value={collectionPointName}
                  onChange={(e) => setCollectionPointName(e.target.value)}
                  required
                />
              )}

              {role === 'KITCHEN_MANAGER' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Kode Dapur"
                    placeholder="DPR01"
                    value={kitchenCode}
                    onChange={(e) => setKitchenCode(e.target.value)}
                    required
                  />
                  <Input
                    label="Kapasitas Porsi/Hari"
                    type="number"
                    placeholder="1000"
                    value={portionCapacity}
                    onChange={(e) => setPortionCapacity(e.target.value)}
                    required
                  />
                </div>
              )}

              <Input
                label="Alamat Lokasi Lengkap"
                placeholder="Jalan, RT/RW, Desa, Kecamatan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  type="text"
                  placeholder="-6.5460"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
                <Input
                  label="Longitude"
                  type="text"
                  placeholder="106.8000"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4"
                isLoading={isLoading}
              >
                Kirim Pendaftaran
              </Button>
            </form>

            <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="font-medium text-brand hover:underline">
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
