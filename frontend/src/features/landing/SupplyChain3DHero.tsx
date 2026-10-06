import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  TrendingUp,
  Truck,
  Leaf,
  Play,
  Pause,
  Compass,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StageNode {
  id: 'farm' | 'truck' | 'kitchen';
  stepNum: string;
  role: string;
  title: string;
  badge: string;
  badgeColor: string;
  coords: { x: number; y: number }; // percentage on island
  icon: React.ReactNode;
  summary: string;
  metricLabel: string;
  metricValue: string;
  metricSub: string;
}

const STAGES: StageNode[] = [
  {
    id: 'farm',
    stepNum: '01',
    role: 'HULU PRODUKSI',
    title: 'Panen Petani Lokal',
    badge: 'Cap Anti-Monopoli 60%',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    coords: { x: 26, y: 44 },
    icon: <Leaf className="w-4 h-4 text-emerald-400" />,
    summary: 'Petik pagi hari terintegrasi jadwal panen desa dengan jaminan kepastian harga acuan.',
    metricLabel: 'Alokasi Bayam Hijau',
    metricValue: '40,0 kg',
    metricSub: 'Rp 8.000/kg • 2 Jam Pasca Petik',
  },
  {
    id: 'truck',
    stepNum: '02',
    role: 'LOGISTIK TERSEGEL',
    title: 'Kurir & Pengepul Dingin',
    badge: 'Suhu +4°C Terkunci',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    coords: { x: 48, y: 62 },
    icon: <Truck className="w-4 h-4 text-amber-400" />,
    summary: 'Konsolidasi radius dekat (<25 km) dengan armada dingin dan segel QR paspor digital.',
    metricLabel: 'Status Distribusi',
    metricValue: 'Transit 6,2 km',
    metricSub: '+4,2°C Optimal • GPS Live',
  },
  {
    id: 'kitchen',
    stepNum: '03',
    role: 'HILIR KONSUMSI',
    title: 'Dapur Gizi & Uji Lab QC',
    badge: 'Escrow Auto-Release',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    coords: { x: 74, y: 38 },
    icon: <Building2 className="w-4 h-4 text-sky-400" />,
    summary: 'Diterima ahli gizi dapur, uji organoleptik 100%. Begitu lulus QC, kas petani cair instan.',
    metricLabel: 'Pencairan Otomatis',
    metricValue: 'Rp 537.500',
    metricSub: 'Grade A 100% • 1.000 Porsi',
  },
];

