import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerDuration?: string;
  variant?: 'default' | 'sky' | 'purple' | 'emerald';
}

/**
 * React Bits-style shimmer button with a traveling light effect.
 */
const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({
    className,
    children,
    shimmerColor = 'rgba(255,255,255,0.15)',
    shimmerDuration = '2.5s',
    variant = 'default',
    ...props
  }, ref) => {
    const variantStyles = {
      default: 'bg-sky-600 text-white shadow-md shadow-sky-600/25 hover:bg-sky-500',
      sky: 'bg-sky-600 text-white shadow-md shadow-sky-600/25 hover:bg-sky-500',
      purple: 'bg-purple-700 text-white shadow-sm shadow-purple-700/20 hover:bg-purple-600',
      emerald: 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25 hover:bg-emerald-600',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] touch-manipulation inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Shimmer Overlay */}
        <span
          className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
            animationDuration: shimmerDuration,
          }}
        />
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
ShimmerButton.displayName = 'ShimmerButton';

export { ShimmerButton };

