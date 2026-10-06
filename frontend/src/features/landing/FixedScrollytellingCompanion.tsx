import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  Calculator,
  Bot,
  ArrowUp,
  X,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Interactive3DInspectorCanvas } from './Interactive3DInspectorCanvas';

interface SectionTip {
  title: string;
  badge: string;
  badgeColor: string;
  tip: string;
}

export const FixedScrollytellingCompanion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState<SectionTip>({
    title: 'Inspektur Digital',
    badge: 'Online 24/7',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    tip: 'Siap memandu rantai pasok pangan gizi.',
  });
  const [showBubble, setShowBubble] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll position smoothly to update the inspector's status tip
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;

      if (progress < 0.15) {
        setCurrentTip({
          title: 'Hero Showcase',
          badge: 'Selamat Datang',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          tip: 'Pelajari sistem alokasi panen lokal & dapur gizi mandiri.',
        });
      } else if (progress < 0.35) {
        setCurrentTip({
          title: 'Fisika Pasokan',
          badge: 'Komoditas Live',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          tip: 'Bola komoditas bereaksi terhadap kursor Anda!',
        });
      } else if (progress < 0.55) {
        setCurrentTip({
          title: 'Alur 4 Peran',
          badge: 'Sinergi Lapangan',
          badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          tip: 'Petani, koordinator, ahli gizi QC, dan pengelola dapur bersatu.',
        });
      } else if (progress < 0.75) {
        setCurrentTip({
          title: 'Simulasi Kebutuhan',
          badge: 'Demand Planner',
          badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          tip: 'Uji hitung kebutuhan kotor & anggaran makan bergizi anak.',
        });
      } else if (progress < 0.9) {
        setCurrentTip({
          title: 'Paspor Digital QR',
          badge: 'Transparansi Penuh',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          tip: 'Scan kode batch untuk melihat riwayat panen dan sertifikat lab.',
        });
      } else {
        setCurrentTip({
          title: 'Ekosistem Orvana',
          badge: 'Mari Bergabung',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          tip: 'Daftarkan kelompok tani atau dapur percontohan Anda.',
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <aside
      aria-label="Asisten Virtual Orvana"
      ref={containerRef}
      className="fixed bottom-6 right-6 z-40 select-none flex flex-col items-end pointer-events-auto"
    >
      {/* 1. EXPANDED ACTION CONCIERGE DRAWER / POPUP */}
      {isOpen && (
        <div className="mb-3 w-80 bg-stone-900/95 backdrop-blur-2xl border border-stone-700/80 rounded-2xl shadow-2xl p-4 text-stone-100 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold font-heading text-stone-100 leading-tight">
                  Concierge Virtual Orvana
                </h4>
                <p className="text-[10px] font-mono text-stone-400">
                  Navigasi Cepat & Akses Fitur
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="py-3 space-y-1.5 text-xs">
            <button
              onClick={() => scrollToSection('alur')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-emerald-300 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pelajari Alur 4 Peran</span>
              </span>
              <ChevronUp className="w-3.5 h-3.5 rotate-90 text-stone-500" />
            </button>

            <button
              onClick={() => scrollToSection('kalkulator')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-purple-300 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                <span>Kalkulator Kebutuhan Gizi</span>
              </span>
              <ChevronUp className="w-3.5 h-3.5 rotate-90 text-stone-500" />
            </button>

            <button
              onClick={() => scrollToSection('asisten')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-amber-300 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Tanya Asisten AI Pasokan</span>
              </span>
              <ChevronUp className="w-3.5 h-3.5 rotate-90 text-stone-500" />
            </button>

            <Link
              to="/trace/ORV-20260920-DPR01-0001"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-200 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Buka Demo Paspor QR</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <ArrowUp className="w-3 h-3" />
              <span>Kembali ke Atas</span>
            </button>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
              Audit Grade
            </span>
          </div>
        </div>
      )}

      {/* 2. CONTEXTUAL SPEECH BUBBLE (STATUS INSPEKTUR) */}
      {!isOpen && showBubble && (
        <div className="mb-2 mr-1 w-64 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-2xl p-3 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 relative">
          <button
            onClick={() => setShowBubble(false)}
            className="absolute top-2 right-2 text-stone-500 hover:text-stone-300"
            title="Sembunyikan dialog"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border ${currentTip.badgeColor}`}
            >
              {currentTip.badge}
            </span>
          </div>
          <p className="text-xs font-bold text-stone-100 leading-tight">
            {currentTip.title}
          </p>
          <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5">
            {currentTip.tip}
          </p>
        </div>
      )}

      {/* 3. FLOATING 3D CHARACTER AVATAR DOCK BUTTON (CORNER FIXED) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative group cursor-pointer flex items-end justify-center"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-label="Buka Asisten Inspektur Virtual"
      >
        {/* Glow Ring & Orbit Background */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl group-hover:bg-emerald-400/40 transition-colors pointer-events-none" />

        <div
          className="absolute -inset-1 rounded-full border border-emerald-400/40 opacity-70 group-hover:opacity-100 pointer-events-none transition-opacity"
          style={{
            animation: 'spin 20s linear infinite',
          }}
        />

        {/* REAL-TIME 3D THREE.JS CHARACTER (EYES, HEAD & TORSO TRACK CURSOR 100% IN REAL-TIME) */}
        <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <Interactive3DInspectorCanvas size={190} />
        </div>

        {/* Badge Pill Click Indicator */}
        <div className="absolute -bottom-1.5 bg-stone-900/95 backdrop-blur-md border border-stone-700 px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 group-hover:border-emerald-500 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-stone-200">
            {isOpen ? 'Tutup' : 'Asisten AI'}
          </span>
        </div>
      </div>
    </aside>
  );
};
