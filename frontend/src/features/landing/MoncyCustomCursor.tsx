import React, { useEffect, useRef } from 'react';

export const MoncyCustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;
    let hoverText = '';
    let isVisible = false;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        ringX = mouseX;
        ringY = mouseY;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }

      // 1. INSTANT DOT: 100% zero-lag exact cursor position via hardware transform
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      // 2. DETECT INTERACTIVE ELEMENTS & HOVER REACTION
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest('button, a, input, [role="button"], [data-cursor]');
        if (interactiveEl) {
          isHovering = true;
          const customLabel = interactiveEl.getAttribute('data-cursor');
          hoverText = customLabel || '';
        } else {
          isHovering = false;
          hoverText = '';
        }
      }
    };

    const handleMouseDown = () => {
      isClicking = true;
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // 3. ULTRA-FLUID 120FPS LERP PHYSICS LOOP (Zero React Re-renders)
    const loop = () => {
      // Smooth spring trailing lerp (0.18 factor for snappy yet organic follow)
      const lerpSpeed = isHovering ? 0.24 : 0.18;
      ringX += (mouseX - ringX) * lerpSpeed;
      ringY += (mouseY - ringY) * lerpSpeed;

      if (ringRef.current) {
        // Calculate dynamic scale based on hover & click states
        let scale = 1;
        if (isClicking) {
          scale = 0.8;
        } else if (isHovering) {
          scale = hoverText ? 2.2 : 1.6;
        }

        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;

        // Dynamic styling depending on hover state (Crystal Clear Lens without Blur)
        if (isHovering) {
          ringRef.current.className =
            'fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center transition-[background-color,border-color,box-shadow,width,height] duration-200 ease-out will-change-transform w-11 h-11 border-2 border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
        } else {
          ringRef.current.className =
            'fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center transition-[background-color,border-color,box-shadow,width,height] duration-200 ease-out will-change-transform w-8 h-8 border border-emerald-600/40 bg-transparent shadow-none';
        }
      }

      if (labelRef.current) {
        if (hoverText) {
          labelRef.current.textContent = hoverText;
          labelRef.current.style.opacity = '1';
        } else {
          labelRef.current.textContent = '';
          labelRef.current.style.opacity = '0';
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* 1. ULTRA-ACCURATE ZERO-LAG DOT (INSTANT FEEDBACK) */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          opacity: 0,
        }}
        className="fixed top-0 left-0 pointer-events-none z-[10000] w-2 h-2 rounded-full bg-emerald-800 shadow-[0_0_8px_#065f46] will-change-transform transition-opacity duration-300"
      />

      {/* 2. FLUID SPRING AURA RING (MAGNETIC HOVER & TACTILE BOUNCE) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          opacity: 0,
        }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-9 h-9 rounded-full border border-emerald-600/50 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center justify-center will-change-transform transition-opacity duration-300"
      >
        <span
          ref={labelRef}
          className="font-mono text-[8px] font-bold uppercase tracking-wider text-emerald-950 px-1 truncate select-none opacity-0 transition-opacity duration-200"
        />
      </div>
    </>
  );
};
