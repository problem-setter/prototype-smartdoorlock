import React, { useEffect, useRef, useState } from 'react';
import { useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * React Bits-style animated counter that smoothly transitions between values.
 * Automatically triggers when scrolled into view.
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.2,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(0);

  const spring = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  });

  const rounded = useTransform(spring, (latest) =>
    decimals > 0 ? parseFloat(latest.toFixed(decimals)) : Math.round(latest)
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};
AnimatedCounter.displayName = 'AnimatedCounter';

export { AnimatedCounter };

