import React, { useEffect, useState, useRef } from 'react';

interface AliveRiggedInspectorProps {
  size?: number;
}

export const AliveRiggedInspector: React.FC<AliveRiggedInspectorProps> = ({ size = 180 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lookAngles, setLookAngles] = useState({ x: 0, y: 0 }); // relative aim towards mouse
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [gestureMode, setGestureMode] = useState<'idle' | 'scratch' | 'tablet'>('idle');

  // 1. REAL-TIME MOUSE TRACKING: Compute angle relative to character's screen position
  useEffect(() => {
    let animId: number;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      // Vector pointing from character to mouse pointer
      const dx = (e.clientX - charCenterX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - charCenterY) / (window.innerHeight * 0.5);

      // Clamp target rotation
      target.x = Math.max(-1.3, Math.min(1.3, dx));
      target.y = Math.max(-1.1, Math.min(1.1, dy));
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 60FPS smooth damping interpolation (Lerp)
    const updateMotion = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      setLookAngles({ x: current.x, y: current.y });
      animId = requestAnimationFrame(updateMotion);
    };

    animId = requestAnimationFrame(updateMotion);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 2. NATURAL EYE BLINKING (Every 3-5 seconds)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  // 3. MOUTH TALKING CHATTER (Continuous gentle talking expression)
  useEffect(() => {
    const talkInterval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 240);

    return () => clearInterval(talkInterval);
  }, []);

  // 4. PERIODIC IDLE GESTURES (Garuk kepala / Sentuh headset setiap 7 detik)
  useEffect(() => {
    const gestureInterval = setInterval(() => {
      setGestureMode('scratch');
      setTimeout(() => {
        setGestureMode('idle');
      }, 2200);
    }, 7500);

    return () => clearInterval(gestureInterval);
  }, []);

  // 3D Matrix Transformations
  const headRotateY = lookAngles.x * 24; // Head turns up to 24 deg left/right
  const headRotateX = -lookAngles.y * 18; // Head nods up to 18 deg up/down
  const eyeShiftX = lookAngles.x * 6; // Pupils move 6px
  const eyeShiftY = lookAngles.y * 5; // Pupils move 5px
  const bodyRotateY = lookAngles.x * 10; // Torso leans slightly

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size * 1.15}px`,
        perspective: '1000px',
      }}
    >
      {/* BACKGROUND ORBITAL GLOW HALO */}
      <div
        className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl pointer-events-none animate-pulse"
        style={{
          transform: `scale(${1 + Math.abs(lookAngles.x) * 0.1})`,
        }}
      />

      <div
        className="absolute w-40 h-40 rounded-full border border-emerald-400/30 opacity-60 pointer-events-none"
        style={{
          animation: 'spin 22s linear infinite',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.25) inset',
        }}
      />

      {/* FLOATING BREATHING RIG ROOT (Animated up/down) */}
      <div
        className="relative w-full h-full flex items-center justify-center will-change-transform animate-bounce-gentle"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${bodyRotateY}deg) rotateX(${headRotateX * 0.3}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* LAYER 1: BASE FULL BODY HIGH-DETAIL CARTOON ARTWORK */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/images/char-body-clean.png"
            alt="Orvana 3D Digital Inspector"
            className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.55)] drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          />

          {/* LAYER 2: 2.5D RIGGED HEAD WITH ACTIVE MOUSE TRACKING */}
          <div
            className="absolute top-[10%] left-[34%] w-[42%] h-[36%] will-change-transform"
            style={{
              transformOrigin: '50% 90%',
              transform: `rotateY(${headRotateY}deg) rotateX(${headRotateX}deg) translateZ(15px)`,
              transition: 'transform 0.08s ease-out',
            }}
          >
            {/* DYNAMIC EYES (ACTIVE PUPILS LOOKING AT MOUSE) */}
            <div className="absolute top-[38%] left-[28%] w-[46%] h-[20%] flex justify-between items-center px-1">
              {/* Left Eye */}
              <div
                className={`relative w-4 h-4 bg-white rounded-full overflow-hidden shadow-inner transition-transform duration-100 ${
                  isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
                }`}
              >
                {/* Glowing Green Iris & Pupil Tracking Cursor */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-300 shadow-xs"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${eyeShiftX}px, ${eyeShiftY}px)`,
                    transition: 'transform 0.05s ease-out',
                  }}
                >
                  <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>

              {/* Right Eye */}
              <div
                className={`relative w-4 h-4 bg-white rounded-full overflow-hidden shadow-inner transition-transform duration-100 ${
                  isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
                }`}
              >
                {/* Glowing Green Iris & Pupil Tracking Cursor */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-300 shadow-xs"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${eyeShiftX}px, ${eyeShiftY}px)`,
                    transition: 'transform 0.05s ease-out',
                  }}
                >
                  <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* DYNAMIC TALKING MOUTH */}
            <div
              className="absolute top-[68%] left-[44%] w-3 h-1.5 rounded-full bg-rose-900 border border-rose-950/40 transition-transform duration-150"
              style={{
                transform: mouthOpen ? 'scaleY(1.8) scaleX(1.1)' : 'scaleY(0.7) scaleX(1)',
              }}
            />
          </div>

          {/* LAYER 3: DYNAMIC HAND GESTURE (Scratching head / touching comms) */}
          <div
            className="absolute top-[18%] right-[16%] w-8 h-8 rounded-full pointer-events-none transition-all duration-500 ease-out"
            style={{
              transform:
                gestureMode === 'scratch'
                  ? 'translate(-12px, -8px) rotate(-25deg) scale(1.1)'
                  : 'translate(0, 0) rotate(0deg)',
              opacity: gestureMode === 'scratch' ? 1 : 0,
            }}
          >
            {/* Gesture Hand Graphic Indicator */}
            <div className="w-6 h-6 rounded-full bg-amber-600/90 border border-amber-300 shadow-md flex items-center justify-center text-[10px] text-white">
              ✋
            </div>
          </div>

          {/* LAYER 4: GLOWING HOLOGRAM QR SCANNER TABLET */}
          <div className="absolute top-[42%] left-[18%] w-14 h-14 bg-emerald-400/25 rounded-xl blur-md animate-pulse pointer-events-none" />

          {/* Digital Scanning Laser Bar */}
          <div
            className="absolute top-[45%] left-[20%] w-10 h-0.5 bg-emerald-300 shadow-[0_0_8px_#34d399] pointer-events-none"
            style={{
              animation: 'bounce 2.2s infinite ease-in-out',
            }}
          />
        </div>
      </div>
    </div>
  );
};
