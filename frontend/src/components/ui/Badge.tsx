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
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'bg-amber-100/70 text-amber-800 border-amber-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
          colorStyles[color],
          className,
        ),
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
};
