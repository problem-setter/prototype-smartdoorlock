import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  subtitleClassName?: string;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className,
  subtitleClassName,
  inverted = false,
}) => {
  const iconDimensions = {
    sm: 'h-7 w-7 sm:h-8 sm:w-8',
    md: 'h-8 w-8 sm:h-9 sm:w-9',
    lg: 'h-11 w-11 sm:h-12 sm:w-12',
  };

  const titleSizes = {
    sm: 'text-xs sm:text-sm font-bold tracking-[-0.125px]',
    md: 'text-sm sm:text-base font-bold tracking-[-0.125px]',
    lg: 'text-lg sm:text-xl font-bold tracking-[-0.25px]',
  };

  return (
    <div className={cn('flex items-center gap-2.5 sm:gap-3 select-none min-w-0', className)}>
      {/* Precision Geometric Brandmark Glyph */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg shrink-0 overflow-hidden transition-all',
          inverted 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-white border border-[#e6e6e6] shadow-notion-1',
          iconDimensions[size]
        )}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={cn(
            'w-3/5 h-3/5 relative z-10 transition-transform duration-200 group-hover:scale-105',
            inverted ? 'text-white' : 'text-[#5645d4]'
          )}
        >
          {/* Biometric Concentric Rings */}
          <path
            d="M18 4C10.268 4 4 10.268 4 18C4 22.144 5.795 25.867 8.657 28.432"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M32 18C32 10.268 25.732 4 18 4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M8.5 18C8.5 12.753 12.753 8.5 18 8.5C23.247 8.5 27.5 12.753 27.5 18C27.5 20.89 26.21 23.479 24.182 25.215"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          {/* Inner Cryptographic Keyhole Core */}
          <circle cx="18" cy="16" r="3.2" fill="currentColor" />
          <path
            d="M16.5 18L15 26.5H21L19.5 18"
            fill="currentColor"
          />
          {/* Active Micro Beacon Dot */}
          <circle cx="28" cy="28" r="2" fill="#1aae39" />
        </svg>
      </div>

      {/* Brand Typography Stack */}
      <div className="min-w-0">
        <div className="flex items-center">
          <span className={cn(
            'whitespace-nowrap',
            inverted ? 'text-white' : 'text-[#000000]',
            titleSizes[size]
          )}>
            Smart Door Lock
          </span>
        </div>
        {showSubtitle && (
          <p className={cn(
            'text-[11px] truncate font-sans',
            subtitleClassName ?? 'hidden sm:block',
            inverted ? 'text-white/70' : 'text-[#615d59]'
          )}>
            FT UNTAN &bull; Lab KK Jaringan & Keamanan
          </p>
        )}
      </div>
    </div>
  );
};

