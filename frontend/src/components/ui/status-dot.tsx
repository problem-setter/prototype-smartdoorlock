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
  online: 'bg-[#1aae39]',
  offline: 'bg-[#eb5757]',
  warning: 'bg-[#dd5b00]',
  idle: 'bg-[#a39e98]',
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
          'rounded-full shrink-0',
          sizeMap[size],
          statusColorMap[status],
          pulse && status !== 'idle' && 'animate-pulse'
        )}
      />
      {label && (
        <span className="text-xs text-[#615d59] font-medium">{label}</span>
      )}
    </span>
  );
};
StatusDot.displayName = 'StatusDot';

export { StatusDot };

