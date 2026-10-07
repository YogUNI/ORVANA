import React, { useState } from 'react';
import {
  ExternalLink,
  Lock,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupplyChain3DHero: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. TOP SINGLE INTUITIVE TOGGLE BAR (THE ONLY MASTER BUTTON) */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-3 px-3">
        {/* SINGLE MASTER 3D PERSPECTIVE TOGGLE PILL */}
        <div className="inline-flex items-center p-1 bg-stone-900/90 hover:bg-stone-900 backdrop-blur-xl rounded-2xl border border-stone-800 shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !isFlipped
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulasi 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isFlipped
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engine Alokasi</span>
          </button>
        </div>

        <Link
          to="/trace/ORV-20260920-DPR01-0001"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <span>Uji Paspor QR</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. 3D FLIP CONTAINER WITH IDENTICAL EXPANDED FIXED DIMENSIONS */}
      <div className="w-full max-w-2xl h-[420px] sm:h-[440px] relative [perspective:1400px]">
        <div
          className={`w-full h-full relative transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ================= FRONT SIDE: 3D FLOATING ISLAND (100% BORDERLESS, ZERO CARD LINE) ================= */}
          <div
            className="absolute inset-0 w-full h-full [backface-visibility:hidden] flex flex-col items-center justify-center p-0"
          >
            {/* FLOATING AMBIENT GLOW BACKDROP */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-500/10 via-amber-400/10 to-transparent blur-3xl opacity-80 pointer-events-none -z-10" />

            {/* SEAMLESS BLENDED VIDEO CONTAINER (EXPANDED TO PREVENT ANY EDGE CLIPPING) */}
            <div
              className="relative w-[115%] h-[115%] flex items-center justify-center pointer-events-none"
              style={{
                filter: 'contrast(1.12) brightness(1.08)',
                mixBlendMode: 'multiply',
                maskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 72%)',
              }}
            >
              <video
                src="/videos/hero-supply-chain.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disableRemotePlayback
                className="w-full h-full object-contain scale-110 will-change-transform"
              />
            </div>
          </div>

          {/* ================= BACK SIDE: 3D CYBER-DATA GREENHOUSE & ENGINE LAB (BORDERLESS & SEAMLESS BLEND) ================= */}
          <div
            className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-0"
          >
            {/* FLOATING AMBIENT GLOW BACKDROP (CYBER EMERALD & CYAN) */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/15 to-amber-400/10 blur-3xl opacity-80 pointer-events-none -z-10" />

            {/* SEAMLESS BLENDED VIDEO CONTAINER (ELIMINATES ALL RECTANGULAR EDGES) */}
            <div
              className="relative w-[110%] h-[110%] flex items-center justify-center pointer-events-none"
              style={{
                filter: 'contrast(1.12) brightness(1.08)',
                mixBlendMode: 'multiply',
                maskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 35%, transparent 72%)',
              }}
            >
              <video
                src="/videos/hero-engine-allocation.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disableRemotePlayback
                className="w-full h-full object-contain scale-110 will-change-transform"
              />
            </div>

            {/* FLOATING HUD BADGE TOP-LEFT (LIVE ENGINE STATUS) */}
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-stone-900/80 hover:bg-stone-900 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg transition-all pointer-events-auto">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono font-bold tracking-tight text-white uppercase leading-none">
                  Cyber Engine Lab
                </span>
                <span className="text-[9px] font-mono text-emerald-400 leading-tight mt-0.5">
                  Fair Split Cap 60%
                </span>
              </div>
            </div>

            {/* FLOATING HUD BADGE TOP-RIGHT (SMART ESCROW STATUS) */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-stone-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10 shadow-lg text-[10px] font-mono text-emerald-300 pointer-events-auto">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Escrow: Rp 552.000</span>
            </div>

            {/* FLOATING HUD BADGE BOTTOM-LEFT (ALLOCATION STATS) */}
            <div className="absolute bottom-2 left-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg text-left pointer-events-auto max-w-[200px]">
              <div className="flex items-center justify-between text-[10px] font-bold text-white mb-0.5">
                <span>Alokasi Petani</span>
                <span className="text-emerald-400 font-mono">100%</span>
              </div>
              <p className="text-[9px] text-stone-300 font-mono leading-tight">
                S1 Makmur: 40 kg (58%)<br />
                S2 Berkah: 29 kg (42%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CAPTION UNDER CARD (CLEAN & CENTERED, NO REDUNDANT BUTTONS) */}
      <div className="w-full max-w-2xl mt-3 px-2 flex items-center justify-center text-xs text-stone-500">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-stone-700">
            {isFlipped ? 'Cyber Engine Lab:' : 'Alur Rantai Pasok Terintegrasi:'}
          </span>
          <span>
            {isFlipped ? 'Hologram AI Alokasi Kuota & Brankas Escrow' : 'Lahan Petani ➔ Dapur Gizi Massal'}
          </span>
        </span>
      </div>
    </div>
  );
};
