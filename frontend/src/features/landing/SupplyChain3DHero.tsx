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
      {/* 1. TOP SUBTLE LINK BAR (LEAN, ULTRA-CLEAN, ZERO BULKY BUTTONS) */}
      <div className="flex items-center justify-end w-full max-w-2xl mb-1 px-4">
        <Link
          to="/trace/ORV-20260920-DPR01-0001"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors py-1"
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
            <div className="absolute top-3 left-4 flex items-center gap-2.5 bg-white/90 hover:bg-white backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-stone-200/90 shadow-md shadow-stone-900/5 transition-all pointer-events-auto">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="font-bold text-stone-900 uppercase tracking-tight">Algoritma Alokasi</span>
                <span className="text-stone-300">|</span>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 text-[10px]">
                  Cap 60%
                </span>
              </div>
            </div>

            {/* FLOATING HUD BADGE TOP-RIGHT (SMART ESCROW STATUS) */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-xl px-3 py-1.5 rounded-full border border-stone-200/90 shadow-md shadow-stone-900/5 text-[11px] font-mono text-stone-800 pointer-events-auto">
              <div className="p-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700">
                <Lock className="w-3 h-3" />
              </div>
              <span className="font-semibold text-stone-600">Escrow:</span>
              <span className="font-bold text-emerald-900">Rp 552.000</span>
            </div>

            {/* FLOATING HUD BADGE BOTTOM (SINGLE STREAMLINED PILL FOR FAIR ALLOCATION) */}
            <div className="absolute bottom-4 inset-x-0 mx-auto w-fit flex items-center gap-3 bg-white/90 hover:bg-white backdrop-blur-xl px-4 py-1.5 rounded-full border border-stone-200/90 shadow-md shadow-stone-900/5 font-mono text-[11px] pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="font-medium text-stone-600">S1 Makmur:</span>
                <span className="font-bold text-stone-900">40 kg (58%)</span>
              </div>
              <span className="text-stone-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-medium text-stone-600">S2 Berkah:</span>
                <span className="font-bold text-stone-900">29 kg (42%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPTION A: FLOATING GLASS SEGMENTED PILL DI TENGAH BAWAH (ORVANA WARM-WHITE & EMERALD) */}
      <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-2xl px-2">
        <div className="inline-flex items-center p-1 bg-white/95 backdrop-blur-xl rounded-full border border-stone-200/90 shadow-md shadow-stone-900/5 transition-all">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isFlipped
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulasi 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isFlipped
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lab Engine</span>
          </button>
        </div>

        {/* SUBTLE CAPTION UNDER PILL */}
        <div className="flex items-center justify-center text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-stone-700">
              {isFlipped ? 'Cyber Engine Lab:' : 'Alur Rantai Pasok:'}
            </span>
            <span>
              {isFlipped ? 'Hologram AI Alokasi Kuota & Brankas Escrow' : 'Lahan Petani ➔ Dapur Gizi Massal'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
