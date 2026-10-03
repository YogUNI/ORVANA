import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Sprout, ShieldCheck, Truck, Scale } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-heading font-black text-lg">
              O
            </span>
            <span className="font-heading font-bold text-xl text-gray-900 tracking-tight">
              ORVANA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login">
              <Button variant="outline" size="sm">
                Masuk
              </Button>
            </a>
            <a href="/register">
              <Button variant="primary" size="sm">
                Daftar
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge color="accent" className="mb-4">
            Rantai Pasok Pangan Lokal Dapur Gizi Massal
          </Badge>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Menghubungkan Kebutuhan Dapur dengan Panen Produsen Lokal
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Mencocokkan kebutuhan terjadwal dapur gizi massal dengan rencana panen petani & nelayan lokal secara transparan, adil dengan harga dasar, berstandar mutu terverifikasi, dan tertelusur.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-2">
                <Sprout className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Kepastian Pasar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Pemasok mendapatkan kepastian permintaan terencana dengan harga terlindungi dari ambang batas dasar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-accent flex items-center justify-center mb-2">
                <Scale className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Pencocokan Cerdas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Algoritma alokasi berkeadilan menghitung jarak, mutu, kesegaran, keandalan, dan batasan porsi pemasok.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Konsolidasi Logistik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Koordinator lokal mengumpulkan pasokan ke titik kumpul dan mengantarkannya tepat waktu dalam satu pengiriman.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Mutu & Penelusuran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-500">
                Kontrol mutu checklist di dapur gizi, jejak asal bahan berbasis kode batch publik, dan pencatatan dana amanah.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Trace Search Placeholder */}
        <div className="bg-white rounded-card border border-gray-200 p-6 sm:p-8 max-w-xl mx-auto shadow-sm text-center">
          <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
            Lacak Asal Bahan Makanan
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Masukkan kode batch untuk melihat riwayat panen, pengiriman, dan hasil uji mutu.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Contoh: ORV-20261012-DPR01-0001"
              className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand focus:outline-none"
            />
            <Button variant="primary" size="md">
              Telusuri
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
