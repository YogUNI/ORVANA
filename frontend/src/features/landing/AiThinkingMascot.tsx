import React, { useEffect, useState } from 'react';

export type MascotReaction = 'idle' | 'thinking' | 'wow';

interface AiThinkingMascotProps {
  status: MascotReaction;
  size?: number;
}

export const AiThinkingMascot: React.FC<AiThinkingMascotProps> = ({ status, size = 110 }) => {
  const [bubbleText, setBubbleText] = useState<string>('Ketik pesan...');
  const [blink, setBlink] = useState(false);

  // Natural blinking effect for biological realism
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3200);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (status === 'thinking') {
      setBubbleText('Hmm... sedang membaca pesan...');
    } else if (status === 'wow') {
      setBubbleText('Wah, datanya langsung tercatat!');
    } else {
      setBubbleText('Ketik pesan panen Anda...');
    }
  }, [status]);

  return (
    <div className="relative flex flex-col items-center select-none shrink-0" style={{ width: '120px' }}>
      {/* Speech / Thought Bubble with arrow */}
      <div
        className={`relative mb-2 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold shadow-xs transition-all duration-300 text-center whitespace-nowrap z-10 ${
          status === 'thinking'
            ? 'bg-amber-400 text-stone-950 border border-amber-300 animate-pulse'
            : status === 'wow'
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
            : 'bg-stone-100 text-stone-700 border border-stone-200'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5">
          {status === 'thinking' && <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping shrink-0" />}
          {status === 'wow' && <span className="text-amber-300 text-[10px]">✨</span>}
          <span>{bubbleText}</span>
        </div>
        {/* Little bubble tail arrow pointing down to head */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${
            status === 'thinking'
              ? 'bg-amber-400 border-amber-300'
              : status === 'wow'
              ? 'bg-emerald-950 border-emerald-500'
              : 'bg-stone-100 border-stone-200'
          }`}
        />
      </div>

      {/* SVG Vector Living Character Stage (100% Vector, No Jagged Images) */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${size}px`, height: `${size * 1.05}px` }}
      >
        {/* Soft Organic Aura Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
            status === 'thinking'
              ? 'bg-amber-400/30 scale-110'
              : status === 'wow'
              ? 'bg-emerald-400/35 scale-125'
              : 'bg-emerald-500/15 scale-90'
          }`}
        />

        {/* Shockwave Rings on WOW */}
        {status === 'wow' && (
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
        )}

        {/* 2D Vector Procedural Animated Body */}
        <svg
          viewBox="0 0 120 140"
          className="w-full h-full overflow-visible transition-transform duration-500"
          style={{
            transform:
              status === 'thinking'
                ? 'rotate(-6deg) translateY(2px)'
                : status === 'wow'
                ? 'scale(1.1) translateY(-6px)'
                : 'translateY(0)',
          }}
        >
          {/* DEFINITIONS FOR GRADIENTS & SHADOWS */}
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A2F" />
              <stop offset="100%" stopColor="#0B1A14" />
            </linearGradient>
            <linearGradient id="vestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0B1A14" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. SHADOW PEDESTAL */}
          <ellipse
            cx="60"
            cy="134"
            rx={status === 'wow' ? 24 : 32}
            ry="4"
            fill="#0F172A"
            opacity={status === 'wow' ? 0.15 : 0.25}
            className="transition-all duration-500"
          />

          {/* 2. BODY / TORSO (BREATHING MOTION) */}
          <g
            className="transition-transform duration-500"
            style={{
              transformOrigin: '60px 100px',
              animation: status === 'thinking' ? 'none' : 'float-slow 3s ease-in-out infinite',
            }}
          >
            {/* Agritech Hoodie / Torso */}
            <path
              d="M 38 78 Q 60 72 82 78 L 86 114 Q 60 120 34 114 Z"
              fill="url(#bodyGrad)"
              filter="url(#softShadow)"
            />

            {/* Smart Green Agritech Vest Overlay */}
            <path
              d="M 44 76 Q 60 74 76 76 L 79 112 Q 60 116 41 112 Z"
              fill="url(#vestGrad)"
            />
            {/* Vest Collar Accent */}
            <path d="M 50 76 L 60 92 L 70 76 Z" fill="#FBBF24" opacity="0.9" />

            {/* 3. ARMS & HANDS WITH GESTURES */}
            {/* Left Arm (Relaxed) */}
            <path
              d="M 36 82 Q 22 96 28 110"
              stroke="#1E3A2F"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left Hand Glove */}
            <circle cx="28" cy="110" r="5" fill="#10B981" />

            {/* Right Arm: DYNAMIC POSE (Thinking on chin / Wow celebrating up) */}
            {status === 'thinking' ? (
              // Thinking Pose: Hand touching chin
              <g className="transition-all duration-300">
                <path
                  d="M 84 82 Q 96 95 76 68"
                  stroke="#1E3A2F"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Hand on chin */}
                <circle cx="74" cy="67" r="5.5" fill="#F59E0B" />
              </g>
            ) : status === 'wow' ? (
              // Wow Pose: Hand cheering upwards
              <g className="transition-all duration-300">
                <path
                  d="M 84 82 Q 102 70 98 48"
                  stroke="#1E3A2F"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="98" cy="46" r="6" fill="#FBBF24" />
                {/* Victory sparkle */}
                <path d="M 98 34 L 100 40 L 106 42 L 100 44 L 98 50 L 96 44 L 90 42 L 96 40 Z" fill="#F59E0B" />
              </g>
            ) : (
              // Idle Pose: Relaxed side arm
              <g className="transition-all duration-300">
                <path
                  d="M 84 82 Q 98 96 92 110"
                  stroke="#1E3A2F"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="92" cy="110" r="5" fill="#10B981" />
              </g>
            )}

            {/* 4. HEAD WITH FACIAL EXPRESSIONS & NATURAL EYE BLINKING */}
            <g
              style={{
                transformOrigin: '60px 48px',
                transform:
                  status === 'thinking'
                    ? 'rotate(-8deg) translateY(-1px)'
                    : status === 'wow'
                    ? 'rotate(3deg) translateY(-2px)'
                    : 'none',
              }}
              className="transition-transform duration-300"
            >
              {/* Head Base (Stylized Friendly Agritech Guide) */}
              <circle cx="60" cy="48" r="24" fill="url(#skinGrad)" filter="url(#softShadow)" />

              {/* Agritech Smart Cap / Beret */}
              <path
                d="M 36 44 Q 60 22 84 44 Q 88 34 78 26 Q 60 20 42 26 Q 32 34 36 44 Z"
                fill="#1E3A2F"
              />
              {/* Cap Visor */}
              <path d="M 36 44 Q 60 38 84 44 Q 60 48 36 44 Z" fill="#059669" />
              {/* Cap Leaf Badge */}
              <circle cx="60" cy="32" r="3.5" fill="#FBBF24" />

              {/* HAIR STRANDS */}
              <path d="M 38 43 Q 42 49 46 45" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 74 45 Q 78 49 82 43" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* EYEBROWS */}
              {status === 'thinking' ? (
                // Puzzled / Inquisitive eyebrows
                <g>
                  <path d="M 46 41 Q 52 38 56 42" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M 64 43 Q 68 39 74 38" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              ) : status === 'wow' ? (
                // Raised surprised eyebrows
                <g>
                  <path d="M 46 36 Q 51 32 56 36" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M 64 36 Q 69 32 74 36" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                // Friendly standard eyebrows
                <g>
                  <path d="M 47 39 Q 51 37 55 39" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <path d="M 65 39 Q 69 37 73 39" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* EYES (WITH BLINKING & WOW DILATION) */}
              {blink ? (
                // Blinking (Eyelids closed)
                <g>
                  <path d="M 47 47 Q 51 50 55 47" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M 65 47 Q 69 50 73 47" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
                </g>
              ) : status === 'thinking' ? (
                // Looking up / sideways while thinking
                <g>
                  <circle cx="51" cy="46" r="3.2" fill="#0F172A" />
                  <circle cx="69" cy="46" r="3.2" fill="#0F172A" />
                  {/* Eye glint */}
                  <circle cx="52" cy="45" r="1.2" fill="#FFFFFF" />
                  <circle cx="70" cy="45" r="1.2" fill="#FFFFFF" />
                </g>
              ) : status === 'wow' ? (
                // Wide open sparkling eyes
                <g>
                  <circle cx="51" cy="46" r="4.5" fill="#0F172A" />
                  <circle cx="69" cy="46" r="4.5" fill="#0F172A" />
                  {/* Big cute star glints */}
                  <circle cx="52.5" cy="44.5" r="2" fill="#FFFFFF" />
                  <circle cx="70.5" cy="44.5" r="2" fill="#FFFFFF" />
                  <circle cx="50" cy="47.5" r="0.9" fill="#FFFFFF" />
                  <circle cx="68" cy="47.5" r="0.9" fill="#FFFFFF" />
                </g>
              ) : (
                // Normal happy friendly eyes
                <g>
                  <circle cx="51" cy="47" r="3.5" fill="#0F172A" />
                  <circle cx="69" cy="47" r="3.5" fill="#0F172A" />
                  <circle cx="52" cy="46" r="1.4" fill="#FFFFFF" />
                  <circle cx="70" cy="46" r="1.4" fill="#FFFFFF" />
                </g>
              )}

              {/* CUTE CHEEK BLUSH */}
              <circle cx="44" cy="51" r="3" fill="#F87171" opacity="0.45" />
              <circle cx="76" cy="51" r="3" fill="#F87171" opacity="0.45" />

              {/* MOUTH (EXPRESSIVE: Pondering 'o', Open 'O' on wow, Smile on idle) */}
              {status === 'thinking' ? (
                // Puzzled pursed lips
                <circle cx="62" cy="57" r="2.2" fill="#991B1B" />
              ) : status === 'wow' ? (
                // Big excited open mouth "O"
                <ellipse cx="60" cy="58" rx="4" ry="5.5" fill="#7F1D1D" />
              ) : (
                // Friendly warm smile
                <path d="M 54 54 Q 60 60 66 54" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" fill="none" />
              )}
            </g>
          </g>

          {/* THINKING FLOATING BUBBLES ANIMATION */}
          {status === 'thinking' && (
            <g className="animate-bounce">
              <circle cx="82" cy="22" r="3" fill="#FBBF24" opacity="0.8" />
              <circle cx="88" cy="15" r="4" fill="#F59E0B" opacity="0.9" />
              <circle cx="97" cy="8" r="5.5" fill="#D97706" />
            </g>
          )}
        </svg>
      </div>

      {/* Responsive interaction hint */}
      <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-stone-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Karakter Merespons Input Anda</span>
      </div>
    </div>
  );
};
