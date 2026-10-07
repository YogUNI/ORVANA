import React, { useEffect, useState, useRef } from 'react';

export type MascotReaction = 'idle' | 'thinking' | 'wow';

interface AiThinkingMascotProps {
  status: MascotReaction;
  size?: number;
}

export const AiThinkingMascot: React.FC<AiThinkingMascotProps> = ({ status, size = 110 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbleText, setBubbleText] = useState<string>('Ketik pesan...');

  useEffect(() => {
    if (status === 'thinking') {
      setBubbleText('Hmm... menganalisis entitas...');
    } else if (status === 'wow') {
      setBubbleText('Wow! Ekstraksi berhasil!');
    } else {
      setBubbleText('Coba ketik bahasa petani...');
    }
  }, [status]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center select-none"
      style={{ width: `${size * 1.5}px` }}
    >
      {/* Dynamic Speech / Thought Bubble */}
      <div
        className={`mb-2 px-3 py-1.5 rounded-2xl text-[10px] font-mono font-bold shadow-md transition-all duration-300 transform ${
          status === 'thinking'
            ? 'bg-amber-400 text-stone-950 scale-105 border border-amber-300 animate-pulse'
            : status === 'wow'
            ? 'bg-emerald-950 text-emerald-300 scale-110 border border-emerald-500 ring-2 ring-emerald-400/40'
            : 'bg-white/90 text-stone-600 border border-stone-200'
        }`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {status === 'thinking' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-800 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-900" />
            </span>
          )}
          {status === 'wow' && <span className="text-amber-300">✨</span>}
          <span>{bubbleText}</span>
        </div>
      </div>

      {/* Main Character Body Stage */}
      <div
        className="relative flex items-center justify-center transition-transform duration-500 ease-out"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {/* Glow Aura Backdrop */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
            status === 'thinking'
              ? 'bg-amber-400/35 scale-110'
              : status === 'wow'
              ? 'bg-emerald-400/40 scale-125'
              : 'bg-emerald-500/15 scale-90'
          }`}
        />

        {/* Floating Ring Aura when WOW */}
        {status === 'wow' && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
        )}

        {/* 3D Character Avatar Image with Smooth Physics Expression */}
        <div
          className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ease-out ${
            status === 'thinking'
              ? '-rotate-6 scale-95 translate-y-1'
              : status === 'wow'
              ? 'scale-115 -translate-y-2 rotate-2'
              : 'scale-100 hover:scale-105'
          }`}
        >
          <img
            src="/images/orvana-pure-avatar.png"
            alt="AI Companion"
            className="w-full h-full object-contain filter drop-shadow-xl pointer-events-none"
          />

          {/* Thinking Floating Particles (Bubbles of Thought) */}
          {status === 'thinking' && (
            <div className="absolute -top-1 -right-1 flex gap-1 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-sm" />
              <span className="w-1 h-1 rounded-full bg-amber-200 shadow-sm" />
            </div>
          )}

          {/* Sparkles Burst on WOW Reaction */}
          {status === 'wow' && (
            <div className="absolute -top-3 -right-3 text-amber-400 font-bold text-sm animate-bounce">
              ⚡ 100% Match!
            </div>
          )}
        </div>
      </div>

      {/* Shadow Pedestal */}
      <div
        className={`w-16 h-2 rounded-full bg-stone-900/15 blur-[2px] transition-all duration-500 mt-1 ${
          status === 'wow' ? 'scale-75 opacity-40' : status === 'thinking' ? 'scale-90 opacity-60' : 'scale-100 opacity-50'
        }`}
      />
    </div>
  );
};
