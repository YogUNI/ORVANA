import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Building2,
  TrendingUp,
  Truck,
  Leaf,
  Eye,
  Play,
  Pause,
  Compass,
  User,
  QrCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Hotspot {
  id: 'farm' | 'truck' | 'kitchen';
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  desc: string;
  coords: { x: number; y: number };
  details: { label: string; value: string }[];
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'farm',
    title: 'Lahan Petani Lokal Desa',
    category: 'Hulu Produksi',
    badge: 'Panen Terjadwal',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Bayam hijau & sayur segar dipetik pagi hari. Kuota dialokasikan adil maksimal 60% mencegah monopoli tengkulak.',
    coords: { x: 26, y: 38 },
    details: [
      { label: 'Komoditas', value: 'Bayam Hijau Subur' },
      { label: 'Kepastian Harga', value: 'Rp 8.000 / kg' },
      { label: 'Batas Alokasi', value: 'Maks 60% (40 kg)' },
    ],
  },
  {
    id: 'truck',
    title: 'Logistik Rantai Dingin Tersegel',
    category: 'Distribusi & Transit',
    badge: 'Suhu +4°C Terpantau',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'Armada logistik berpendingin desa dengan pelacakan GPS live & segel paspor digital QR tahan manipulasi.',
    coords: { x: 48, y: 56 },
    details: [
      { label: 'Jarak Tempuh', value: '6,2 km (18 menit)' },
      { label: 'Suhu Kargo', value: '+4,2°C (Optimal)' },
      { label: 'Paspor Batch', value: '#ORV-20260920' },
    ],
  },
  {
    id: 'kitchen',
    title: 'Dapur Gizi Massal & Lab QC',
    category: 'Hilir Konsumsi',
    badge: 'HACCP & QC Lulus',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    desc: 'Penerimaan bahan gizi massal, inspeksi mutu ahli gizi digital. Begitu QC dinyatakan Lulus, dana escrow cair seketika.',
    coords: { x: 74, y: 34 },
    details: [
      { label: 'Target Porsi', value: '1.000 Porsi / Hari' },
      { label: 'Skor Mutu QC', value: '100% (Grade A)' },
      { label: 'Pencairan Escrow', value: 'Rp 537.500 Otomatis' },
    ],
  },
];

