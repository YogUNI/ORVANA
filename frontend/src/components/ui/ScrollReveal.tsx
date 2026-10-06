import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'after-effects' | 'fade-up' | 'cinematic-zoom' | 'fade-left' | 'fade-right';
  delayMs?: number;
  durationMs?: number;
  className?: string;
  showLensStreak?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'after-effects',
  delayMs = 0,
  durationMs = 850,
  className = '',
  showLensStreak = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getMotionStyle = () => {
    switch (animation) {
      case 'after-effects':
        // After Effects 3D Camera Depth & Elastic Spring Overshoot
        return isVisible
          ? {
              opacity: 1,
              transform: 'perspective(1200px) rotateX(0deg) scale(1) translateY(0px)',
              filter: 'blur(0px)',
              transition: `all ${durationMs}ms cubic-bezier(0.18, 1.22, 0.22, 1) ${delayMs}ms`,
            }
          : {
              opacity: 0,
              transform: 'perspective(1200px) rotateX(7deg) scale(0.92) translateY(55px)',
              filter: 'blur(4px)',
              transition: `all ${durationMs}ms cubic-bezier(0.18, 1.22, 0.22, 1) ${delayMs}ms`,
            };

      case 'cinematic-zoom':
        return isVisible
          ? {
              opacity: 1,
              transform: 'scale(1) translateY(0px)',
              filter: 'blur(0px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            }
          : {
              opacity: 0,
              transform: 'scale(1.08) translateY(20px)',
              filter: 'blur(6px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            };

      case 'fade-left':
        return isVisible
          ? {
              opacity: 1,
              transform: 'translateX(0px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            }
          : {
              opacity: 0,
              transform: 'translateX(-40px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            };

      case 'fade-right':
        return isVisible
          ? {
              opacity: 1,
              transform: 'translateX(0px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            }
          : {
              opacity: 0,
              transform: 'translateX(40px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            };

      case 'fade-up':
      default:
        return isVisible
          ? {
              opacity: 1,
              transform: 'translateY(0px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            }
          : {
              opacity: 0,
              transform: 'translateY(35px)',
              transition: `all ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
            };
    }
  };

  return (
    <div
      ref={elementRef}
      style={getMotionStyle()}
      className={`relative transform-gpu will-change-[transform,opacity,filter] ${className}`}
    >
      {children}

      {/* After Effects Specular Lens Light Sweep (Menyapu permukaan saat ter-reveal) */}
      {showLensStreak && isVisible && (
        <div
          aria-hidden="true"
          style={{ animationDelay: `${delayMs + 150}ms` }}
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl -z-0"
        >
          <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-amber-200/25 to-transparent animate-lens-streak" />
        </div>
      )}
    </div>
  );
};
