import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  icon,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-surface-border">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {icon && (
            <div className="p-2 rounded-lg bg-pine-50 text-pine-800 border border-pine-200/80">
              {icon}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-pine-950 tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stone-500 font-sans leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
