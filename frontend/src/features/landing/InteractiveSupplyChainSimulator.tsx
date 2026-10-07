import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Scale,
  Lock,
  ArrowRight,
  BadgeCheck,
  Truck,
  Building2,
  Leaf,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

type ActiveZone = 'farm' | 'logistics' | 'kitchen';

export const InteractiveSupplyChainSimulator: React.FC = () => {
  const [activeZone, setActiveZone] = useState<ActiveZone>('farm');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(1);
  const [portionCount, setPortionCount] = useState(1200);

  // Kalkulasi dinamis berdasarkan slider porsi
  const berasKg = Math.round((portionCount * 0.12) * 10) / 10;
  const ayamKg = Math.round((portionCount * 0.08) * 10) / 10;
  const sayurKg = Math.round((portionCount * 0.09) * 10) / 10;
  const estimasiNilai = Math.round(portionCount * 14500);

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setActiveZone('farm');

    setTimeout(() => {
      setSimulationStep(2);
      setActiveZone('logistics');
    }, 1100);

    setTimeout(() => {
      setSimulationStep(3);
      setActiveZone('kitchen');
    }, 2200);

    setTimeout(() => {
      setIsSimulating(false);
    }, 3300);
  };

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
      {/* Outer Studio Frame */}
      <div className="rounded-3xl bg-gradient-to-b from-[#F7F4ED] via-[#F4F0E6] to-[#ECE6D8] border border-stone-300/80 p-6 sm:p-8 lg:p-10 shadow-lg shadow-stone-900/5 relative overflow-hidden text-stone-900">
        
        {/* Subtle Ambient Decorative Circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Top Stamp / Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-stone-300/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700">
              Interactive Agritech Console • Arsitektur Rantai Pasok Terbuka
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="font-mono text-[10px] bg-white/80 text-emerald-950 font-bold px-3 py-1 rounded-full border border-stone-300 shadow-2xs">
              Live Algoritma Pencocokan 2026
            </span>
          </div>
        </div>

        {/* Headline & Mission Pitch */}
        <div className="pt-6 pb-8 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>ZERO DEAD-STOCK & KUOTA ANTI-MONOPOLI 60%</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-950 tracking-tight leading-snug">
            Simulasikan Rantai Pasok Pangan Mandiri dari Kebun ke Dapur.
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm font-sans leading-relaxed">
            Klik simpul interaktif di diagram hidup bawah ini untuk melihat bagaimana algoritma ORVANA mengunci kuota panen, memandu armada pendingin, hingga mencairkan pembayaran otomatis di buku kas digital.
          </p>
        </div>

        {/* ================= PUSAT ATRAKSI: THE LIVING VECTOR SUPPLY CHAIN DIORAMA (100% CODE) ================= */}
        <div className="relative rounded-2xl bg-[#0E1A14] border border-emerald-900/40 p-5 sm:p-7 shadow-2xl overflow-hidden text-white mb-8">
          
          {/* Subtle Cyber Grid Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(52, 211, 153, 0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Interactive Simulation Trigger Floating Control */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-emerald-900/50">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                Status Sistem:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {isSimulating ? `Menjalankan Alur Fase ${simulationStep}/3...` : 'Siap Beroperasi'}
              </span>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 text-xs font-bold font-sans shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Memproses Simulasi...' : 'Jalankan Uji Alur Instan'}</span>
            </button>
          </div>

          {/* SVG LIVING NETWORK PIPELINE */}
          <div className="relative py-8 sm:py-10">
            {/* Background SVG Animated Flow Wires */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block" 
              preserveAspectRatio="none"
              viewBox="0 0 800 200"
            >
              {/* Wire 1: Farm to Logistics */}
              <path
                d="M 180 100 C 270 100, 310 100, 400 100"
                fill="none"
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <path
                d="M 180 100 C 270 100, 310 100, 400 100"
                fill="none"
                stroke={activeZone === 'farm' || isSimulating ? '#34D399' : 'rgba(52, 211, 153, 0.4)'}
                strokeWidth={activeZone === 'farm' ? "3.5" : "2"}
                className={activeZone === 'farm' || isSimulating ? "animate-laser-flow" : ""}
                strokeDasharray="16 32"
              />

              {/* Wire 2: Logistics to Kitchen */}
              <path
                d="M 400 100 C 490 100, 530 100, 620 100"
                fill="none"
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <path
                d="M 400 100 C 490 100, 530 100, 620 100"
                fill="none"
                stroke={activeZone === 'kitchen' || isSimulating ? '#34D399' : 'rgba(52, 211, 153, 0.4)'}
                strokeWidth={activeZone === 'kitchen' ? "3.5" : "2"}
                className={activeZone === 'kitchen' || isSimulating ? "animate-laser-flow" : ""}
                strokeDasharray="16 32"
              />
            </svg>

            {/* THREE INTERACTIVE LIVING NODES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
              
              {/* NODE 1: FARM NODE */}
              <button
                type="button"
                onClick={() => setActiveZone('farm')}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                  activeZone === 'farm'
                    ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-emerald-950/30 border-emerald-900/60 hover:bg-emerald-950/60 hover:border-emerald-700/60'
                }`}
              >
                {/* Node Active Pulsing Dot */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    activeZone === 'farm' ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/50' : 'bg-emerald-900/40 text-emerald-400'
                  }`}>
                    <Leaf className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
                    SIMPUL 01
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Petani & Nelayan Lokal
                  </h4>
                  <p className="text-[11px] text-stone-300 font-sans leading-relaxed">
                    Input rencana panen. Kuota terkunci di muka tanpa permainan tengkulak.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-stone-400">Proteksi Harga:</span>
                  <span className="text-emerald-400 font-bold">100% Floor Price</span>
                </div>
              </button>

              {/* NODE 2: LOGISTICS COORDINATOR NODE */}
              <button
                type="button"
                onClick={() => setActiveZone('logistics')}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                  activeZone === 'logistics'
                    ? 'bg-emerald-950/80 border-amber-400 ring-2 ring-amber-500/40 shadow-xl shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-emerald-950/30 border-emerald-900/60 hover:bg-emerald-950/60 hover:border-emerald-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    activeZone === 'logistics' ? 'bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/50' : 'bg-emerald-900/40 text-amber-400'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-amber-900">
                    SIMPUL 02
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    Armada & Pengepul
                  </h4>
                  <p className="text-[11px] text-stone-300 font-sans leading-relaxed">
                    Konsolidasi rute jemput cepat &lt; 25 km dengan timbangan digital anti-susut.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-stone-400">Radius Dingin:</span>
                  <span className="text-amber-400 font-bold">&lt; 25 km Terjaga</span>
                </div>
              </button>

              {/* NODE 3: KITCHEN HUB NODE */}
              <button
                type="button"
                onClick={() => setActiveZone('kitchen')}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                  activeZone === 'kitchen'
                    ? 'bg-emerald-950/80 border-sky-400 ring-2 ring-sky-500/40 shadow-xl shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-emerald-950/30 border-emerald-900/60 hover:bg-emerald-950/60 hover:border-emerald-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    activeZone === 'kitchen' ? 'bg-sky-400 text-stone-950 shadow-lg shadow-sky-400/50' : 'bg-emerald-900/40 text-sky-400'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-sky-900">
                    SIMPUL 03
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    Dapur Gizi Massal
                  </h4>
                  <p className="text-[11px] text-stone-300 font-sans leading-relaxed">
                    Uji mutu lolos seketika, QR paspor gizi tercetak, pencairan DP 30% dan kas 70%.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-stone-400">Uji Mutu Nutrisi:</span>
                  <span className="text-sky-400 font-bold">100% Lolos Lab</span>
                </div>
              </button>

            </div>
          </div>

          {/* DYNAMIC SIMULATOR LIVE TELEMETRY BAR */}
          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-emerald-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-400 font-bold">Kalkulator Beban Dapur:</span>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={portionCount}
                onChange={(e) => setPortionCount(Number(e.target.value))}
                className="accent-emerald-400 cursor-pointer w-32 sm:w-48"
              />
              <span className="font-mono font-bold text-amber-300">{portionCount.toLocaleString('id-ID')} Porsi Anak</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
              <span className="text-stone-300">
                🌾 Beras: <strong className="text-white">{berasKg} kg</strong>
              </span>
              <span className="text-stone-300">
                🍗 Ayam: <strong className="text-white">{ayamKg} kg</strong>
              </span>
              <span className="text-stone-300">
                🥬 Sayur: <strong className="text-white">{sayurKg} kg</strong>
              </span>
              <span className="text-emerald-300">
                💵 Putaran Kas: <strong>Rp {estimasiNilai.toLocaleString('id-ID')}</strong>
              </span>
            </div>
          </div>

        </div>

        {/* ================= SISI BAWAH: PHYSICAL BOARDING PASS MITRA & AKSI REGISTRASI ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Safeguard Guarantees (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              3 Prinsip Anti-Monopoli yang Terkunci di Sistem
            </h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Seluruh transaksi dipantau auditor publik dan dinas terkait untuk memastikan pemerataan rezeki di tingkat tapak.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-emerald-950">01. Lisensi Bebas Biaya</div>
                  <div className="text-[11px] text-stone-600">Tanpa potongan admin terselubung bagi kelompok tani & nelayan.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-emerald-950">02. Kuota Adil Maksimal 60%</div>
                  <div className="text-[11px] text-stone-600">Mencegah konglomerasi pemasok tunggal memonopoli dapur sekolah.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-emerald-950">03. Buku Besar Audit Transparan</div>
                  <div className="text-[11px] text-stone-600">Pencairan pembayaran tercatat di ledger terverifikasi publik.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Boarding Pass Card (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-stone-300 shadow-md p-6 sm:p-7 space-y-5 font-sans relative overflow-hidden">
              
              {/* Notched Stub Graphic on edges */}
              <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#EDE7DA] border border-stone-300 pointer-events-none -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#EDE7DA] border border-stone-300 pointer-events-none -translate-y-1/2" />

              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                    Tiket Pendaftaran Resmi
                  </span>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mt-1">
                    {activeZone === 'farm' && 'Mitra Produsen: Petani, Peternak, Nelayan'}
                    {activeZone === 'logistics' && 'Mitra Logistik: Pengepul & Koordinator Wilayah'}
                    {activeZone === 'kitchen' && 'Mitra Konsumsi: Pengelola Dapur Gizi Massal'}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 block">Status Kuota</span>
                  <span className="font-mono text-xs font-bold text-emerald-900">Tersedia 2026</span>
                </div>
              </div>

              {/* Dynamic Benefits depending on zone */}
              <ul className="space-y-2 text-xs text-stone-600">
                {activeZone === 'farm' && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Daftarkan panen lewat formulir cepat atau asisten WhatsApp bot resmi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Terima jaminan serapan dan penjemputan hasil bumi langsung di kebun.</span>
                    </li>
                  </>
                )}
                {activeZone === 'logistics' && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Optimalisasi rute otomatis menghemat konsumsi BBM armada &lt; 25 km.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Timbangan digital tercatat di lokasi menghapus perselisihan susut bobot muatan.</span>
                    </li>
                  </>
                )}
                {activeZone === 'kitchen' && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Kalkulasi menu otomatis memasangkan kebutuhan gizi dengan bahan lokal segar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span>Penerbitan label paspor QR digital batch untuk audit publik & wali siswa.</span>
                    </li>
                  </>
                )}
              </ul>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Link to="/register" className="flex-1">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <span>Daftar Sebagai {activeZone === 'farm' ? 'Produsen' : activeZone === 'logistics' ? 'Koordinator' : 'Pengelola Dapur'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to="/login" className="sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-stone-300 text-stone-700 hover:bg-stone-50 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    <span>Masuk Portal</span>
                  </Button>
                </Link>
              </div>

              {/* Verified Barcode Stamp */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="tracking-widest font-bold text-stone-400">||| | |||| || |</span>
                  <span className="text-[9px] text-stone-400">PASS: ORV-SIM-2026</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>SISTEM TERVERIFIKASI RESMI</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
