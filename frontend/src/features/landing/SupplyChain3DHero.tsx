import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
  Truck,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Pause,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StageConfig {
  id: 'farm' | 'truck' | 'kitchen';
  stepNum: string;
  role: string;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  statLabel: string;
  statValue: string;
  statSub: string;
  pinCoord: { x: number; y: number };
  activeGlow: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'farm',
    stepNum: '01',
    role: 'HULU PRODUKSI',
    title: 'Panen Petani Desa',
    badge: 'Cap Anti-Monopoli 60%',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    summary: 'Petik sayur segar pagi hari terhubung otomatis dengan kuota harian dapur gizi.',
    statLabel: 'Alokasi Bayam',
    statValue: '40,0 kg',
    statSub: 'Rp 8.000 / kg • Panen H-1',
    pinCoord: { x: 26, y: 42 },
    activeGlow: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'truck',
    stepNum: '02',
    role: 'LOGISTIK TRANSIT',
    title: 'Kurir Dingin Tersegel',
    badge: 'Suhu +4°C Terkunci',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    summary: 'Armada berpendingin jemput kebun radius <25 km. Paspor batch QR tersegel anti-tukar.',
    statLabel: 'Suhu & Jarak',
    statValue: '+4,2°C • 6,2 km',
    statSub: 'Transit 18 Menit • GPS Live',
    pinCoord: { x: 48, y: 62 },
    activeGlow: 'rgba(245, 158, 11, 0.45)',
  },
  {
    id: 'kitchen',
    stepNum: '03',
    role: 'HILIR KONSUMSI',
    title: 'Dapur Gizi & Lab QC',
    badge: 'Escrow Auto-Release',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    summary: 'Uji mutu organoleptik 100%. Begitu checklist QC lulus, dana kas petani cair otomatis.',
    statLabel: 'Pencairan Otomatis',
    statValue: 'Rp 537.500',
    statSub: 'Skor Mutu 100% • 1.000 Porsi',
    pinCoord: { x: 74, y: 38 },
    activeGlow: 'rgba(14, 165, 233, 0.45)',
  },
];

