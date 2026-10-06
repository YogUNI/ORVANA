import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Truck,
  Leaf,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StageInfo {
  step: number;
  role: string;
  title: string;
  badge: string;
  badgeColor: string;
  metric: string;
  desc: string;
}

const STAGES: StageInfo[] = [
  {
    step: 1,
    role: 'PETANI / PEMASOK',
    title: 'Panen Segar Petani Desa',
    badge: 'Hulu Produksi',
    badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    metric: '40,0 kg Bayam Hijau (Skor Mutu 88)',
    desc: 'Bahan dipetik subuh hari, terikat batas kuota adil maksimal 60% agar seluruh petani desa kebagian rezeki.',
  },
  {
    step: 2,
    role: 'LOGISTIK KOORDINATOR',
    title: 'Transit Rantai Dingin Tersegel',
    badge: 'Dalam Perjalanan',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-300',
    metric: 'Temp: +4,2°C • Jarak: 6,2 km (18 Menit)',
    desc: 'Armada logistik berpendingin membawa peti panen dengan segel paspor digital QR tahan manipulasi.',
  },
  {
    step: 3,
    role: 'DAPUR GIZI & QC',
    title: 'Inspeksi Ahli Gizi & Masak Massal',
    badge: 'Hilir Konsumsi',
    badgeColor: 'bg-sky-100 text-sky-950 border-sky-300',
    metric: 'QC 100% Lolos • Dana Escrow Cair',
    desc: 'Bahan ditimbang digital dan diuji standar higienis HACCP sebelum diolah menjadi 1.000 porsi gizi harian.',
  },
];

export const ScrollStorytellingActor: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hitung progres scroll antara hero (offset 250px) ke section berikutnya (offset 1100px)
  const startOffset = 250;
  const endOffset = 1100;
  const rawProgress = (scrollY - startOffset) / (endOffset - startOffset);
  const progress = Math.max(0, Math.min(1, rawProgress));

  // Tentukan fase saat ini berdasarkan progress scroll
  let activeStageIndex = 0;
  if (progress > 0.66) {
    activeStageIndex = 2;
  } else if (progress > 0.33) {
    activeStageIndex = 1;
  }
  const currentStage = STAGES[activeStageIndex];

  // Nilai transformasi 3D halus (Keynote presentation morph style)
  // translateX: bergeser dari kanan (+80px) melengkung ke tengah (-40px) lalu ke posisi stabil
  const translateX = (1 - progress) * 60 - Math.sin(progress * Math.PI) * 40;
  // translateY: mengikuti alur scroll sedikit melayang
  const translateY = Math.sin(progress * Math.PI) * -15;
  // rotate: rotasi 3D kemiringan peti saat dibawa meluncur
  const rotateZ = (progress - 0.5) * 12; // -6deg s/d +6deg
  const rotateX = Math.cos(progress * Math.PI) * 6; // efek 3D tilt

  return (
    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 my-10 select-none">
      {/* Interactive Presentation Morphing Container */}
      <div className="relative bg-gradient-to-br from-white/95 via-[#FAF8F5]/90 to-emerald-50/80 backdrop-blur-xl rounded-3xl border-2 border-emerald-900/15 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle Ambient Background Ornaments */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Header Ribbon: Presentation Timeline Progress */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/90 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-950 uppercase block">
                Visualisasi Alur Dinamis Rantai Pasok
              </span>
              <span className="text-[11px] text-stone-500 font-sans">
                Scroll halaman untuk melihat perpindahan komoditas secara 3D
              </span>
            </div>
          </div>

          {/* Stepper Dots (Interactive PPT Stage Indicator) */}
          <div className="flex items-center gap-2 bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200/80">
            {STAGES.map((stage, idx) => {
              const isPastOrActive = idx <= activeStageIndex;
              const isCurrent = idx === activeStageIndex;
              return (
                <div key={stage.step} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-emerald-900 text-white shadow-xs scale-105'
                        : isPastOrActive
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-stone-400'
                    }`}
                  >
                    <span>0{stage.step}</span>
                    <span className="hidden md:inline font-sans font-semibold text-[11px]">
                      {stage.role.split(' ')[0]}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <span className="text-stone-300 text-xs">➔</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Body: Split Interactive Presentation */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Kolom Kiri: 3D Object Actor yang Bergerak Mengikuti Scroll */}
          <div className="lg:col-span-5 flex justify-center items-center perspective-1000">
            <div
              style={{
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotateZ(${rotateZ}deg) rotateX(${rotateX}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-200/90 bg-white group cursor-pointer"
            >
              {/* Gambar 3D Peti Kayu Panen Bespoke */}
              <img
                src="/images/orvana-3d-crate.jpg"
                alt="Peti Panen 3D Berlabel QR Batch"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Floating Hologram QR Badge Over Crate */}
              <div className="absolute bottom-3 left-3 right-3 bg-stone-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-stone-700/80 text-white text-left flex items-center justify-between gap-2 shadow-xl">
                <div className="flex items-center gap-2 truncate">
                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] font-mono text-stone-400 block leading-tight">
                      Paspor Digital Batch
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300 truncate block">
                      #ORV-20260920-DPR01
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0 font-bold">
                  LIVE
                </span>
              </div>

              {/* Glowing Particle Sparks di Sekeliling Peti */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-ping pointer-events-none" />
            </div>
          </div>

          {/* Kolom Kanan: Narasi Interaktif Sesuai Posisi Scroll */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300/80">
                FASE {currentStage.step}: {currentStage.role}
              </span>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${currentStage.badgeColor}`}>
                {currentStage.badge}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight leading-snug">
              {currentStage.title}
            </h3>

            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              {currentStage.desc}
            </p>

            {/* Metrik Highlight Card */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  {currentStage.step === 1 && <Leaf className="w-5 h-5 text-emerald-800" />}
                  {currentStage.step === 2 && <Truck className="w-5 h-5 text-amber-600" />}
                  {currentStage.step === 3 && <ShieldCheck className="w-5 h-5 text-sky-700" />}
                </div>
                <div>
                  <span className="text-[11px] font-mono text-stone-500 block uppercase font-bold">
                    Parameter Status Operasional:
                  </span>
                  <span className="text-sm font-mono font-extrabold text-stone-950 block">
                    {currentStage.metric}
                  </span>
                </div>
              </div>

              <Link to="/trace/ORV-20260920-DPR01-0001">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs whitespace-nowrap"
                >
                  <span>Lihat Paspor QR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>

            {/* Micro Progress Bar Scroll Journey */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-stone-500">
                <span>Perjalanan Rantai Pasok:</span>
                <span>{Math.round(progress * 100)}% Menuju Dapur Gizi</span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(8, progress * 100)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-sky-600 rounded-full transition-all duration-100"
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
