import React from 'react';
import { cn } from '@/lib/utils';

export type CardTint =
  | 'default'
  | 'peach'
  | 'rose'
  | 'mint'
  | 'lavender'
  | 'sky'
  | 'yellow-bold'
  | 'cream'
  | 'gray'
  | 'surface'
  | 'navy';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tint?: CardTint;
}

const tintStyles: Record<CardTint, string> = {
  default: 'bg-white border-[#e5e3df] text-[#1a1a1a]',
  peach: 'bg-[#ffe8d4] border-[#ffe8d4] text-[#37352f]',
  rose: 'bg-[#fde0ec] border-[#fde0ec] text-[#37352f]',
  mint: 'bg-[#d9f3e1] border-[#d9f3e1] text-[#37352f]',
  lavender: 'bg-[#e6e0f5] border-[#e6e0f5] text-[#37352f]',
  sky: 'bg-[#dcecfa] border-[#dcecfa] text-[#37352f]',
  'yellow-bold': 'bg-[#f9e79f] border-[#f9e79f] text-[#37352f]',
  cream: 'bg-[#f8f5e8] border-[#f8f5e8] text-[#37352f]',
  gray: 'bg-[#f0eeec] border-[#f0eeec] text-[#37352f]',
  surface: 'bg-[#f6f5f4] border-[#e5e3df] text-[#1a1a1a]',
  navy: 'bg-[#0a1530] border-[#0a1530] text-white',
};

/* ─── Card ─── */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tint = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border shadow-notion-1 transition-all',
        tintStyles[tint],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

/* ─── CardHeader ─── */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-5 sm:p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

/* ─── CardTitle ─── */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base sm:text-lg font-bold text-[#000000] tracking-[-0.25px] leading-snug', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/* ─── CardDescription ─── */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs sm:text-sm text-[#615d59] leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

/* ─── CardContent ─── */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-5 sm:p-6 pt-0', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

/* ─── CardFooter ─── */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-5 sm:p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };



