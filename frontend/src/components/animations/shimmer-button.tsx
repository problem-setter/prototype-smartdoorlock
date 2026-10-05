import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerDuration?: string;
  variant?: 'default' | 'sky' | 'purple' | 'emerald';
}

/**
 * Shimmer button with Notion styling.
 */
const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({
    className,
    children,
    shimmerColor = 'rgba(255,255,255,0.2)',
    shimmerDuration = '2.5s',
    variant = 'default',
    ...props
  }, ref) => {
    const variantStyles = {
      default: 'bg-[#5645d4] text-white hover:bg-[#4534b3] active:bg-[#3a2a99] shadow-xs',
      sky: 'bg-[#5645d4] text-white hover:bg-[#4534b3] active:bg-[#3a2a99] shadow-xs',
      purple: 'bg-[#5645d4] text-white hover:bg-[#4534b3] active:bg-[#3a2a99] shadow-xs',
      emerald: 'bg-[#1aae39] text-white hover:bg-[#158c2e] active:bg-[#117325] shadow-xs',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-md px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] touch-manipulation inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 cursor-pointer',
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


