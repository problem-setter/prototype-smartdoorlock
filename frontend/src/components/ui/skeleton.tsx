import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-xl bg-slate-800/60 border border-white/5',
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

/* Preset skeletons for common patterns */
const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-2xl bg-[#0c111d] border border-slate-800 p-4 sm:p-6 space-y-4', className)}>
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-2.5 w-5/6" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

const SkeletonLine: React.FC<{ className?: string; width?: string }> = ({ className, width = 'w-full' }) => (
  <Skeleton className={cn('h-3', width, className)} />
);

export { Skeleton, SkeletonCard, SkeletonLine };
