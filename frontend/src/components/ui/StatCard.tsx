import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    positive: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlight = false,
}) => {
  return (
    <Card
      className={`p-5 relative overflow-hidden transition-all duration-200 ${
        highlight
          ? 'bg-pine-900 text-white border-pine-800 shadow-md'
          : 'bg-white hover:border-pine-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p
            className={`text-xs font-mono font-medium tracking-wide uppercase ${
              highlight ? 'text-pine-200' : 'text-stone-500'
            }`}
          >
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
                highlight ? 'text-white' : 'text-pine-950'
              }`}
            >
              {value}
            </h3>
            {trend && (
              <span
                className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                  trend.positive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {trend.positive ? '+' : ''}
                {trend.value}
              </span>
            )}
          </div>
          {subtext && (
            <p
              className={`text-xs font-sans ${
                highlight ? 'text-pine-300' : 'text-stone-400'
              }`}
            >
              {subtext}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              highlight
                ? 'bg-pine-800/80 text-pine-100 border border-pine-700'
                : 'bg-pine-50 text-pine-800 border border-pine-200/80'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
