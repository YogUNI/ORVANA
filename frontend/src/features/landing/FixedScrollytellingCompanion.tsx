import React, { useEffect, useState, useMemo } from 'react';

interface StageConfig {
  id: string;
  name: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  // Position docked nicely at screen periphery so it never overlaps main cards:
  dockSide: 'right' | 'left';
  pos: {
    y: number; // percentage from top viewport (vh)
    scale: number;
    rotateY: number; // degrees
    rotateZ: number;
  };
  glowColor: string;
}

export const FixedScrollytellingCompanion: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Stages mapped precisely with scroll milestones
  const stages: StageConfig[] = useMemo(
    () => [
      {
        id: 'hero',
        name: 'Ekosistem Pangan',
        title: 'Inspektur Digital Orvana',
        badge: 'Mitra Inspeksi',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        description: 'Memantau integritas pasokan pangan dari petani ke dapur massal.',
        dockSide: 'right',
        pos: { y: 68, scale: 0.95, rotateY: -12, rotateZ: 2 },
        glowColor: 'rgba(16, 185, 129, 0.45)',
      },
      {
        id: 'techballs',
        name: 'Fisika Pasokan',
        title: 'Komoditas Terverifikasi',
        badge: 'Fisika Komoditas',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        description: 'Setiap komoditas dipantau parameter susut, mutu, dan kuota panen.',
        dockSide: 'left',
        pos: { y: 65, scale: 0.9, rotateY: 14, rotateZ: -2 },
        glowColor: 'rgba(245, 158, 11, 0.45)',
      },
      {
        id: 'alur',
        name: 'Sinergi 4 Peran',
        title: 'Rantai Pasok Berkeadilan',
        badge: 'Sinergi Lapangan',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: 'Petani panen, koordinator jemput, lab uji mutu, dapur terima tepat waktu.',
        dockSide: 'right',
        pos: { y: 68, scale: 0.95, rotateY: -14, rotateZ: 3 },
        glowColor: 'rgba(59, 130, 246, 0.45)',
      },
      {
        id: 'kalkulator',
        name: 'Estimasi Kebutuhan',
        title: 'Kalkulator Gizi Presisi',
        badge: 'Demand Planner',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Hitung kebutuhan bahan bersih dan kotor sesuai target porsi harian.',
        dockSide: 'right',
        pos: { y: 72, scale: 0.88, rotateY: -10, rotateZ: 2 },
        glowColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        id: 'trace',
        name: 'Penelusuran Publik',
        title: 'Paspor Digital QR',
        badge: '100% Transparan',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Setiap kemasan dapat dilacak publik hingga petani dan suhu pengiriman.',
        dockSide: 'left',
        pos: { y: 65, scale: 0.95, rotateY: 15, rotateZ: -2 },
        glowColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        id: 'ledger',
        name: 'Escrow & Pembayaran',
        title: 'Pencairan Otomatis',
        badge: 'Smart Escrow',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        description: 'Begitu dapur approve QC, dana langsung masuk rekening kas petani.',
        dockSide: 'right',
        pos: { y: 68, scale: 0.95, rotateY: -12, rotateZ: 2 },
        glowColor: 'rgba(168, 85, 247, 0.45)',
      },
      {
        id: 'cta',
        name: 'Daftar Mitra',
        title: 'Ayo Bergabung Sekarang',
        badge: 'Siap Berkolaborasi',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Gabung menjadi dapur percontohan atau kelompok tani terdaftar.',
        dockSide: 'right',
        pos: { y: 70, scale: 1.0, rotateY: -8, rotateZ: 1 },
        glowColor: 'rgba(234, 179, 8, 0.5)',
      },
    ],
    []
  );

  // Monitor scroll milestone
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / docHeight));

      if (progress < 0.12) {
        setActiveStageIndex(0); // Hero
      } else if (progress < 0.28) {
        setActiveStageIndex(1); // Techballs
      } else if (progress < 0.45) {
        setActiveStageIndex(2); // Alur
      } else if (progress < 0.62) {
        setActiveStageIndex(3); // Kalkulator
      } else if (progress < 0.78) {
        setActiveStageIndex(4); // Trace
      } else if (progress < 0.90) {
        setActiveStageIndex(5); // Ledger
      } else {
        setActiveStageIndex(6); // CTA
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subtle mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x: normX * 10, y: normY * 10 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const activeStage = stages[activeStageIndex];
  const isRight = activeStage.dockSide === 'right';

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 hidden xl:block overflow-hidden"
      aria-hidden="true"
    >
      {/* FIXED DOCKED STAGE CONTAINER (Positioned at Screen Periphery / Edge) */}
      <div
        className="absolute transition-all duration-1000 ease-out will-change-transform"
        style={{
          right: isRight ? '1.5rem' : 'auto',
          left: isRight ? 'auto' : '1.5rem',
          top: `${activeStage.pos.y}%`,
          transform: `translateY(-50%) translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(${activeStage.pos.scale})`,
        }}
      >
        <div
          className="relative flex items-center gap-3 transition-transform duration-700 ease-out"
          style={{
            perspective: '1000px',
            transform: `rotateY(${activeStage.pos.rotateY + mouseOffset.x * 0.3}deg) rotateZ(${activeStage.pos.rotateZ}deg)`,
          }}
        >
          {/* OPTIONAL EXPANDABLE MINI HUD CALLOUT */}
          {isExpanded && (
            <div
              className={`w-64 bg-stone-900/95 backdrop-blur-xl border border-stone-700/80 p-3.5 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-300 animate-in fade-in zoom-in-95 ${
                isRight ? 'order-1 mr-2' : 'order-2 ml-2'
              }`}
              style={{
                boxShadow: `0 12px 30px -10px ${activeStage.glowColor}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeStage.badgeColor}`}
                >
                  {activeStage.badge}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              <p className="text-xs font-bold text-stone-100 leading-snug mb-1">
                {activeStage.title}
              </p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {activeStage.description}
              </p>

              {/* STAGE DOTS */}
              <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between">
                <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
                  {activeStage.name}
                </span>
                <div className="flex items-center gap-1">
                  {stages.map((st, idx) => (
                    <span
                      key={st.id}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeStageIndex
                          ? 'w-3.5 bg-emerald-400'
                          : 'w-1.5 bg-stone-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3D AVATAR FIGURE (CLICKABLE TO TOGGLE INFO HUD) */}
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`relative group cursor-pointer pointer-events-auto select-none ${
              isRight ? 'order-2' : 'order-1'
            }`}
          >
            {/* AMBIENT RADIAL LIGHTING */}
            <div
              className="absolute -inset-4 rounded-full blur-xl opacity-50 transition-colors duration-1000 pointer-events-none group-hover:opacity-80"
              style={{ backgroundColor: activeStage.glowColor }}
            />

            {/* MONCY ORBITAL HALO RING */}
            <div
              className="absolute -inset-2 rounded-full border border-emerald-400/30 opacity-60 pointer-events-none group-hover:border-emerald-400/60 transition-colors"
              style={{
                animation: 'spin 18s linear infinite',
              }}
            />

            {/* PRISTINE CUTOUT IMAGE */}
            <div className="relative w-36 h-48 sm:w-44 sm:h-56 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img
                src="/images/orvana-character-cutout.png"
                alt="Orvana 3D Digital Companion"
                className="w-full h-full object-contain pointer-events-none transition-all duration-500"
                style={{
                  filter: `drop-shadow(0 15px 25px rgba(0,0,0,0.45)) drop-shadow(0 0 16px ${activeStage.glowColor})`,
                }}
              />

              {/* TABLET HOLOGRAM GLOW */}
              <div className="absolute top-[48%] left-[38%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-400/25 rounded-full blur-md animate-pulse pointer-events-none" />
            </div>

            {/* MINI BADGE PILL BELOW CHARACTER */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-stone-200 whitespace-nowrap shadow-lg group-hover:border-emerald-500 transition-colors flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isExpanded ? 'Tutup HUD' : activeStage.badge}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
