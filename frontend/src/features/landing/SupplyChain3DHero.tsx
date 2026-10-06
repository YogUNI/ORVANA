import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Building2,
  CheckCircle2,
  TrendingUp,
  Truck,
  Leaf,
  Eye,
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth tilt limit (-9 to +9 deg)
    const rotateX = -((y - centerY) / centerY) * 9;
    const rotateY = ((x - centerX) / centerX) * 9;

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

  return (
    <div className="w-full max-w-lg lg:max-w-none flex flex-col items-center">
      {/* Tab Switcher: 3D Visual vs Engine Data */}
      <div className="flex items-center justify-between w-full max-w-md mb-3 px-1">
        <div className="inline-flex p-1 bg-stone-200/70 backdrop-blur-md rounded-2xl border border-stone-300/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === '3d'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>3D Diorama Interaktif</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className="text-[11px] font-mono text-emerald-900 hover:text-emerald-950 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100/50 transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>{showHotspots ? 'Sembunyikan Pin' : 'Tampilkan Pin'}</span>
          </button>
        )}
      </div>

      {/* VIEW 1: 3D ISOMETRIC DIORAMA SHOWCASE */}
      {activeTab === '3d' && (
        <div className="w-full relative perspective-1200">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              transition: tilt.isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
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

            {/* Base 3D Render Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
              <img
                src="/images/orvana-3d-diorama.jpg"
                alt="ORVANA 3D Supply Chain Isometric Diorama"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />

              {/* Subtle Ambient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/30 pointer-events-none" />

              {/* Floating Live Badge Top Left */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700/80 text-[11px] font-mono shadow-lg">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold uppercase tracking-wide">3D Live Simulation</span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-300 text-[10px]">Gerakkan kursor untuk 3D tilt</span>
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
              <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-700/80 text-[10.5px] font-mono shadow-xl animate-float-slow">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-stone-300">Escrow Protected:</span>
                <span className="text-emerald-400 font-bold">Rp 537.500 [SAFE]</span>
              </div>

              {/* Floating Mini QR Batch HUD Pill Bottom Right */}
              <div className="absolute bottom-3 right-3 z-20 hidden sm:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-700/80 text-[10.5px] font-mono shadow-xl animate-float-reverse">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-stone-300">Batch:</span>
                <span className="text-amber-300 font-bold">#ORV-20260920</span>
              </div>
            </div>

            {/* Bottom Interactive Inspection Detail Card */}
            {activeHotspot && (
              <div className="p-4 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800 text-left relative z-20">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">
                      {activeHotspot.category}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeHotspot.badgeColor}`}>
                      {activeHotspot.badge}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {HOTSPOTS.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setActiveHotspot(h)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          activeHotspot.id === h.id ? 'bg-amber-400 scale-125' : 'bg-stone-700 hover:bg-stone-500'
                        }`}
                        title={h.title}
                      />
                    ))}
                  </div>
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
