import React, { useEffect, useState } from 'react';

export const MoncyCustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [hoverText, setHoverText] = useState('');

  useEffect(() => {
    // Only enable on non-touch desktop devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest('button, a, input, [data-cursor]');
        if (interactiveEl) {
          setIsHovered(true);
          const customText = interactiveEl.getAttribute('data-cursor');
          setHoverText(customText || '');
        } else {
          setIsHovered(false);
          setHoverText('');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (pos.x < 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      className={`fixed pointer-events-none z-50 rounded-full transition-all duration-150 ease-out flex items-center justify-center font-mono text-[10px] font-bold ${
        isHovered
          ? 'w-14 h-14 bg-emerald-400 text-stone-950 shadow-[0_0_25px_#34d399] opacity-90 scale-100'
          : 'w-4 h-4 bg-emerald-500 shadow-[0_0_12px_#10b981] opacity-75 scale-75'
      }`}
    >
      {hoverText && (
        <span className="truncate uppercase tracking-wider text-[9px] px-1 text-center font-bold">
          {hoverText}
        </span>
      )}
    </div>
  );
};
