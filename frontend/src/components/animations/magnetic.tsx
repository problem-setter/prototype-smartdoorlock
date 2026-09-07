import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
 * React Bits-style Magnetic cursor attract wrapper.
 * Micro-interaction for primary buttons and touch points.
 */
export const Magnetic: React.FC<MagneticProps> = ({
  children,
  springOptions = { stiffness: 250, damping: 20, mass: 0.5 },
  intensity = 0.25,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * intensity, y: middleY * intensity });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', ...springOptions }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
};
Magnetic.displayName = 'Magnetic';
