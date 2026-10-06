import React, { useState } from 'react';
import {
  Bot,
  X,
  Sparkles,
  Search,
  Calculator,
  ArrowUp,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SmartFloatingConcierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

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
      aria-label="Pusat Bantuan Cepat"
      className="fixed bottom-6 right-6 z-40 select-none flex flex-col items-end pointer-events-auto"
    >
      {/* QUICK CONCIERGE DRAWER / POPUP */}
      {isOpen && (
        <div className="mb-3 w-76 bg-stone-900/95 backdrop-blur-2xl border border-stone-700/80 rounded-2xl shadow-2xl p-4 text-stone-100 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold font-heading text-stone-100 leading-tight">
                  Asisten Cepat Orvana
                </h4>
                <p className="text-[10px] font-mono text-stone-400">
                  Navigasi Langsung ke Fitur
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
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-emerald-300 transition-all text-left group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alur 4 Peran Lapangan</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => scrollToSection('kalkulator')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-purple-300 transition-all text-left group"
            >
              <span className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                <span>Kalkulator Kebutuhan Gizi</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => scrollToSection('asisten')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-200 hover:text-amber-300 transition-all text-left group"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Tanya Asisten AI Pasokan</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <Link
              to="/trace/ORV-20260920-DPR01-0001"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-200 transition-all text-left"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Demo Paspor Mutu QR</span>
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

      {/* MODERN ENTERPRISE FLOATING PILL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900/95 hover:bg-stone-900 border border-stone-700/80 hover:border-emerald-500/80 text-stone-100 shadow-xl shadow-stone-950/20 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Buka Menu Asisten Cepat"
      >
        {/* Glow pulsing ring */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-xs opacity-0 group-hover:opacity-100 transition-opacity" />

        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        <Bot className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />

        <span className="relative text-xs font-semibold tracking-wide">
          {isOpen ? 'Tutup Menu' : 'Asisten AI'}
        </span>
      </button>
    </aside>
  );
};
