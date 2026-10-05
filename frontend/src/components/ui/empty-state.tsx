import React, { useId } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'default' | 'card' | 'dashed' | 'subtle' | 'ghost';

export type EmptyStateStickerColor =
  | 'blue'
  | 'lavender'
  | 'purple'
  | 'orange'
  | 'green'
  | 'teal'
  | 'slate'
  | 'pink'
  | 'none';

export interface EmptyStateProps extends Omit<HTMLMotionProps<'div'>, 'title' | 'action'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  variant?: EmptyStateVariant;
  stickerColor?: EmptyStateStickerColor;
  compact?: boolean;
  role?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  className?: string;
}

const stickerVariants: Record<EmptyStateStickerColor, { container: string; icon: string }> = {
  blue: { container: 'bg-[#e6e0f5] border-[#d6b6f6]', icon: 'text-[#5645d4]' },
  lavender: { container: 'bg-[#e6e0f5] border-[#d6b6f6]', icon: 'text-[#5645d4]' },
  purple: { container: 'bg-[#f7f0fd] border-[#ecd5fb]', icon: 'text-[#391c57]' },
  orange: { container: 'bg-[#fdf3eb] border-[#fbd6b8]', icon: 'text-[#dd5b00]' },
  green: { container: 'bg-[#eefbf1] border-[#d2f4d9]', icon: 'text-[#1aae39]' },
  teal: { container: 'bg-[#e6f7f7] border-[#b2e5e5]', icon: 'text-[#2a9d99]' },
  pink: { container: 'bg-[#fdf2f8] border-[#fbcfe8]', icon: 'text-[#ff64c8]' },
  slate: { container: 'bg-[#f6f5f4] border-[#e6e6e6]', icon: 'text-[#615d59]' },
  none: { container: 'bg-transparent border-transparent', icon: 'text-[#615d59]' },
};

const variantStyles: Record<EmptyStateVariant, string> = {
  default: 'bg-[#f6f5f4] border border-[#e6e6e6] rounded-lg shadow-notion-1',
  card: 'bg-white border border-[#e6e6e6] rounded-lg shadow-notion-1',
  dashed: 'bg-[#f6f5f4]/60 border-2 border-dashed border-[#e6e6e6] rounded-lg',
  subtle: 'bg-[#f6f5f4] border border-transparent rounded-lg',
  ghost: 'bg-transparent border border-transparent rounded-none',
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      badge,
      action,
      secondaryAction,
      variant = 'default',
      stickerColor = 'blue',
      compact = false,
      role = 'status',
      'aria-live': ariaLive = 'polite',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const titleId = id ? `${id}-title` : `empty-state-title-${generatedId}`;
    const descId = id ? `${id}-desc` : `empty-state-desc-${generatedId}`;
    const stickerConfig = stickerVariants[stickerColor] || stickerVariants.blue;

    return (
      <motion.div
        ref={ref}
        role={role}
        aria-live={ariaLive}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'flex flex-col items-center justify-center text-center transition-all',
          variantStyles[variant],
          compact ? 'p-5 sm:p-6 gap-3' : 'p-8 sm:p-12 gap-4 max-w-xl mx-auto',
          className
        )}
        {...props}
      >
        {badge && <div className="mb-0.5">{badge}</div>}

        {icon && (
          <div
            className={cn(
              'inline-flex items-center justify-center shrink-0 border transition-transform duration-200 hover:scale-[1.03]',
              stickerConfig.container,
              stickerConfig.icon,
              compact
                ? 'w-10 h-10 rounded-md text-lg p-2'
                : 'w-14 h-14 sm:w-16 sm:h-16 rounded-lg text-2xl sm:text-3xl p-3 shadow-xs'
            )}
          >
            {icon}
          </div>
        )}

        <div className={cn('space-y-1.5 w-full', compact ? 'max-w-xs' : 'max-w-md')}>
          <h3
            id={titleId}
            className={cn(
              'font-bold text-[#000000] tracking-tight leading-tight',
              compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg md:text-xl'
            )}
          >
            {title}
          </h3>

          {description && (
            <p
              id={descId}
              className={cn(
                'text-[#615d59] leading-relaxed',
                compact ? 'text-xs' : 'text-xs sm:text-sm font-normal'
              )}
            >
              {description}
            </p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div
            className={cn(
              'flex flex-wrap items-center justify-center gap-2.5 sm:gap-3',
              compact ? 'mt-1' : 'mt-2'
            )}
          >
            {action}
            {secondaryAction}
          </div>
        )}
      </motion.div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

/* ─── Sub-components for granular composition ─── */
export interface EmptyStateIconProps extends React.HTMLAttributes<HTMLDivElement> {
  stickerColor?: EmptyStateStickerColor;
  compact?: boolean;
}

export const EmptyStateIcon = React.forwardRef<HTMLDivElement, EmptyStateIconProps>(
  ({ stickerColor = 'blue', compact = false, className, children, ...props }, ref) => {
    const config = stickerVariants[stickerColor] || stickerVariants.blue;
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center shrink-0 border transition-transform duration-200 hover:scale-[1.03]',
          config.container,
          config.icon,
          compact
            ? 'w-10 h-10 rounded-md text-lg p-2'
            : 'w-14 h-14 sm:w-16 sm:h-16 rounded-lg text-2xl sm:text-3xl p-3 shadow-xs',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EmptyStateIcon.displayName = 'EmptyStateIcon';

export const EmptyStateTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { compact?: boolean }
>(({ compact = false, className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-bold text-[#000000] tracking-tight leading-tight',
      compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg md:text-xl',
      className
    )}
    {...props}
  />
));
EmptyStateTitle.displayName = 'EmptyStateTitle';

export const EmptyStateDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { compact?: boolean }
>(({ compact = false, className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-[#615d59] leading-relaxed',
      compact ? 'text-xs' : 'text-xs sm:text-sm font-normal',
      className
    )}
    {...props}
  />
));
EmptyStateDescription.displayName = 'EmptyStateDescription';

export const EmptyStateActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ compact = false, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-wrap items-center justify-center gap-2.5 sm:gap-3',
      compact ? 'mt-1' : 'mt-2',
      className
    )}
    {...props}
  />
));
EmptyStateActions.displayName = 'EmptyStateActions';