export const SupplyChain3DHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3d' | 'engine'>('3d');
  const [activeStepId, setActiveStepId] = useState<'farm' | 'truck' | 'kitchen'>('farm');
  const [isPlaying, setIsPlaying] = useState(true);

  // Parallax Gyro & Drag Orbit
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rotateX: 6, rotateY: -8, isHovered: false });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPos = useRef({ x: 0, y: 0 });

  // Auto-play timeline step
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStepId((prev) => {
        if (prev === 'farm') return 'truck';
        if (prev === 'truck') return 'kitchen';
        return 'farm';
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startDragPos.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX - startDragPos.current.x;
      const newY = e.clientY - startDragPos.current.y;
      setDragOffset({
        x: Math.max(-25, Math.min(25, newX * 0.15)),
        y: Math.max(-18, Math.min(18, newY * 0.15)),
      });
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / (rect.height / 2)) * 12 + 6;
    const rotY = (x / (rect.width / 2)) * 14 - 8;

    setTilt({
      rotateX: Number(rotX.toFixed(2)),
      rotateY: Number(rotY.toFixed(2)),
      isHovered: true,
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setTilt({ rotateX: 6, rotateY: -8, isHovered: false });
  };

  const currentStep = STAGES.find((s) => s.id === activeStepId) || STAGES[0];
  const finalRotX = tilt.rotateX - dragOffset.y;
  const finalRotY = tilt.rotateY + dragOffset.x;

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. TOP TOGGLE DOCK */}
      <div className="flex items-center justify-between w-full max-w-xl mb-3 px-1 gap-2">
        <div className="inline-flex p-1 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-700/80 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === '3d'
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

        {activeTab === '3d' && (
          <div className="flex items-center gap-2">
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
                  <span>Jeda Alur</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Putar Alur</span>
                </>
              )}
            </button>

            {(dragOffset.x !== 0 || dragOffset.y !== 0) && (
              <button
                type="button"
                onClick={() => setDragOffset({ x: 0, y: 0 })}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold px-2 py-1.5 rounded-xl bg-stone-900/80 border border-amber-500/30"
                title="Reset Sudut"
              >
                <Compass className="w-3 h-3 animate-spin" />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN 3D SHOWCASE (ISOLATED FLOATING ISLAND WITHOUT SQUARE BOX) */}
      {activeTab === '3d' && (
        <div className="w-full max-w-xl flex flex-col items-center">
          {/* THE 3D CANVAS STAGE */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full aspect-[4/3] flex items-center justify-center will-change-transform ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              perspective: '1200px',
            }}
          >
            {/* Ambient Background Glow Circles (Moncy.dev aesthetic) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none -z-10 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-2xl pointer-events-none -z-10" />

            {/* DUAL ORBITAL RINGS SURROUNDING ISLAND */}
            <div
              className="absolute w-[88%] h-[88%] rounded-full border border-dashed border-emerald-400/25 opacity-60 pointer-events-none"
              style={{
                transform: 'rotateX(65deg) rotateZ(20deg)',
                animation: 'spin 35s linear infinite',
              }}
            />

            {/* 3D FLOATING ISLAND (PRISTINE CUTOUT, NO SQUARE BORDER!) */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${finalRotX}deg) rotateY(${finalRotY}deg) scale(${
                  tilt.isHovered ? 1.02 : 1
                })`,
              }}
            >
              <img
                src="/images/orvana-island-floating.png"
                alt="Miniatur Pulau Rantai Pasok Pangan ORVANA"
                className="w-[95%] h-auto object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] select-none pointer-events-none"
              />

              {/* FLOW CONNECTION LASER / ARROWS (Petani -> Kurir -> Dapur) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="flowLaser" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <path
                  d="M 28 46 Q 38 56, 48 64 T 74 40"
                  fill="none"
                  stroke="url(#flowLaser)"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  className="animate-laser-flow"
                />
              </svg>

              {/* INTERACTIVE HOTSPOT PINS DIRECTLY ON ISLAND */}
              {STAGES.map((st) => {
                const isActive = st.id === activeStepId;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setActiveStepId(st.id);
                      setIsPlaying(false);
                    }}
                    style={{ left: `${st.coords.x}%`, top: `${st.coords.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex items-center justify-center transition-transform duration-300 ${
                      isActive ? 'scale-125' : 'scale-90 hover:scale-110'
                    }`}
                    title={st.title}
                  >
                    {/* Pulsing ring */}
                    <span
                      className={`absolute -inset-2 rounded-full blur-xs transition-opacity duration-300 ${
                        isActive ? 'opacity-100 animate-ping' : 'opacity-0'
                      } ${
                        st.id === 'farm'
                          ? 'bg-emerald-400'
                          : st.id === 'truck'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />

                    {/* Pin Circle */}
                    <span
                      className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                        isActive
                          ? 'bg-stone-900 border-white text-white shadow-emerald-500/50'
                          : 'bg-stone-900/80 border-stone-400 text-stone-300 hover:border-white'
                      }`}
                    >
                      {st.icon}
                    </span>

                    {/* Step tag */}
                    <span
                      className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs transition-all ${
                        isActive
                          ? 'bg-stone-900 text-white border border-stone-700'
                          : 'bg-stone-900/70 text-stone-300 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {st.stepNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. STEPPER PROGRESS TABS (PETANI -> KURIR/PENGEPUL -> DAPUR/LAB) */}
          <div className="grid grid-cols-3 gap-2 w-full mt-1 mb-3">
            {STAGES.map((st) => {
              const isActive = st.id === activeStepId;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStepId(st.id);
                    setIsPlaying(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-300 ${
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
                      TAHAP {st.stepNum}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-300'
                      }`}
                    />
                  </div>
                  <p className="text-xs font-bold truncate leading-tight">{st.title}</p>
                  <span
                    className={`text-[10px] font-mono block truncate mt-0.5 ${
                      isActive ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {st.metricValue}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4. CURRENT ACTIVE STEP DETAIL CARD (CLEAN & INFORMATIVE) */}
          <div className="w-full bg-white/95 backdrop-blur-xl border border-stone-200/90 rounded-2xl p-4 shadow-card text-stone-900 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-stone-100 text-stone-900">
                  {currentStep.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-stone-500 tracking-wider">
                      {currentStep.role}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${currentStep.badgeColor}`}
                    >
                      {currentStep.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-stone-950">
                    {currentStep.title}
                  </h4>
                </div>
              </div>

              <Link
                to={
                  currentStep.id === 'farm'
                    ? '/kalkulator'
                    : currentStep.id === 'truck'
                    ? '/trace/ORV-20260920-DPR01-0001'
                    : '/trace/ORV-20260920-DPR01-0001'
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 self-start sm:self-auto"
              >
                <span>Lihat Alur</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 items-center">
              <p className="text-xs text-stone-600 leading-relaxed">
                {currentStep.summary}
              </p>

              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase block">
                    {currentStep.metricLabel}
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-900">
                    {currentStep.metricValue}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 text-right">
                  {currentStep.metricSub}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
      {activeTab === 'engine' && (
        <div className="w-full max-w-md bg-stone-950/90 text-white rounded-3xl border border-white/15 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left animate-in fade-in duration-300">
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
