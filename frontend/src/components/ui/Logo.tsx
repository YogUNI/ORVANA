import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  textSubtitle?: string;
  className?: string;
}

const sizeMap = {
  xs: { img: 'w-6 h-6', text: 'text-base', sub: 'text-[9px]' },
  sm: { img: 'w-8 h-8', text: 'text-lg', sub: 'text-[10px]' },
  md: { img: 'w-10 h-10', text: 'text-xl', sub: 'text-[11px]' },
  lg: { img: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  xl: { img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  withText = false,
  textSubtitle,
  className = '',
}) => {
  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${currentSize.img} shrink-0 drop-shadow-sm flex items-center justify-center`}>
        <img
          src="/logo-icon.svg"
          alt="ORVANA Icon"
          className="w-full h-full object-contain select-none"
        />
      </div>

      {withText && (
        <div className="flex flex-col text-left">
          <span className={`font-heading font-extrabold ${currentSize.text} text-pine-950 tracking-tight leading-none`}>
            ORVANA
          </span>
          {textSubtitle && (
            <span className={`font-mono text-emerald-800 ${currentSize.sub} font-semibold tracking-wide uppercase mt-1`}>
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
