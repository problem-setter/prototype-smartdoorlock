import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  spotlightSize?: number;
  children: React.ReactNode;
}

/**
 * Ultra-optimized SpotlightCard using cached bounding rect & direct GPU updates.
 * Eliminates forced synchronous layout reflows on pointer movement.
 */
const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(14, 165, 233, 0.08)',
  spotlightSize = 380,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '1';
    }
    onMouseEnter?.(e);
  }, [onMouseEnter]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlightRef.current) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return;
      let rect = rectRef.current;
      if (!rect && cardRef.current) {
        rect = cardRef.current.getBoundingClientRect();
        rectRef.current = rect;
      }
      if (!rect) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      spotlightRef.current.style.background = `radial-gradient(${spotlightSize}px ellipse at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;
    });

    onMouseMove?.(e);
  }, [spotlightColor, spotlightSize, onMouseMove]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rectRef.current = null;
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '0';
    }
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-[#0c111d] border border-white/[0.08] shadow-lg shadow-black/40 transition-all duration-200 hover:border-white/20 contain-paint',
        className
      )}
      {...props}
    >
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
SpotlightCard.displayName = 'SpotlightCard';

export { SpotlightCard };
