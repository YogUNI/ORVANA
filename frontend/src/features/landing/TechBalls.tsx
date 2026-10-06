import React, { useEffect, useRef } from 'react';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  sub: string;
  color: string;
  textColor: string;
}

const ITEMS = [
  { label: 'Bayam Hijau', sub: '69 kg', color: '#10B981', textColor: '#042F2E' },
  { label: 'Ikan Lele', sub: 'Mutu 90', color: '#065F46', textColor: '#FFFFFF' },
  { label: 'Escrow Safe', sub: 'Rp 537k', color: '#D97706', textColor: '#FFFFFF' },
  { label: 'Cap 60%', sub: 'Anti-Monopoli', color: '#0284C7', textColor: '#FFFFFF' },
  { label: 'QC Pass', sub: '100% Grade A', color: '#059669', textColor: '#FFFFFF' },
  { label: 'Beras Pandan', sub: 'Subur Desa', color: '#F59E0B', textColor: '#042F2E' },
];

export const TechBalls: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 140);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 500;
      height = canvas.height = 140;
    };
    window.addEventListener('resize', handleResize);

    const balls: Ball[] = ITEMS.map((item, idx) => ({
      x: (width / (ITEMS.length + 1)) * (idx + 1),
      y: height / 2 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: 42,
      label: item.label,
      sub: item.sub,
      color: item.color,
      textColor: item.textColor,
    }));

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      balls.forEach((ball) => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce walls
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx *= -1;
        }
        if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx *= -1;
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy *= -1;
        }
        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy *= -1;
        }

        // Mouse push
        const dx = ball.x - mouse.x;
        const dy = ball.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + 35) {
          const force = (ball.radius + 35 - dist) / (ball.radius + 35);
          const angle = Math.atan2(dy, dx);
          ball.x += Math.cos(angle) * force * 3;
          ball.y += Math.sin(angle) * force * 3;
        }

        // Draw 3D-shaded Sphere
        const grad = ctx.createRadialGradient(
          ball.x - ball.radius * 0.35,
          ball.y - ball.radius * 0.35,
          ball.radius * 0.1,
          ball.x,
          ball.y,
          ball.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, ball.color);
        grad.addColorStop(1, '#051b11');

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner glowing border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Label
        ctx.fillStyle = ball.textColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.label, ball.x, ball.y - 5);

        // Sublabel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(ball.sub, ball.x, ball.y + 7);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full relative py-3 overflow-hidden rounded-2xl bg-stone-900/40 border border-white/10 backdrop-blur-md">
      <div className="px-4 pb-1 text-left flex items-center justify-between">
        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Interactive 3D Commodity Physics Balls (Gerakkan Kursor)
        </span>
        <span className="text-[9px] font-mono text-stone-400">moncy.dev TechBalls Inspired</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[140px] cursor-grab active:cursor-grabbing" />
    </div>
  );
};
