import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RippleProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  duration?: number;
  children: React.ReactNode;
}

/**
 * React Bits-style Material Design ripple effect wrapper.
 * Wraps any child element with an onClick ripple animation.
 */
const Ripple: React.FC<RippleProps> = ({
  children,
  className,
  color = 'rgba(255, 255, 255, 0.2)',
  duration = 600,
  onClick,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        transform: scale(0);
        animation: ripple-expand ${duration}ms ease-out forwards;
        pointer-events: none;
        z-index: 0;
      `;

      container.appendChild(ripple);
      setTimeout(() => ripple.remove(), duration);

      onClick?.(e);
    },
    [color, duration, onClick]
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};
Ripple.displayName = 'Ripple';

export { Ripple };
