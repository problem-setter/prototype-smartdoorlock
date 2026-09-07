import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonVariants, ButtonVariant, ButtonSize } from './button-variants';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
        whileHover={!disabled && !isLoading ? { scale: 1.015 } : undefined}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors touch-manipulation whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06090f] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...(props as any)}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon ? (
          <span className="shrink-0 transition-transform">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="shrink-0 transition-transform">{rightIcon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';



