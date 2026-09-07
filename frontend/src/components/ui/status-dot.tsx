import React from 'react';
import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'idle';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
  label?: string;
}

const statusColorMap = {
  online: 'bg-emerald-400',
  offline: 'bg-rose-400',
  warning: 'bg-amber-400',
  idle: 'bg-slate-500',
};

const statusGlowMap = {
  online: 'shadow-[0_0_12px_2px_rgba(16,185,129,0.4)]',
  offline: 'shadow-[0_0_12px_2px_rgba(244,63,94,0.5)]',
  warning: 'shadow-[0_0_12px_2px_rgba(245,158,11,0.4)]',
  idle: '',
};

const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'sm',
  pulse = true,
  className,
  label,
}) => {
  const sizeMap = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5' };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full',
          sizeMap[size],
          statusColorMap[status],
          statusGlowMap[status],
          pulse && status !== 'idle' && 'animate-pulse'
        )}
      />
      {label && (
        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{label}</span>
      )}
    </span>
  );
};
StatusDot.displayName = 'StatusDot';

export { StatusDot };
