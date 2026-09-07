import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticProps {
  children: React.ReactElement;
  springOptions?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  intensity?: number;
}

/**
 * Ultra-optimized Magnetic interaction running directly on Framer Motion's
 * hardware motion values without triggering React component re-renders.
 */
export const Magnetic: React.FC<MagneticProps> = ({
  children,
  springOptions = { stiffness: 250, damping: 20, mass: 0.5 },
  intensity = 0.25,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springOptions);
  const springY = useSpring(y, springOptions);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    let rect = rectRef.current;
    if (!rect && ref.current) {
      rect = ref.current.getBoundingClientRect();
      rectRef.current = rect;
    }
    if (!rect) return;

    const { clientX, clientY } = e;
    const middleX = clientX - (rect.left + rect.width / 2);
    const middleY = clientY - (rect.top + rect.height / 2);
    x.set(middleX * intensity);
    y.set(middleY * intensity);
  }, [intensity, x, y]);

  const handleMouseLeave = useCallback(() => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="inline-block contain-paint"
    >
      {children}
    </motion.div>
  );
};
Magnetic.displayName = 'Magnetic';