export const SupplyChain3DHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'engine'>('visual');
  const [activeStageId, setActiveStageId] = useState<'farm' | 'truck' | 'kitchen'>('farm');
  const [isPlaying, setIsPlaying] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 6, ry: -8, isHovered: false });

  // Auto-progress stages on timer
  useEffect(() => {
    if (!isPlaying || activeTab !== 'visual') return;
    const interval = setInterval(() => {
      setActiveStageId((prev) => {
        if (prev === 'farm') return 'truck';
        if (prev === 'truck') return 'kitchen';
        return 'farm';
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, activeTab]);

  // Subtle 3D mouse parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rx = -(y / (rect.height / 2)) * 10 + 6;
    const ry = (x / (rect.width / 2)) * 12 - 8;
    setTilt({ rx, ry, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 6, ry: -8, isHovered: false });
  };

  const currentStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. TOP SEGMENTED CONTROL BAR */}
      <div className="flex items-center justify-between w-full max-w-lg mb-3 px-1 gap-2">
        <div className="inline-flex p-1 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-700/80 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alur Rantai Pasok 3D</span>
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

        {activeTab === 'visual' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`text-[11px] font-mono flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                isPlaying
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                  : 'bg-stone-900/70 text-stone-300 border-stone-700 hover:bg-stone-800'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-400" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Putar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. THE COMPACT 3D LIVING STAGE */}
      {activeTab === 'visual' && (
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-lg aspect-[1.18/1] flex flex-col justify-between p-4 rounded-3xl bg-gradient-to-b from-stone-900/90 via-stone-900/80 to-stone-950/95 border border-stone-800/90 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300"
          style={{
            perspective: '1000px',
            boxShadow: `0 20px 40px -15px ${currentStage.activeGlow}`,
          }}
        >
          {/* AMBIENT RADIAL LIGHTING GLOW */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-1000"
            style={{ backgroundColor: currentStage.activeGlow }}
          />

          {/* DUAL BACKGROUND ORBITAL CIRCLES (MONCY.DEV STYLE) */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full border border-dashed border-emerald-400/20 pointer-events-none"
            style={{
              transform: 'rotateX(60deg) rotateZ(15deg)',
              animation: 'spin 40s linear infinite',
            }}
          />

          {/* TOP STEP SELECTOR PILLS (TAHAP 01 -> TAHAP 02 -> TAHAP 03) */}
          <div className="relative z-20 flex items-center justify-between gap-2 bg-stone-950/70 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800">
            {STAGES.map((st) => {
              const isActive = st.id === activeStageId;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStageId(st.id);
                    setIsPlaying(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-left transition-all duration-300 flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="truncate">
                    <span className="text-[9px] font-mono block uppercase font-bold text-stone-400">
                      Tahap {st.stepNum}
                    </span>
                    <span className="text-xs font-bold truncate block text-stone-100">
                      {st.title.split(' ')[0]} {st.title.split(' ')[1] || ''}
                    </span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* CENTER 3D FLOATING ISLAND (PRISTINE TRANSPARENT CUTOUT WITH MOVING ELEMENTS) */}
          <div
            className="relative w-full flex-1 flex items-center justify-center my-1 transition-transform duration-300 ease-out will-change-transform"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
                tilt.isHovered ? 1.03 : 1
              })`,
            }}
          >
            {/* ISLAND CUTOUT IMAGE */}
            <div className="relative w-[92%] h-auto flex items-center justify-center animate-bounce-gentle">
              <img
                src="/images/orvana-island-floating.png"
                alt="Miniatur Pulau Rantai Pasok Pangan ORVANA"
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.65)] select-none pointer-events-none"
              />

              {/* FLOWING CONNECTION LASER PATH */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="islandLaser" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <path
                  d="M 28 46 Q 38 56, 48 64 T 74 40"
                  fill="none"
                  stroke="url(#islandLaser)"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  className="animate-laser-flow"
                />
              </svg>

              {/* DYNAMIC MOVING COLD-CHAIN TRUCK ANIMATION ON THE ROAD */}
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  top: '60%',
                  left: '46%',
                  animation: 'float-slow 3s ease-in-out infinite',
                }}
              >
                {/* Truck Pulse Marker */}
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white"></span>
                </span>
              </div>

              {/* STEAM PARTICLE ON KITCHEN ROOF */}
              <div
                className="absolute top-[28%] right-[24%] pointer-events-none z-10 opacity-60"
                style={{ animation: 'pulse 2s infinite' }}
              >
                <span className="block w-2.5 h-2.5 rounded-full bg-sky-300 blur-xs animate-ping" />
              </div>

              {/* PINS ON THE 3 KEY LOCATIONS */}
              {STAGES.map((st) => {
                const isActive = st.id === activeStageId;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setActiveStageId(st.id);
                      setIsPlaying(false);
                    }}
                    style={{ left: `${st.pinCoord.x}%`, top: `${st.pinCoord.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-300 ${
                      isActive ? 'scale-125' : 'scale-90 hover:scale-110'
                    }`}
                  >
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 shadow-lg transition-all ${
                        isActive
                          ? 'bg-stone-900 border-white text-white shadow-emerald-500/60'
                          : 'bg-stone-900/80 border-stone-500 text-stone-300'
                      }`}
                    >
                      {st.id === 'farm' && <Leaf className="w-3.5 h-3.5 text-emerald-400" />}
                      {st.id === 'truck' && <Truck className="w-3.5 h-3.5 text-amber-400" />}
                      {st.id === 'kitchen' && <Building2 className="w-3.5 h-3.5 text-sky-400" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTTOM COMPACT FLOATING GLASS HUD CAPSULE (DIRECTLY INTEGRATED) */}
          <div className="relative z-20 bg-stone-950/90 backdrop-blur-xl border border-stone-700/80 rounded-2xl p-3 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentStage.badgeColor}`}
                >
                  {currentStage.badge}
                </span>
                <span className="text-xs font-bold text-stone-100 font-heading">
                  {currentStage.title}
                </span>
              </div>

              <Link
                to={
                  currentStage.id === 'farm'
                    ? '/kalkulator'
                    : currentStage.id === 'truck'
                    ? '/trace/ORV-20260920-DPR01-0001'
                    : '/trace/ORV-20260920-DPR01-0001'
                }
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <span>Detail</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <p className="text-[11px] text-stone-300 leading-snug max-w-[58%]">
                {currentStage.summary}
              </p>

              <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-right">
                <span className="text-[9px] font-mono text-stone-400 uppercase block">
                  {currentStage.statLabel}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {currentStage.statValue}
                </span>
                <span className="text-[9px] font-mono text-stone-400 block">
                  {currentStage.statSub}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
      {activeTab === 'engine' && (
        <div className="w-full max-w-lg bg-stone-950/90 text-white rounded-3xl border border-white/15 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left animate-in fade-in duration-300">
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
