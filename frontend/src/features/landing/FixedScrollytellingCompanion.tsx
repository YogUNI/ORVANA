import React, { useEffect, useState, useMemo } from 'react';

interface StageConfig {
  id: string;
  name: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  pos: {
    x: number; // percentage from left (0 to 100)
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

  // Define stages matching key sections on the landing page
  const stages: StageConfig[] = useMemo(
    () => [
      {
        id: 'hero',
        name: 'Hero Showcase',
        title: 'Halo! Saya Mitra Inspeksi Orvana',
        badge: 'AI & IoT Verified',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        description: 'Menjaga transparansi bahan pangan dari kebun hingga mangkok gizi anak.',
        pos: { x: 74, y: 38, scale: 1.05, rotateY: -12, rotateZ: 2 },
        glowColor: 'rgba(16, 185, 129, 0.4)',
      },
      {
        id: 'techballs',
        name: 'Fisika Pasokan',
        title: 'Komoditas Segar Terpantau',
        badge: 'Live Physics',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        description: 'Tiap komoditas memiliki parameter suhu, kelembaban, dan kuota panen.',
        pos: { x: 18, y: 46, scale: 0.95, rotateY: 15, rotateZ: -3 },
        glowColor: 'rgba(245, 158, 11, 0.4)',
      },
      {
        id: 'alur',
        name: 'Alur 4 Peran',
        title: 'Mengawal Distribusi Petani & Dapur',
        badge: 'Sinergi Lapangan',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: 'Petani panen, pengepul kurasi, ahli gizi uji lab, dapur terima tepat waktu.',
        pos: { x: 82, y: 44, scale: 0.92, rotateY: -16, rotateZ: 4 },
        glowColor: 'rgba(59, 130, 246, 0.4)',
      },
      {
        id: 'trace',
        name: 'Penelusuran Publik',
        title: 'Scan QR Transparansi 100%',
        badge: 'Digital Passport',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Setiap kemasan dapat ditelusuri petani asal, suhu pengiriman & sertifikasi lab.',
        pos: { x: 15, y: 42, scale: 1.0, rotateY: 14, rotateZ: -2 },
        glowColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        id: 'ledger',
        name: 'Escrow & Pembayaran',
        title: 'Pencairan Dana Otomatis & Adil',
        badge: 'Smart Escrow',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        description: 'Begitu uji QC lolos di dapur, saldo kas langsung dicairkan tanpa potongan liar.',
        pos: { x: 80, y: 48, scale: 0.95, rotateY: -10, rotateZ: 2 },
        glowColor: 'rgba(168, 85, 247, 0.4)',
      },
      {
        id: 'cta',
        name: 'Aksi Bersama',
        title: 'Siap Bergabung dengan Ekosistem?',
        badge: 'Daftar Sekarang',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Mulai digitalisasi dapur gizi Anda atau daftarkan kelompok tani hari ini.',
        pos: { x: 50, y: 52, scale: 1.1, rotateY: 0, rotateZ: 0 },
        glowColor: 'rgba(234, 179, 8, 0.45)',
      },
    ],
    []
  );

  // Track window scroll progress and assign stages with smooth interpolations
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / docHeight));

      // Determine active stage based on progress breakpoints
      if (progress < 0.15) {
        setActiveStageIndex(0); // Hero
      } else if (progress < 0.35) {
        setActiveStageIndex(1); // Techballs / Komoditas
      } else if (progress < 0.58) {
        setActiveStageIndex(2); // Alur 4 Peran
      } else if (progress < 0.78) {
        setActiveStageIndex(3); // Trace
      } else if (progress < 0.92) {
        setActiveStageIndex(4); // Escrow Ledger
      } else {
        setActiveStageIndex(5); // CTA
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax subtle tracking with mouse cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x: normX * 15, y: normY * 15 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const activeStage = stages[activeStageIndex];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-700 hidden lg:block opacity-100"
      aria-hidden="true"
    >
      {/* 3D FLOATING SCROLLYTELLING CONTAINER */}
      <div
        className="absolute transition-all duration-1000 ease-out will-change-transform"
        style={{
          left: `${activeStage.pos.x}%`,
          top: `${activeStage.pos.y}%`,
          transform: `translate(-50%, -50%) translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(${activeStage.pos.scale})`,
        }}
      >
        {/* CHARACTER AVATAR WRAPPER WITH 3D PERSPECTIVE */}
        <div
          className="relative w-72 h-88 sm:w-80 sm:h-96 flex items-center justify-center transition-transform duration-700 ease-out"
          style={{
            perspective: '1000px',
            transform: `rotateY(${activeStage.pos.rotateY + mouseOffset.x * 0.4}deg) rotateZ(${activeStage.pos.rotateZ}deg)`,
          }}
        >
          {/* MONCY.DEV STYLE DUAL ORBITAL GLOW RINGS (Background halos) */}
          <div
            className="absolute -inset-10 rounded-full blur-2xl opacity-40 transition-colors duration-1000 pointer-events-none animate-pulse"
            style={{ backgroundColor: activeStage.glowColor }}
          />

          <div
            className="absolute w-64 h-64 rounded-full border border-emerald-400/30 opacity-60 pointer-events-none"
            style={{
              animation: 'spin 20s linear infinite',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.25) inset',
            }}
          />

          <div
            className="absolute w-80 h-80 rounded-full border border-dashed border-amber-400/25 opacity-40 pointer-events-none"
            style={{
              animation: 'spin 35s linear infinite reverse',
            }}
          />

          {/* 3D CHARACTER TRANSPARENT CUTOUT */}
          <div className="relative w-full h-full flex items-center justify-center animate-bounce-gentle">
            <img
              src="/images/orvana-character-cutout.png"
              alt="Orvana 3D Digital Companion"
              className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.65)] select-none pointer-events-none transition-all duration-500"
              style={{
                filter: `drop-shadow(0 25px 35px rgba(0,0,0,0.6)) drop-shadow(0 0 20px ${activeStage.glowColor})`,
              }}
            />

            {/* HOLOGRAM SCANNER BEAM EFFECT AT TABLET */}
            <div className="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl animate-pulse pointer-events-none" />
          </div>

          {/* DYNAMIC SPEECH DIALOG BUBBLE (Narrates each section) */}
          <div
            className={`absolute top-0 ${
              activeStage.pos.x > 50 ? '-left-64' : '-right-64'
            } w-60 bg-stone-900/90 backdrop-blur-xl border border-stone-700/80 p-3.5 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-500 hover:scale-105`}
            style={{
              boxShadow: `0 10px 30px -10px ${activeStage.glowColor}`,
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

            {/* MINI STAGE NAVIGATION DOTS */}
            <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
                Fokus: {activeStage.name}
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

          {/* FLOATING SHADOW GROUND EFFECT */}
          <div
            className="absolute -bottom-8 w-44 h-7 rounded-[100%] bg-stone-950/70 blur-md transition-all duration-700 pointer-events-none"
            style={{
              transform: `scale(${1 - mouseOffset.y * 0.01})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
