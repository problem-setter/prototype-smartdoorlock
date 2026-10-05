import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  delayMs?: number;
  closeDelayMs?: number;
  className?: string;
  interactive?: boolean;
  disabled?: boolean;
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  delayMs = 120,
  closeDelayMs = 120,
  className,
  interactive = true,
  disabled = false,
  id: customId,
}) => {
  const generatedId = useId();
  const tooltipId = customId || `tooltip-${generatedId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    actualSide: 'top' | 'bottom' | 'left' | 'right';
  }>({
    top: 0,
    left: 0,
    actualSide: side,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Position calculation with automatic collision detection & viewport edge clamping
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    let computedSide: 'top' | 'bottom' | 'left' | 'right' = side;

    // Viewport collision auto-flip checks
    const estimatedHeight = 110;
    const estimatedWidth = 260;
    const viewportPadding = 10;

    if (side === 'top' && rect.top - estimatedHeight - sideOffset < viewportPadding) {
      computedSide = 'bottom';
    } else if (side === 'bottom' && rect.bottom + estimatedHeight + sideOffset > vh - viewportPadding) {
      computedSide = 'top';
    } else if (side === 'left' && rect.left - estimatedWidth - sideOffset < viewportPadding) {
      computedSide = 'right';
    } else if (side === 'right' && rect.right + estimatedWidth + sideOffset > vw - viewportPadding) {
      computedSide = 'left';
    }

    let top = 0;
    let left = 0;

    if (computedSide === 'top') {
      top = rect.top - sideOffset;
      if (align === 'center') left = rect.left + rect.width / 2;
      else if (align === 'start') left = rect.left;
      else if (align === 'end') left = rect.right;
    } else if (computedSide === 'bottom') {
      top = rect.bottom + sideOffset;
      if (align === 'center') left = rect.left + rect.width / 2;
      else if (align === 'start') left = rect.left;
      else if (align === 'end') left = rect.right;
    } else if (computedSide === 'left') {
      left = rect.left - sideOffset;
      if (align === 'center') top = rect.top + rect.height / 2;
      else if (align === 'start') top = rect.top;
      else if (align === 'end') top = rect.bottom;
    } else if (computedSide === 'right') {
      left = rect.right + sideOffset;
      if (align === 'center') top = rect.top + rect.height / 2;
      else if (align === 'start') top = rect.top;
      else if (align === 'end') top = rect.bottom;
    }

    setCoords({ top, left, actualSide: computedSide });
  }, [side, align, sideOffset]);

  const handleOpen = useCallback(() => {
    if (disabled || !content) return;
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    enterTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, delayMs);
  }, [disabled, content, delayMs, updatePosition]);

  const handleClose = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    exitTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelayMs);
  }, [closeDelayMs]);

  // Handle immediate close when pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Compute transform styles based on actual side and alignment
  const getTransformStyle = () => {
    const { actualSide } = coords;
    if (actualSide === 'top') {
      if (align === 'start') return 'translate(0, -100%)';
      if (align === 'end') return 'translate(-100%, -100%)';
      return 'translate(-50%, -100%)';
    }
    if (actualSide === 'bottom') {
      if (align === 'start') return 'translate(0, 0)';
      if (align === 'end') return 'translate(-100%, 0)';
      return 'translate(-50%, 0)';
    }
    if (actualSide === 'left') {
      if (align === 'start') return 'translate(-100%, 0)';
      if (align === 'end') return 'translate(-100%, -100%)';
      return 'translate(-100%, -50%)';
    }
    if (actualSide === 'right') {
      if (align === 'start') return 'translate(0, 0)';
      if (align === 'end') return 'translate(0, -100%)';
      return 'translate(0, -50%)';
    }
    return 'translate(-50%, -100%)';
  };

  const getMotionAnimation = () => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 },
      };
    }

    const { actualSide } = coords;
    let initialY = 0;
    let initialX = 0;

    if (actualSide === 'top') initialY = 4;
    else if (actualSide === 'bottom') initialY = -4;
    else if (actualSide === 'left') initialX = 4;
    else if (actualSide === 'right') initialX = -4;

    return {
      initial: { opacity: 0, scale: 0.96, x: initialX, y: initialY },
      animate: { opacity: 1, scale: 1, x: 0, y: 0 },
      exit: { opacity: 0, scale: 0.96, x: initialX, y: initialY },
      transition: { duration: 0.14, ease: "easeOut" as const },
    };
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex max-w-full"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        aria-describedby={isOpen ? tooltipId : undefined}
      >
        {children}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && !disabled && content && (
              <motion.div
                ref={tooltipRef}
                id={tooltipId}
                role="tooltip"
                {...getMotionAnimation()}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  transform: getTransformStyle(),
                  zIndex: 99999,
                  pointerEvents: interactive ? 'auto' : 'none',
                }}
                onMouseEnter={() => {
                  if (interactive && exitTimerRef.current) {
                    clearTimeout(exitTimerRef.current);
                    exitTimerRef.current = null;
                  }
                }}
                onMouseLeave={handleClose}
                className={cn(
                  'rounded-lg border border-[#e5e3df] bg-[#ffffff] text-[#37352f] shadow-[rgba(15,15,15,0.16)_0px_16px_48px_-8px,rgba(15,15,15,0.08)_0px_4px_12px_0px] p-2.5 max-w-[300px] sm:max-w-[340px] text-xs font-sans select-text',
                  className
                )}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
