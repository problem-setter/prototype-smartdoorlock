import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className,
}) => {
  const iconDimensions = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-12 w-12 sm:h-14 sm:w-14',
  };

  const titleSizes = {
    sm: 'text-sm font-extrabold tracking-tight',
    md: 'text-sm sm:text-base font-extrabold tracking-tight',
    lg: 'text-xl sm:text-2xl font-black tracking-tight',
  };

  return (
    <div className={cn('flex items-center gap-2.5 sm:gap-3 select-none', className)}>
      {/* Precision Geometric Brandmark Glyph */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-[#0c1322] to-[#06090f] border border-sky-500/40 shadow-[0_0_20px_rgba(14,165,233,0.3)] shrink-0 overflow-hidden group',
          iconDimensions[size]
        )}
      >
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute inset-0 bg-radial-gradient from-sky-500/20 via-transparent to-transparent opacity-80 pointer-events-none" />

        {/* Custom Biometric Keyhole Vector Logo */}
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-sky-400 relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Concentric Biometric Rings */}
          <path
            d="M18 4C10.268 4 4 10.268 4 18C4 22.144 5.795 25.867 8.657 28.432"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <path
            d="M32 18C32 10.268 25.732 4 18 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M8.5 18C8.5 12.753 12.753 8.5 18 8.5C23.247 8.5 27.5 12.753 27.5 18C27.5 20.89 26.21 23.479 24.182 25.215"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Inner Cryptographic Keyhole Core */}
          <circle cx="18" cy="16" r="3.2" fill="#0ea5e9" fillOpacity="0.9" />
          <path
            d="M16.5 18L15 26.5H21L19.5 18"
            fill="#38bdf8"
          />
          {/* Active Micro Beacon Dot */}
          <circle cx="28" cy="28" r="2" fill="#10b981" />
        </svg>

        {/* Corner Accent Bevels */}
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-sky-300/60" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-sky-300/60" />
      </div>

      {/* Brand Typography Stack */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-white text-glow-sm', titleSizes[size])}>
            YOU-LOCK<span className="text-sky-400 font-mono text-[10px] sm:text-xs ml-0.5 align-super">™</span>
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-400 text-[9px] font-mono font-bold border border-sky-500/30">
            VaultOS
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate max-w-[170px] sm:max-w-none">
            FT UNTAN &bull; Lab Server & NetSec Enclave
          </p>
        )}
      </div>
    </div>
  );
};
