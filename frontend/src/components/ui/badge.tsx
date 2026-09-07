import React from 'react';
import { cn } from '@/lib/utils';
import { badgeVariants, BadgeVariant } from './badge-variants';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', icon, pulse = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border transition-colors',
        badgeVariants[variant],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';


