import React from 'react';
import { cn } from '@/lib/utils';

interface PulseBeaconProps {
  color?: 'emerald' | 'rose' | 'sky' | 'amber' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const beaconColors = {
  emerald: {
    dot: 'bg-emerald-400',
    ring: 'bg-emerald-400/30',
    glow: 'shadow-[0_0_12px_2px_rgba(16,185,129,0.4)]',
  },
  rose: {
    dot: 'bg-rose-400',
    ring: 'bg-rose-400/30',
    glow: 'shadow-[0_0_12px_2px_rgba(244,63,94,0.5)]',
  },
  sky: {
    dot: 'bg-sky-400',
    ring: 'bg-sky-400/30',
    glow: 'shadow-[0_0_12px_2px_rgba(14,165,233,0.4)]',
  },
  amber: {
    dot: 'bg-amber-400',
    ring: 'bg-amber-400/30',
    glow: 'shadow-[0_0_12px_2px_rgba(245,158,11,0.4)]',
  },
  purple: {
    dot: 'bg-purple-400',
    ring: 'bg-purple-400/30',
    glow: 'shadow-[0_0_12px_2px_rgba(168,85,247,0.4)]',
  },
};

const beaconSizes = {
  sm: { dot: 'h-2 w-2', ring: 'h-4 w-4' },
  md: { dot: 'h-2.5 w-2.5', ring: 'h-5 w-5' },
  lg: { dot: 'h-3 w-3', ring: 'h-6 w-6' },
};

/**
 * React Bits-style pulsing beacon indicator for live status states.
 */
const PulseBeacon: React.FC<PulseBeaconProps> = ({
  color = 'emerald',
  size = 'sm',
  className,
  label,
}) => {
  const c = beaconColors[color];
  const s = beaconSizes[size];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <span
          className={cn(
            'absolute rounded-full animate-ping opacity-60',
            s.ring,
            c.ring
          )}
        />
        {/* Inner solid dot */}
        <span
          className={cn(
            'relative rounded-full',
            s.dot,
            c.dot,
            c.glow
          )}
        />
      </span>
      {label && (
        <span className="text-[10px] sm:text-[11px] font-medium text-slate-300">{label}</span>
      )}
    </span>
  );
};
PulseBeacon.displayName = 'PulseBeacon';

export { PulseBeacon };
