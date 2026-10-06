import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Building2,
  CheckCircle2,
  TrendingUp,
  Truck,
  Leaf,
  Eye,
  Play,
  Pause,
} from 'lucide-react';

interface Hotspot {
  id: 'farm' | 'truck' | 'kitchen';
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  desc: string;
  coords: { x: number; y: number }; // percentage position on image
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
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(HOTSPOTS[0]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(true);

  // Scroll-driven parallax depth
  const [scrollYOffset, setScrollYOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset < 800) {
        setScrollYOffset(offset);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3D Parallax Tilt state
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

  // Automated cinematic simulation flow (Living video simulation)
  useEffect(() => {
    if (!isPlayingSimulation) return;
    const interval = setInterval(() => {
      setActiveHotspot((prev) => {
        if (!prev) return HOTSPOTS[0];
        const currentIndex = HOTSPOTS.findIndex((h) => h.id === prev.id);
        const nextIndex = (currentIndex + 1) % HOTSPOTS.length;
        return HOTSPOTS[nextIndex];
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [isPlayingSimulation]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt limit (-8 to +8 deg)
    const rotateX = -((y - centerY) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;

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

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  // Hitung pengaruh scroll pada 3D tilt & shift
  const scrollTiltX = Math.min((scrollYOffset / 500) * 6, 6);
  const scrollTranslateY = Math.min((scrollYOffset / 500) * 18, 18);

  return (
    <div className="w-full max-w-lg lg:max-w-none flex flex-col items-center">
      {/* Top Controls Bar: Tab Switcher & Video Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-md mb-3 px-1 gap-2">
        <div className="inline-flex p-1 bg-stone-200/70 backdrop-blur-md rounded-2xl border border-stone-300/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === '3d'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>3D Living Video</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'engine'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Live Matching Data</span>
          </button>
        </div>

        {activeTab === '3d' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
              className={`text-[11px] font-mono flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                isPlayingSimulation
                  ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              {isPlayingSimulation ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-300" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Putar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowHotspots(!showHotspots)}
              className="text-[11px] font-mono text-emerald-900 hover:text-emerald-950 flex items-center gap-1 font-semibold px-2 py-1.5 rounded-xl hover:bg-emerald-100/50 transition-colors"
              title="Toggle Hotspot Pins"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: 3D LIVING VIDEO & ISOMETRIC DIORAMA SHOWCASE */}
      {activeTab === '3d' && (
        <div className="w-full relative perspective-1200">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.rotateX - scrollTiltX}deg) rotateY(${tilt.rotateY}deg) translateY(${scrollTranslateY}px)`,
              transition: tilt.isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)',
            }}
            className="relative rounded-3xl overflow-hidden border-2 border-stone-200/90 shadow-2xl bg-stone-950 text-white transform-style-3d cursor-crosshair group"
          >
            {/* Dynamic Light Sheen / Glare Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
              style={{
                opacity: tilt.isHovered ? 0.35 : 0,
                background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7), transparent 80%)`,
              }}
            />

            {/* Sweep Sunbeam Light (Ambient Cinematic Video Effect) */}
            <div className="absolute inset-0 w-[40%] h-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent pointer-events-none z-20 animate-sunbeam-sweep" />

            {/* Base 3D Render Image with Continuous Ken Burns Camera Panning */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
              <img
                src="/images/orvana-3d-diorama.jpg"
                alt="ORVANA 3D Supply Chain Isometric Diorama"
                className="w-full h-full object-cover object-center animate-ken-burns transform-gpu"
                loading="eager"
              />

              {/* Animated Glowing Laser Route (Supply Chain Path from Farm -> Truck -> Kitchen) */}
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
                  <filter id="laserGlow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Flowing Laser Line */}
                <path
                  d="M 26 40 Q 38 48, 48 56 T 74 36"
                  fill="none"
                  stroke="url(#laserGrad)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                  className="animate-laser-flow"
                  filter="url(#laserGlow)"
                />
              </svg>

              {/* Rising Agritech Particles (Kunang-kunang / Pollen Desa) */}
              <div className="absolute bottom-16 left-28 w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_#34d399] animate-particle-rise pointer-events-none z-10" />
              <div
                className="absolute bottom-20 left-48 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_10px_#fbbf24] animate-particle-rise pointer-events-none z-10"
                style={{ animationDelay: '1.2s' }}
              />
              <div
                className="absolute bottom-28 right-24 w-1.5 h-1.5 rounded-full bg-sky-400/80 shadow-[0_0_8px_#38bdf8] animate-particle-rise pointer-events-none z-10"
                style={{ animationDelay: '2.1s' }}
              />

              {/* Subtle Ambient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-transparent to-stone-950/30 pointer-events-none" />

              {/* Top Live Video HUD Pill */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700/80 text-[11px] font-mono shadow-lg">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold uppercase tracking-wide">
                  {isPlayingSimulation ? 'Cinematic Live Simulation' : '3D Paused'}
                </span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-300 text-[10px]">Scroll / Gerakkan Mouse</span>
              </div>

              {/* Interactive AR Hotspots */}
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
                          setIsPlayingSimulation(false); // pause auto-loop saat user memilih manual
                        }}
                        className="relative group/pin p-2 focus:outline-none"
                        aria-label={hotspot.title}
                      >
                        {/* Radar Pulse Ring */}
                        <span
                          className={`absolute inset-0 rounded-full animate-radar-ring ${
                            hotspot.id === 'farm'
                              ? 'bg-emerald-400'
                              : hotspot.id === 'truck'
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                          }`}
                        />
                        {/* Center Pin Button */}
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

              {/* Floating Mini Escrow HUD Pill Bottom Left */}
              <div
                style={{
                  transform: `translateY(${-scrollYOffset * 0.05}px)`,
                }}
                className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-700/80 text-[10.5px] font-mono shadow-xl animate-float-slow transition-transform"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-stone-300">Escrow Protected:</span>
                <span className="text-emerald-400 font-bold">Rp 537.500 [SAFE]</span>
              </div>

              {/* Floating Mini QR Batch HUD Pill Bottom Right */}
              <div
                style={{
                  transform: `translateY(${-scrollYOffset * 0.07}px)`,
                }}
                className="absolute bottom-3 right-3 z-20 hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-700/80 text-[10.5px] font-mono shadow-xl animate-float-reverse transition-transform"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-stone-300">Batch:</span>
                <span className="text-amber-300 font-bold">#ORV-20260920</span>
              </div>
            </div>

            {/* Bottom Interactive Inspection Detail Card & Simulation Timeline */}
            {activeHotspot && (
              <div className="p-4 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800 text-left relative z-20">
                {/* Simulation Timeline Progress Bar */}
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  {HOTSPOTS.map((h) => {
                    const isActive = activeHotspot.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setActiveHotspot(h);
                          setIsPlayingSimulation(false);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          isActive
                            ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                            : 'bg-stone-700 hover:bg-stone-600'
                        }`}
                        title={h.title}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">
                      {activeHotspot.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeHotspot.badgeColor}`}>
                      {activeHotspot.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500">
                    Fase {HOTSPOTS.findIndex((h) => h.id === activeHotspot.id) + 1} / 3
                  </span>
                </div>

                <h4 className="font-serif font-bold text-base text-white flex items-center gap-1.5">
                  {activeHotspot.title}
                </h4>
                <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                  {activeHotspot.desc}
                </p>

                {/* 3 Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-stone-800/80">
                  {activeHotspot.details.map((item, idx) => (
                    <div key={idx} className="bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                      <span className="text-[10px] text-stone-400 block truncate font-sans">
                        {item.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 block truncate mt-0.5">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE MATCHING ENGINE ALGORITHM DATA CARD */}
      {activeTab === 'engine' && (
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-emerald-900/15 p-6 shadow-elevated relative overflow-hidden text-left animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-80" />

          <div className="relative z-10 flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-tight text-stone-950 uppercase">
                Live Matching Engine
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
              Algoritma Multi-Kriteria
            </span>
          </div>

          <div className="relative z-10 space-y-3.5">
            {/* Permintaan Dapur */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                  Dapur Gizi Mandiri (DPR01)
                </span>
                <span className="font-mono text-emerald-900 font-bold">1.000 Porsi</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-bold text-stone-950 font-serif">Kebutuhan: Bayam Hijau</span>
                <span className="text-sm font-mono font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  69,0 kg
                </span>
              </div>
            </div>

            {/* Alokasi Multi-Pemasok */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Alokasi Multi-Petani:</span>
                <span>Maks 60% (41,4 kg)</span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-950 flex items-center gap-1.5">
                    <span>Kelompok Tani Makmur (S1)</span>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">Skor 88,97</span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                    Radius 6 km • Mutu 88 • Panen H-1
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-emerald-950 block">40,0 kg</span>
                  <span className="text-[10px] text-emerald-800 font-semibold">Rp 320.000</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-950 flex items-center gap-1.5">
                    <span>Petani Organik Sari (S2)</span>
                    <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">Skor 83,60</span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                    Radius 14 km • Mutu 80 • Panen Hari-H
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-stone-950 block">29,0 kg</span>
                  <span className="text-[10px] text-amber-800 font-semibold">Rp 217.500</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
              <span className="text-stone-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Pencadangan Rekening Escrow:
              </span>
              <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Rp 537.500 [HOLD]
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