export const SupplyChain3DHero: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3d' | 'engine'>('3d');
  const [modelMode, setModelMode] = useState<'character' | 'diorama'>('character');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(HOTSPOTS[0]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(true);

  // Scroll-driven camera parallax
  const [scrollYOffset, setScrollYOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset < 1000) {
        setScrollYOffset(offset);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Interactive Orbit & Drag Physics (Inspired by moncy.dev)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{
    rotateX: number;
    rotateY: number;
    glareX: number;
    glareY: number;
    isHovered: boolean;
  }>({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  // Interactive Drag-to-Rotate State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startDragPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startDragPos.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX - startDragPos.current.x;
      const newY = e.clientY - startDragPos.current.y;
      setDragOffset({
        x: Math.max(-28, Math.min(28, newX * 0.16)),
        y: Math.max(-20, Math.min(20, newY * 0.16)),
      });
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 11;
    const rotateY = ((x - centerX) / centerX) * 13;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      rotateX: Number(rotateX.toFixed(2)),
      rotateY: Number(rotateY.toFixed(2)),
      glareX: Number(glareX.toFixed(1)),
      glareY: Number(glareY.toFixed(1)),
      isHovered: true,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  const handleResetOrbit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragOffset({ x: 0, y: 0 });
  };

  // Automated cinematic simulation flow
  useEffect(() => {
    if (!isPlayingSimulation || modelMode !== 'diorama') return;
    const interval = setInterval(() => {
      setActiveHotspot((prev) => {
        if (!prev) return HOTSPOTS[0];
        const currentIndex = HOTSPOTS.findIndex((h) => h.id === prev.id);
        const nextIndex = (currentIndex + 1) % HOTSPOTS.length;
        return HOTSPOTS[nextIndex];
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [isPlayingSimulation, modelMode]);

  const scrollTiltX = Math.min((scrollYOffset / 500) * 8, 8);
  const scrollTranslateY = Math.min((scrollYOffset / 500) * 22, 22);

  const finalRotateX = tilt.rotateX - dragOffset.y - scrollTiltX;
  const finalRotateY = tilt.rotateY + dragOffset.x;

  return (
    <div className="w-full max-w-lg lg:max-w-none flex flex-col items-center select-none">
      {/* Top Controls Bar: Model Switcher & Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-md mb-3 px-1 gap-2">
        <div className="inline-flex p-1 bg-stone-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('3d');
              setModelMode('character');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === '3d' && modelMode === 'character'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Avatar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('3d');
              setModelMode('diorama');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === '3d' && modelMode === 'diorama'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Diorama</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'engine'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engine</span>
          </button>
        </div>

        {activeTab === '3d' && (
          <div className="flex items-center gap-2">
            {modelMode === 'diorama' && (
              <button
                type="button"
                onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
                className={`text-[11px] font-mono flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                  isPlayingSimulation
                    ? 'bg-emerald-900 text-white border-emerald-700 shadow-xs'
                    : 'bg-stone-900/70 text-stone-300 border-white/10 hover:bg-stone-800'
                }`}
              >
                {isPlayingSimulation ? (
                  <>
                    <Pause className="w-3 h-3 text-emerald-300" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Putar</span>
                  </>
                )}
              </button>
            )}

            {dragOffset.x !== 0 || dragOffset.y !== 0 ? (
              <button
                type="button"
                onClick={handleResetOrbit}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold px-2 py-1.5 rounded-xl bg-stone-900/70 border border-amber-500/30 transition-colors"
                title="Reset Posisi Sudut 3D"
              >
                <Compass className="w-3 h-3 animate-spin" />
                <span>Reset</span>
              </button>
            ) : null}

            {modelMode === 'diorama' && (
              <button
                type="button"
                onClick={() => setShowHotspots(!showHotspots)}
                className="text-[11px] font-mono text-stone-300 hover:text-white flex items-center gap-1 font-semibold p-2 rounded-xl bg-stone-900/60 border border-white/10 transition-colors"
                title="Toggle Hotspot Pins"
              >
                <Eye className="w-3 h-3 text-emerald-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: 3D LIVING STAGE (Moncy.dev Inspired Stage with Lighting Circles) */}
      {activeTab === '3d' && (
        <div className="w-full relative perspective-1200">
          {/* Moncy.dev Background Orbit Circles (.landing-circle1 & .landing-circle2) */}
          <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveGlobal}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${finalRotateX}deg) rotateY(${finalRotateY}deg) translateY(${scrollTranslateY}px)`,
              transition: isDragging
                ? 'none'
                : tilt.isHovered
                ? 'transform 0.08s ease-out'
                : 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
            }}
            className={`relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-stone-950 text-white transform-style-3d group ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Dynamic Light Sheen / Specular Flare Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
              style={{
                opacity: tilt.isHovered ? 0.35 : 0,
                background: `radial-gradient(circle 340px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7), transparent 80%)`,
              }}
            />

            {/* Sweep Sunbeam Light */}
            <div className="absolute inset-0 w-[40%] h-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent pointer-events-none z-20 animate-sunbeam-sweep" />

            {/* Sci-Fi Tech L-Corners (Moncy.dev aesthetic) */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-emerald-400/80 pointer-events-none z-30" />
            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-emerald-400/80 pointer-events-none z-30" />
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-emerald-400/80 pointer-events-none z-30" />
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-emerald-400/80 pointer-events-none z-30" />

            {/* SUB-VIEW A: 3D CHARACTER AVATAR (MONCY.DEV STYLE) */}
            {modelMode === 'character' && (
              <div className="relative aspect-square w-full overflow-hidden bg-stone-950 flex items-center justify-center">
                {/* Character Rim-Lighting Circle */}
                <div className="absolute w-72 h-72 rounded-full bg-emerald-400/20 blur-2xl transform scale-110 pointer-events-none" />

                <img
                  src="/images/orvana-3d-character.jpg"
                  alt="ORVANA 3D Agri-Tech Inspector Avatar"
                  className="w-full h-full object-cover object-center animate-float-slow transform-gpu pointer-events-none select-none"
                  loading="eager"
                />

                {/* Top Badge: Inspector Online */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 text-[11px] font-mono shadow-lg">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wide">
                    {isDragging ? 'ROTATING 3D AVATAR' : '3D AVATAR ACTIVE'}
                  </span>
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-300 text-[10px]">Klik & Drag untuk Orbit</span>
                </div>

                {/* Holographic Tablet Badge Link */}
                <Link
                  to="/trace/ORV-20260920-DPR01-0001"
                  className="absolute bottom-4 left-4 right-4 z-20 bg-stone-900/90 backdrop-blur-xl p-3 rounded-2xl border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center justify-between shadow-2xl group/link"
                >
                  <div className="flex items-center gap-2.5 truncate text-left">
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">
                        Hologram QR Batch Terverifikasi
                      </span>
                      <span className="text-xs font-mono font-bold text-white group-hover/link:text-amber-400 transition-colors">
                        #ORV-20260920-DPR01
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500 text-stone-950 font-extrabold px-2.5 py-1 rounded-lg">
                    SCAN PASS ➔
                  </span>
                </Link>
              </div>
            )}

            {/* SUB-VIEW B: 3D DIORAMA ISLAND */}
            {modelMode === 'diorama' && (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                <img
                  src="/images/orvana-3d-diorama.jpg"
                  alt="ORVANA 3D Supply Chain Isometric Diorama"
                  className="w-full h-full object-cover object-center animate-ken-burns transform-gpu pointer-events-none"
                  loading="eager"
                />

                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 26 40 Q 38 48, 48 56 T 74 36"
                    fill="none"
                    stroke="url(#laserGrad)"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                    className="animate-laser-flow"
                  />
                </svg>

                {/* Top Live Video HUD Pill */}
                <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-mono shadow-lg">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wide">
                    {isDragging ? 'DRAGGING 3D ORBIT' : isPlayingSimulation ? '3D LIVING SIMULATION' : 'ORBIT PAUSED'}
                  </span>
                </div>

                {/* Interactive Hotspots */}
                {showHotspots &&
                  HOTSPOTS.map((hotspot) => {
                    const isSelected = activeHotspot?.id === hotspot.id;
                    return (
                      <div
                        key={hotspot.id}
                        style={{
                          top: `${hotspot.coords.y}%`,
                          left: `${hotspot.coords.x}%`,
                        }}
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveHotspot(hotspot);
                            setIsPlayingSimulation(false);
                          }}
                          className="relative group/pin p-2 focus:outline-none"
                          aria-label={hotspot.title}
                        >
                          <span
                            className={`absolute inset-0 rounded-full animate-radar-ring ${
                              hotspot.id === 'farm'
                                ? 'bg-emerald-400'
                                : hotspot.id === 'truck'
                                ? 'bg-amber-400'
                                : 'bg-sky-400'
                            }`}
                          />
                          <span
                            className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 transition-transform duration-200 ${
                              isSelected ? 'scale-125 ring-4 ring-white/50' : 'hover:scale-110'
                            } ${
                              hotspot.id === 'farm'
                                ? 'bg-emerald-600 border-white text-white'
                                : hotspot.id === 'truck'
                                ? 'bg-amber-500 border-white text-white'
                                : 'bg-sky-600 border-white text-white'
                            }`}
                          >
                            {hotspot.id === 'farm' && <Leaf className="w-4 h-4" />}
                            {hotspot.id === 'truck' && <Truck className="w-4 h-4" />}
                            {hotspot.id === 'kitchen' && <Building2 className="w-4 h-4" />}
                          </span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
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
                    <span>Petani Organik Sari (S2)</span>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">Skor 83,60</span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                    Radius 14 km • Mutu 80 • Panen Hari-H
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-white block">29,0 kg</span>
                  <span className="text-[10px] text-amber-300 font-semibold">Rp 217.500</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-stone-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Pencadangan Rekening Escrow:
              </span>
              <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                Rp 537.500 [HOLD]
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
