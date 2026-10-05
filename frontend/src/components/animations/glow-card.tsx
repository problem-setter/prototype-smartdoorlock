import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  glowSize?: number;
  className?: string;
  children: React.ReactNode;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * Ultra-optimized GlowCard styled for the Notion design system.
 * Uses warm canvas / surface colors with subtle layered elevation.
 */
const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className,
  glowColor = 'rgba(0, 117, 222, 0.08)',
  glowSize = 260,
  style,
  id,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    if (glowLayerRef.current) {
      glowLayerRef.current.style.opacity = '1';
    }
    onMouseEnter?.(e);
  }, [onMouseEnter]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!glowLayerRef.current) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!glowLayerRef.current) return;
      let rect = rectRef.current;
      if (!rect && cardRef.current) {
        rect = cardRef.current.getBoundingClientRect();
        rectRef.current = rect;
      }
      if (!rect) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      glowLayerRef.current.style.background = `radial-gradient(${glowSize}px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`;
    });

    onMouseMove?.(e);
  }, [glowColor, glowSize, onMouseMove]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rectRef.current = null;
    if (glowLayerRef.current) {
      glowLayerRef.current.style.opacity = '0';
    }
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <div
      ref={cardRef}
      id={id}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-lg bg-white border border-[#e6e6e6] shadow-notion-1 transition-all duration-200 hover:border-[#b7b3ac] hover:shadow-notion-2 contain-paint text-[#000000]',
        className
      )}
      {...props}
    >
      <div
        ref={glowLayerRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
GlowCard.displayName = 'GlowCard';

export { GlowCard };

