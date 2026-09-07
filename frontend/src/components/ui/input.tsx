import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-slate-950/80 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 shadow-inner transition-all focus:outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-500/25 focus:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed',
            icon ? 'pl-9 pr-3 py-2 sm:py-2.5' : 'px-3 py-2 sm:py-2.5',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

