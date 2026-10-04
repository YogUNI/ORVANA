import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'manifest';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-white border border-surface-border/90 shadow-soft hover:shadow-card transition-shadow duration-200',
      flat: 'bg-surface-muted/60 border border-surface-border',
      elevated: 'bg-white border border-surface-border shadow-elevated',
      manifest: 'bg-white border-2 border-brand/20 shadow-soft relative overflow-hidden',
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-card p-5 text-[#1A2621]',
            variantStyles[variant],
            className,
          ),
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('flex flex-col space-y-1.5 pb-3', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={twMerge(
      clsx('font-heading font-bold text-base text-gray-900 tracking-tight', className),
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('pt-0', className))} {...props}>
    {children}
  </div>
);
