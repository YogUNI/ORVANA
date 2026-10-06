import React, { useEffect, useState, useRef } from 'react';

interface AliveAvatarProps {
  size?: number;
}

export const AliveAvatar: React.FC<AliveAvatarProps> = ({ size = 150 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, moveX: 0, moveY: 0 });

  // REAL-TIME 3D PERSPECTIVE TRACKING TOWARDS MOUSE CURSOR
  useEffect(() => {
    let animId: number;
    const target = { rx: 0, ry: 0, mx: 0, my: 0 };
    const current = { rx: 0, ry: 0, mx: 0, my: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Relative angle from avatar towards cursor
      const dx = (e.clientX - centerX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - centerY) / (window.innerHeight * 0.5);

      // Natural 3D head and body gaze orientation
      target.ry = Math.max(-28, Math.min(28, dx * 28)); // Look left/right
      target.rx = Math.max(-20, Math.min(20, -dy * 20)); // Look up/down
      target.mx = Math.max(-10, Math.min(10, dx * 10));
      target.my = Math.max(-10, Math.min(10, dy * 10));
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 60FPS smooth lerp
    const loop = () => {
      current.rx += (target.rx - current.rx) * 0.1;
      current.ry += (target.ry - current.ry) * 0.1;
      current.mx += (target.mx - current.mx) * 0.1;
      current.my += (target.my - current.my) * 0.1;

      setTilt({
        rotateX: current.rx,
        rotateY: current.ry,
        moveX: current.mx,
        moveY: current.my,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size * 1.25}px`,
        perspective: '800px',
      }}
    >
      {/* 1. AMBIENT GLOW BACKLIGHT */}
      <div
        className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl pointer-events-none transition-transform duration-300"
        style={{
          transform: `translate(${tilt.moveX * 0.5}px, ${tilt.moveY * 0.5}px)`,
        }}
      />

      {/* 2. DUAL ORBITAL RINGS */}
      <div
        className="absolute w-36 h-36 rounded-full border border-emerald-400/40 opacity-70 pointer-events-none"
        style={{
          animation: 'spin 18s linear infinite',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.25) inset',
        }}
      />

      {/* 3. 3D LEVITATING AVATAR WITH SMOOTH TILT TRACKING */}
      <div
        className="relative w-full h-full flex items-center justify-center animate-bounce-gentle will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${tilt.rotateY}deg) rotateX(${tilt.rotateX}deg) translate3d(${tilt.moveX}px, ${tilt.moveY}px, 0)`,
          transition: 'transform 0.08s ease-out',
        }}
      >
        {/* PURE ORIGINAL 3D CHARACTER ARTWORK (NO ARTIFICIAL OVERLAYS) */}
        <img
          src="/images/orvana-pure-avatar.png"
          alt="Orvana 3D Digital Companion"
          className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.55)] transition-all duration-300"
        />

        {/* HOLOGRAM QR TABLET ACCENT GLOW */}
        <div className="absolute top-[45%] left-[22%] w-14 h-14 bg-emerald-400/20 rounded-full blur-md animate-pulse pointer-events-none" />
      </div>
    </div>
  );
};
