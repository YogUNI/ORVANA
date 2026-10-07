import React, { useEffect, useRef } from 'react';

export const InteractiveSpotlightCursor: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetX = -1000;
      targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Smooth 60-120fps hardware-accelerated lerp loop without triggering React renders
    const loop = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      aria-hidden="true"
      style={{
        transform: 'translate3d(-1000px, -1000px, 0) translate(-50%, -50%)',
      }}
      className="fixed top-0 left-0 pointer-events-none w-[580px] h-[580px] rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-400/6 to-amber-400/6 blur-3xl z-0 will-change-transform"
    />
  );
};
