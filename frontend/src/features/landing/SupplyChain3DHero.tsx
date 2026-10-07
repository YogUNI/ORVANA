import React, { useState } from 'react';
import {
  TrendingUp,
  RotateCw,
  ExternalLink,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupplyChain3DHero: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. TOP UTILITY BAR (CLEAN, MINIMAL, MATCHING ORVANA PALETTE) */}
      <div className="flex items-center justify-between w-full max-w-lg mb-2 px-2">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 hover:bg-white text-stone-700 hover:text-emerald-950 border border-stone-200/90 shadow-xs hover:shadow-md transition-all active:scale-95 backdrop-blur-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 text-emerald-800 transition-transform duration-500 ${isFlipped ? 'rotate-180' : 'group-hover:rotate-45'}`} />
          <span>{isFlipped ? 'Balik ke Simulasi 3D' : 'Balik ke Engine Alokasi'}</span>
          <span className="text-[10px] font-mono font-normal text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
            {isFlipped ? 'Depan' : 'Belakang'}
          </span>
        </button>

        <Link
          to="/trace/ORV-20260920-DPR01-0001"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>Uji Paspor QR</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. 3D FLIP CONTAINER (PERSPECTIVE CARD FLIP LIKE UNO / TRADING CARD) */}
      <div
        className="w-full max-w-lg aspect-[16/10] relative [perspective:1200px]"
      >
        <div
          className={`w-full h-full relative transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ================= FRONT SIDE: 3D FLOATING ISLAND ANIMATION ================= */}
          <div
            className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-2"
          >
            {/* FLOATING AMBIENT GLOW (SUBTLE ORVANA EMERALD & WARM AMBER) */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-500/10 via-amber-400/10 to-transparent blur-3xl opacity-70 pointer-events-none -z-10" />

            {/* SEAMLESS BLENDED VIDEO CONTAINER (ELIMINATES ALL RECTANGULAR EDGES) */}
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl"
              style={{
                // Contrast & brightness boost helps background hit pure white
                filter: 'contrast(1.08) brightness(1.04)',
                // Multiply mode dissolves the white/grey backdrop into the website's #FAF8F5
                mixBlendMode: 'multiply',
                // Heavy radial mask dissolves all 4 rectangular outer edges to 0 opacity
                maskImage: 'radial-gradient(ellipse 68% 68% at 50% 50%, black 45%, transparent 92%)',
                WebkitMaskImage: 'radial-gradient(ellipse 68% 68% at 50% 50%, black 45%, transparent 92%)',
              }}
            >
              <video
                src="/videos/hero-supply-chain.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain pointer-events-none scale-105"
              />
            </div>

            {/* QUICK FLIP HINT ON HOVER */}
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md text-[11px] font-mono text-white/90 border border-white/10 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Lihat Kalkulasi Engine</span>
            </button>
          </div>

          {/* ================= BACK SIDE: LIVE MATCHING ENGINE ALGORITHM CARD ================= */}
          <div
            className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-stone-950 text-white rounded-3xl border border-stone-800/80 p-5 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-bl-full pointer-events-none" />

            {/* Header Card */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold tracking-tight text-white uppercase">
                    Live Matching Engine
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    Cap 60%
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="p-1 text-stone-400 hover:text-white transition-colors"
                    title="Balik ke Animasi"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Requirement Summary */}
              <div className="p-3 bg-stone-900/80 rounded-xl border border-white/10 mb-2.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Dapur Gizi Mandiri (DPR01)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">1.000 Porsi</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-white">Bahan: Bayam Hijau</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    69,0 kg
                  </span>
                </div>
              </div>

              {/* Allocation List */}
              <div className="space-y-1.5">
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Kelompok Tani Makmur (S1)</span>
                      <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">Skor 88,97</span>
                    </div>
                    <p className="text-[10px] font-mono text-stone-400">
                      Radius 6 km • Mutu 88 • Panen H-1
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-emerald-300 block">40,0 kg</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Rp 320.000</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Gapoktan Sumber Berkah (S2)</span>
                      <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">Skor 84,20</span>
                    </div>
                    <p className="text-[10px] font-mono text-stone-400">
                      Radius 9 km • Mutu 90 • Panen H-0
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-amber-300 block">29,0 kg</span>
                    <span className="text-[10px] text-amber-400 font-semibold">Rp 232.000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Status */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-stone-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Alokasi Terpenuhi 100%
              </span>
              <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Escrow: Rp 552.000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CAPTION UNDER CARD */}
      <div className="w-full max-w-lg mt-2 px-2 flex items-center justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-stone-700">
            Alur Rantai Pasok Terintegrasi:
          </span>
          <span className="hidden sm:inline">Lahan Petani ➔ Dapur Gizi Massal</span>
        </span>
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="font-mono text-[11px] text-emerald-800 hover:text-emerald-950 underline font-semibold transition-colors"
        >
          {isFlipped ? 'Lihat Animasi' : 'Buka Detail Engine'}
        </button>
      </div>
    </div>
  );
};
