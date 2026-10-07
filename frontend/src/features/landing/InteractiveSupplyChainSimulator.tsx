import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Scale,
  Lock,
  ArrowRight,
  BadgeCheck,
  Leaf,
  Truck,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

type RoleTab = 'supplier' | 'kitchen' | 'coordinator';

export const InteractiveSupplyChainSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RoleTab>('supplier');

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
      {/* Sleek Compact Studio Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#F7F4EE] via-[#F4F0E8] to-[#ECE7DC] border border-stone-300/80 p-6 sm:p-8 shadow-sm relative overflow-hidden text-stone-900">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/[0.03] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/[0.03] rounded-full blur-2xl pointer-events-none" />

        {/* Top Minimal Stamp */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-300/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Registrasi Kemitraan Rantai Pasok 2026
            </span>
          </div>
          <span className="font-mono text-[9px] bg-white/80 text-emerald-950 font-bold px-2.5 py-0.5 rounded-full border border-stone-300 shadow-2xs">
            Lisensi Terverifikasi
          </span>
        </div>

        {/* Compact Grid: Left Pitch + Right Artisan Pass */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-5">
          
          {/* SISI KIRI: Tipografi Bersih + 3 Proteksi Elegan (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-950 border border-emerald-800/15 text-[10px] font-mono font-bold mb-2">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>INTEGRASI RANTAI PASOK</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-950 leading-snug">
                Wujudkan Ekosistem Pangan Mandiri & Bermutu.
              </h3>
            </div>

            <p className="text-stone-600 text-xs font-sans leading-relaxed">
              Jembatan pengadaan terencana yang mengikat kuota panen produsen lokal dengan kebutuhan dapur gizi massal secara transparan dan bergaransi.
            </p>

            {/* 3 Micro Safeguards */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/80 border border-stone-200/80 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] leading-tight">
                  <strong className="text-stone-900">Bebas Biaya:</strong> <span className="text-stone-600">Gratis lisensi kelompok tani & nelayan.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/80 border border-stone-200/80 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] leading-tight">
                  <strong className="text-stone-900">Kuota Adil 60%:</strong> <span className="text-stone-600">Anti-monopoli pemasok tunggal.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/80 border border-stone-200/80 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] leading-tight">
                  <strong className="text-stone-900">Kas Digital:</strong> <span className="text-stone-600">Buku besar audit real-time publik.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SISI KANAN: Artisan Boarding Pass Ringkas & Interaktif (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-stone-300/90 shadow-sm overflow-hidden font-sans relative">
              
              {/* Notched Ticket Holes (Simpel & Elegan) */}
              <div className="absolute top-1/2 -left-2.5 w-5 h-5 rounded-full bg-[#EFEAE0] border border-stone-300 pointer-events-none -translate-y-1/2" />
              <div className="absolute top-1/2 -right-2.5 w-5 h-5 rounded-full bg-[#EFEAE0] border border-stone-300 pointer-events-none -translate-y-1/2" />

              {/* Persona Selector Pill Tabs */}
              <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-100/70 p-1.5 gap-1 text-[11px] font-mono font-bold">
                {[
                  { id: 'supplier', label: 'Petani & Ternak', icon: Leaf },
                  { id: 'kitchen', label: 'Dapur Gizi', icon: Building2 },
                  { id: 'coordinator', label: 'Koordinator', icon: Truck },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-950 text-white shadow-2xs font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Content */}
              <div className="p-5 sm:p-6 space-y-4">
                
                {/* Header Info */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-bold">
                      {activeTab === 'supplier' && 'Peran: Produsen Pangan'}
                      {activeTab === 'kitchen' && 'Peran: Pengelola Dapur'}
                      {activeTab === 'coordinator' && 'Peran: Logistik Wilayah'}
                    </span>
                    <h4 className="font-serif text-base font-bold text-stone-900 mt-1">
                      {activeTab === 'supplier' && 'Petani, Peternak, & Nelayan'}
                      {activeTab === 'kitchen' && 'Dapur Gizi Massal & Asrama'}
                      {activeTab === 'coordinator' && 'Koordinator & Armada Wilayah'}
                    </h4>
                  </div>
                  <div className="text-right bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                    <span className="font-mono text-[9px] text-stone-400 block">Jaminan Sistem</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-900">
                      {activeTab === 'supplier' && '10-14 Hari di Muka'}
                      {activeTab === 'kitchen' && 'Kalkulasi Otomatis'}
                      {activeTab === 'coordinator' && '< 25 km Terjaga'}
                    </span>
                  </div>
                </div>

                {/* Core Points */}
                <ul className="space-y-2 text-xs text-stone-600 leading-snug">
                  {activeTab === 'supplier' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Input jadwal panen via web atau asisten chat WhatsApp tanpa form rumit.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Proteksi harga dasar resmi daerah mencegah permainan tengkulak.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Pencairan dana langsung ke rekening setelah uji mutu lolos di dapur.</span>
                      </li>
                    </>
                  )}
                  {activeTab === 'kitchen' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Konversi porsi makan anak ke kebutuhan kilogram bahan mentah seketika.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Algoritma pencocokan memasangkan kebutuhan dengan petani lokal terdekat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Penerbitan label QR paspor batch otomatis untuk pengawasan dinas.</span>
                      </li>
                    </>
                  )}
                  {activeTab === 'coordinator' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Gabungkan titik jemput panen dari kelompok tani dalam rute tercepat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Pencatatan timbangan digital di lokasi menghapus sengketa susut muatan.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono font-bold text-emerald-700">✓</span>
                        <span>Pengantaran terjadwal memastikan komoditas segar tiba tepat waktu.</span>
                      </li>
                    </>
                  )}
                </ul>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link to="/register" className="flex-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold py-2 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 text-xs cursor-pointer hover:scale-[1.01] transition-transform"
                    >
                      <span>
                        Daftar Sebagai {activeTab === 'supplier' ? 'Produsen' : activeTab === 'kitchen' ? 'Dapur Gizi' : 'Koordinator'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link to="/login" className="sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-stone-300 text-stone-700 hover:bg-stone-50 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      <span>Masuk Portal</span>
                    </Button>
                  </Link>
                </div>

                {/* Footer Stamp */}
                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="tracking-widest font-bold text-stone-300">||| | |||| ||</span>
                    <span className="text-stone-400">ORV-MITRA-2026</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>TERVERIFIKASI RESMI</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
