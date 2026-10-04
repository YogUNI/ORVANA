import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BadgeColor } from '../../lib/labels';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'neutral',
  className,
  ...props
}) => {
  const colorStyles: Record<BadgeColor, string> = {
    info: 'bg-blue-50/90 text-blue-800 border-blue-200/80',
    success: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50/90 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50/90 text-rose-800 border-rose-200/80',
    accent: 'bg-harvest-soft text-harvest-amber border-amber-300/80 font-bold',
    neutral: 'bg-surface-muted text-gray-700 border-surface-border',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-badge border tracking-tight',
          colorStyles[color],
          className,
        ),
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};
