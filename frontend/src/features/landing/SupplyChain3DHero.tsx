import React, { useState, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  Leaf,
  Truck,
  Building2,
  Lock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlowMilestone {
  id: 'farm' | 'transit' | 'kitchen';
  step: string;
  role: string;
  title: string;
  badge: string;
  metric: string;
  icon: React.ReactNode;
}

const MILESTONES: FlowMilestone[] = [
  {
    id: 'farm',
    step: '01',
    role: 'HULU PRODUKSI',
    title: 'Panen Petani Desa',
    badge: 'Cap 60% Adil',
    metric: '40 kg Bayam Hijau',
    icon: <Leaf className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    id: 'transit',
    step: '02',
    role: 'DISTRIBUSI DINGIN',
    title: 'Kurir Dingin Tersegel',
    badge: 'Suhu +4°C Terkunci',
    metric: '6,2 km Transit Live',
    icon: <Truck className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'kitchen',
    step: '03',
    role: 'HILIR KONSUMSI',
    title: 'Dapur Gizi & Lab QC',
    badge: 'QC Lulus & Escrow Cair',
    metric: '1.000 Porsi Gizi',
    icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
  },
];

export const SupplyChain3DHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'engine'>('video');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const activeMilestone = MILESTONES[activeMilestoneIndex];

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. TOP DOCK SELECTOR (SINEMATIK VIDEO VS LIVE ENGINE) */}
      <div className="flex items-center justify-between w-full max-w-xl mb-3 px-1 gap-2">
        <div className="inline-flex p-1 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-700/80 shadow-md">
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
            <span>Simulasi Sinematik 3D</span>
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
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-stone-900/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Full HD 60 FPS Loop</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. MAIN CINEMATIC THEATRE HERO STAGE */}
      {activeTab === 'video' && (
        <div className="w-full max-w-xl flex flex-col items-center group">
          {/* THE THEATRE FRAME CONTAINER */}
          <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-stone-950 text-white transform-gpu transition-all duration-500 hover:shadow-emerald-950/40 hover:border-emerald-500/40">
            {/* AMBIENT GLOW BACKLIGHT */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-sky-500/20 blur-xl opacity-60 pointer-events-none -z-10 group-hover:opacity-100 transition-opacity" />

            {/* REAL CINEMATIC 3D LOOP VIDEO */}
            <video
              ref={videoRef}
              src="/videos/hero-supply-chain.mp4"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover object-center scale-[1.02] filter saturate-[1.05] contrast-[1.02]"
            />

            {/* SUBTLE GRADIENT VIGNETTE ON EDGES */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/30 pointer-events-none" />

            {/* TOP BAR OVERLAY: LIVE STATUS & QUICK CONTROLS */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-auto z-20">
              <div className="flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-mono shadow-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold uppercase tracking-wide text-white">
                  Rantai Pasok Live
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-emerald-400 font-semibold text-[10px]">
                  Terverifikasi QR
                </span>
              </div>

              {/* Video Play/Pause & Mute Buttons */}
              <div className="flex items-center gap-1.5 bg-stone-950/80 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-md">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  title={isPlaying ? 'Jeda Video' : 'Putar Video'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            {/* BOTTOM BAR OVERLAY: PASSPORT BADGE & DIRECT LINK */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
              <div className="flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 text-xs shadow-lg max-w-[65%]">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">
                    Tahap {activeMilestone.step}: {activeMilestone.role}
                  </span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {activeMilestone.title} ({activeMilestone.metric})
                  </span>
                </div>
              </div>

              <Link
                to="/trace/ORV-20260920-DPR01-0001"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 px-3.5 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Uji Paspor QR</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 3. THREE-STAGE FLOW CHIPS DIRECTLY BENEATH THE THEATRE */}
          <div className="grid grid-cols-3 gap-2 w-full mt-3">
            {MILESTONES.map((m, idx) => {
              const isActive = idx === activeMilestoneIndex;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMilestoneIndex(idx)}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                    isActive
                      ? 'bg-stone-900 text-white border-emerald-500 shadow-md shadow-emerald-950/20'
                      : 'bg-white/80 hover:bg-white text-stone-700 border-stone-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-mono font-extrabold ${
                        isActive ? 'text-emerald-400' : 'text-stone-400'
                      }`}
                    >
                      TAHAP {m.step}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-300'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 my-0.5">
                    {m.icon}
                    <span className="text-xs font-bold truncate leading-tight">
                      {m.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono block truncate ${
                      isActive ? 'text-emerald-300' : 'text-stone-500'
                    }`}
                  >
                    {m.metric}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
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
