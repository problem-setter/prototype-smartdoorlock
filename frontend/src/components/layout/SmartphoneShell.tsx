import React from 'react';
import { cn } from '@/lib/utils';

interface SmartphoneShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SmartphoneShell: React.FC<SmartphoneShellProps> = ({
  children,
  footer,
  className,
  bodyClassName,
}) => {
  return (
    <div className="min-h-[100dvh] w-full bg-[#f6f5f4] text-[#000000] flex flex-col selection:bg-[#5645d4]/20 selection:text-[#000000] font-sans">
      <div
        className={cn(
          'w-full max-w-7xl mx-auto min-h-[100dvh] bg-[#f6f5f4] flex flex-col relative transition-all duration-150',
          className
        )}
      >
        {/* Main Content Area */}
        <div
          id="main-viewport"
          className={cn(
            'flex-1 w-full flex flex-col',
            footer ? 'pb-24 md:pb-8' : 'pb-8',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Pinned Bottom Navigation — exclusively on mobile below md breakpoint */}
        {footer && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e6e6e6] px-3.5 py-2 safe-pb">
            <div className="max-w-md mx-auto">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

