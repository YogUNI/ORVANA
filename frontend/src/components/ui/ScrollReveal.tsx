import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-up';
  delayMs?: number;
  durationMs?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delayMs = 0,
  durationMs = 700,
  className = '',
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
            // Setelah terlihat sekali, biarkan tetap terlihat (atau bisa toggle jika ingin re-trigger)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getTransitionStyle = () => {
    switch (animation) {
      case 'fade-up':
        return isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-10';
      case 'fade-in':
        return isVisible ? 'opacity-100' : 'opacity-0';
      case 'fade-left':
        return isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-10';
      case 'fade-right':
        return isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-10';
      case 'scale-up':
        return isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95';
      default:
        return isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
      className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) will-change-[transform,opacity] ${getTransitionStyle()} ${className}`}
    >
      {children}
    </div>
  );
};
