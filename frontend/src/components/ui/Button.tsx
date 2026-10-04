import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'harvest';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-heading font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-DEFAULT gap-1.5 min-h-[34px]',
      md: 'text-sm px-4 py-2.5 rounded-DEFAULT gap-2 min-h-[42px]',
      lg: 'text-base px-6 py-3 rounded-card gap-2.5 min-h-[48px]',
    };

    const variantStyles = {
      primary:
        'bg-brand hover:bg-brand-hover text-white shadow-sm border border-brand/20 hover:shadow',
      secondary:
        'bg-brand-soft text-brand hover:bg-brand-soft/80 border border-brand/20',
      harvest:
        'bg-harvest-gold hover:bg-harvest-amber text-white shadow-sm border border-harvest-amber/20',
      outline:
        'border border-surface-border bg-white text-gray-800 hover:bg-surface-muted/60 hover:border-gray-400',
      ghost:
        'text-gray-700 hover:bg-surface-muted hover:text-gray-950',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(baseStyles, sizeStyles[size], variantStyles[variant], className),
        )}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
