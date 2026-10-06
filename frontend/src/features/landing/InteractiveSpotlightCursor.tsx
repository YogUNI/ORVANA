import React, { useEffect, useState } from 'react';

export const InteractiveSpotlightCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [targetPos, setTargetPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Smooth lerp loop
    let animId: number;
    const lerp = () => {
      setPos((prev) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.12,
        y: prev.y + (targetPos.y - prev.y) * 0.12,
      }));
      animId = requestAnimationFrame(lerp);
    };
    animId = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [targetPos]);

  return (
    <div
      aria-hidden="true"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      className="fixed pointer-events-none w-[580px] h-[580px] rounded-full bg-gradient-to-r from-emerald-500/12 via-teal-400/8 to-amber-400/8 blur-3xl z-0 transition-opacity duration-500"
    />
  );
};
