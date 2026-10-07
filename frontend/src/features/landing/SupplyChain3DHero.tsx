import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ExternalLink,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupplyChain3DHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'engine'>('video');

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. MINIMALIST SEGMENTED SWITCHER (CLEAN & SUBTLE) */}
      <div className="flex items-center justify-between w-full max-w-xl mb-3 px-1">
        <div className="inline-flex p-1 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulasi Rantai Pasok 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'engine'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engine Alokasi</span>
          </button>
        </div>

        {activeTab === 'video' && (
          <Link
            to="/trace/ORV-20260920-DPR01-0001"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>Uji Cek Paspor QR</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* 2. PURE CINEMATIC THEATRE (LEAN, CLEAN, ZERO CLUTTER) */}
      {activeTab === 'video' && (
        <div className="w-full max-w-xl flex flex-col items-center group">
          <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border border-stone-200/90 shadow-2xl bg-stone-950 transition-all duration-500 hover:border-emerald-700/40">
            {/* AMBIENT SOFT SHADOW GLOW */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-transparent to-amber-500/15 blur-xl opacity-50 pointer-events-none -z-10 group-hover:opacity-80 transition-opacity" />

            {/* SEAMLESS 3D LOOP VIDEO (SMOOTH GIF-LIKE REPETITION, PURE AMBIENT) */}
            <video
              src="/videos/hero-seamless-loop.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-[1.02] pointer-events-none"
            />
          </div>

          {/* SINGLE CONCISE CAPTION BENEATH THE VIDEO */}
          <div className="w-full mt-2.5 px-2 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-stone-700">
                Alur Rantai Pasok Terintegrasi:
              </span>
              <span>Lahan Petani ➔ Armada Dingin ➔ Dapur Gizi Massal</span>
            </span>
            <span className="font-mono text-[11px] text-stone-400">
              Simulasi 3D
            </span>
          </div>
        </div>
      )}

      {/* 3. VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
      {activeTab === 'engine' && (
        <div className="w-full max-w-xl bg-stone-950/90 text-white rounded-3xl border border-white/15 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-0 opacity-80" />

          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-tight text-white uppercase">
                Live Matching Engine
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
              Algoritma Multi-Kriteria
            </span>
          </div>

          <div className="relative z-10 space-y-3.5">
            <div className="p-3.5 bg-stone-900/80 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Dapur Gizi Mandiri (DPR01)
                </span>
                <span className="font-mono text-emerald-400 font-bold">1.000 Porsi</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-bold text-white font-serif">Kebutuhan: Bayam Hijau</span>
                <span className="text-sm font-mono font-extrabold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  69,0 kg
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>Alokasi Multi-Petani:</span>
                <span>Maks 60% (41,4 kg)</span>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Kelompok Tani Makmur (S1)</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">Skor 88,97</span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                    Radius 6 km • Mutu 88 • Panen H-1
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-emerald-300 block">40,0 kg</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Rp 320.000</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Gapoktan Sumber Berkah (S2)</span>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">Skor 84,20</span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                    Radius 9 km • Mutu 90 • Panen H-0
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-amber-300 block">29,0 kg</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Rp 232.000</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-stone-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Terpenuhi 100%
              </span>
              <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Total Escrow: Rp 552.000
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
