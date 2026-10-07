import React, { useEffect, useRef } from 'react';


interface ClickParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const MoncyCustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Active hovered element for dynamic magnification
    let activeHoverEl: HTMLElement | null = null;

    // Click particle bursts
    const particles: ClickParticle[] = [];
    const colors = ['#10B981', '#34D399', '#F59E0B', '#059669', '#FDE047'];

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

      // 2. DETECT INTERACTIVE ELEMENTS & DYNAMIC MAGNIFICATION
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest('button, a, input, [role="button"], [data-cursor]') as HTMLElement | null;

      if (interactiveEl) {
        isHovering = true;
        const customLabel = interactiveEl.getAttribute('data-cursor');
        hoverText = customLabel || '';

        // Magnify hovered element smoothly like a magnifying lens
        if (activeHoverEl !== interactiveEl) {
          if (activeHoverEl) {
            activeHoverEl.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
            activeHoverEl.style.transform = '';
          }
          activeHoverEl = interactiveEl;
          activeHoverEl.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
          activeHoverEl.style.transform = 'scale(1.05)';
        }
      } else {
        isHovering = false;
        hoverText = '';
        if (activeHoverEl) {
          activeHoverEl.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
          activeHoverEl.style.transform = '';
          activeHoverEl = null;
        }
      }
    };

    // 3. SPAWN VIBRANT AGRITECH SPARK PARTICLES ON EVERY CLICK
    const handleMouseDown = (e: MouseEvent) => {
      isClicking = true;

      // Spawn 10-14 spark particles
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 3.5 + 2;
        particles.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 1.5,
          alpha: 1,
        });
      }
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
      if (activeHoverEl) {
        activeHoverEl.style.transform = '';
        activeHoverEl = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Setup particle canvas
    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx = canvas.getContext('2d');
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // 4. ULTRA-FLUID 120FPS LERP PHYSICS & PARTICLE ANIMATION LOOP
    const loop = () => {
      const lerpSpeed = isHovering ? 0.28 : 0.18;
      ringX += (mouseX - ringX) * lerpSpeed;
      ringY += (mouseY - ringY) * lerpSpeed;

      if (ringRef.current) {
        let scale = 1;
        if (isClicking) {
          scale = 0.75;
        } else if (isHovering) {
          scale = hoverText ? 2.2 : 1.7;
        }

        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;

        // Magnifying glass lens appearance
        if (isHovering) {
          ringRef.current.className =
            'fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center transition-[background-color,border-color,box-shadow,width,height] duration-200 ease-out will-change-transform w-12 h-12 border-2 border-emerald-500 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.3)]';
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

      // Render click burst particles
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.alpha -= 0.035;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
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
      window.removeEventListener('resize', handleResize);
      if (activeHoverEl) {
        activeHoverEl.style.transform = '';
      }
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* 1. CLICK BURST PARTICLES CANVAS OVERLAY */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9998]"
      />

      {/* 2. ULTRA-ACCURATE ZERO-LAG DOT */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          opacity: 0,
        }}
        className="fixed top-0 left-0 pointer-events-none z-[10000] w-2 h-2 rounded-full bg-emerald-800 shadow-[0_0_8px_#065f46] will-change-transform transition-opacity duration-300"
      />

      {/* 3. FLUID SPRING LENS RING (MAGNETIC HOVER & MAGNIFYING LENS) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          opacity: 0,
        }}
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-8 h-8 rounded-full border border-emerald-600/40 bg-transparent flex items-center justify-center will-change-transform transition-opacity duration-300"
      >
        <span
          ref={labelRef}
          className="font-mono text-[8px] font-bold uppercase tracking-wider text-emerald-950 px-1 truncate select-none opacity-0 transition-opacity duration-200"
        />
      </div>
    </>
  );
};
