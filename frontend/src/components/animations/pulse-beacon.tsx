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
    dot: 'bg-[#1aae39]',
    ring: 'bg-[#1aae39]/30',
    glow: '',
  },
  rose: {
    dot: 'bg-[#eb5757]',
    ring: 'bg-[#eb5757]/30',
    glow: '',
  },
  sky: {
    dot: 'bg-[#5645d4]',
    ring: 'bg-[#5645d4]/30',
    glow: '',
  },
  amber: {
    dot: 'bg-[#dd5b00]',
    ring: 'bg-[#dd5b00]/30',
    glow: '',
  },
  purple: {
    dot: 'bg-[#391c57]',
    ring: 'bg-[#d6b6f6]/40',
    glow: '',
  },
};

const beaconSizes = {
  sm: { dot: 'h-2 w-2', ring: 'h-3.5 w-3.5' },
  md: { dot: 'h-2.5 w-2.5', ring: 'h-4.5 w-4.5' },
  lg: { dot: 'h-3 w-3', ring: 'h-5 w-5' },
};

const PulseBeacon: React.FC<PulseBeaconProps> = ({
  color = 'emerald',
  size = 'sm',
  className,
  label,
}) => {
  const c = beaconColors[color];
  const s = beaconSizes[size];

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-sans', className)}>
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
            c.dot
          )}
        />
      </span>
      {label && (
        <span className="text-xs font-medium text-[#615d59]">{label}</span>
      )}
    </span>
  );
};
PulseBeacon.displayName = 'PulseBeacon';

export { PulseBeacon };

