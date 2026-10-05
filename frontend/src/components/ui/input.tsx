import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, type = 'text', icon, rightIcon, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#615d59] pointer-events-none flex items-center justify-center z-1">
            {icon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full rounded-md bg-white border border-[#c8c4be] text-[15px] leading-[1.33] text-[#1a1a1a] placeholder:text-[#a4a097] transition-all focus:outline-none focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] focus:shadow-notion-1 disabled:opacity-50 disabled:bg-[#f6f5f4] disabled:cursor-not-allowed',
            icon ? 'pl-9 pr-3 py-1.5' : 'px-3 py-1.5',
            rightIcon && 'pr-14',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#615d59] flex items-center justify-center z-1">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };


