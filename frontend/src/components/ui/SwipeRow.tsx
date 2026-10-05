import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface ActionConfig {
  /** Label displayed on the action button/indicator */
  label: string;
  /** Icon component to render */
  icon?: ReactNode;
  /** Color scheme variant */
  variant?: "primary" | "secondary" | "destructive" | "neutral" | "warning";
  /** Custom hex or RGB color (overrides variant) */
  color?: string;
  /** Background color when active / triggered */
  activeColor?: string;
  /** Text/icon color */
  textColor?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Tooltip or accessibility aria-label */
  ariaLabel?: string;
  /** Callback triggered when action is activated */
  onClick: () => void;
}

export interface SwipeRowProps {
  children: ReactNode;
  /** Primary swipe action revealed from right or on deep drag (Action 1 - Hapus) */
  action1?: ActionConfig;
  /** Secondary swipe action revealed or triggered on partial drag (Action 2 - Kelola) */
  action2?: ActionConfig;
  /** Reveal width of action drawer in pixels (default: 84) */
  revealWidth?: number;
  /** Distance to trigger full committed swipe (if enableCommitThreshold is true) */
  commitThreshold?: number;
  /** Enable auto-triggering action1 on deep drag past commit threshold (default: false for safe deletion) */
  enableCommitThreshold?: boolean;
  /** Distance required before initiating drag (hysteresis) (default: 8) */
  dragHysteresis?: number;
  /** Enable or disable swipe gestures entirely */
  disabled?: boolean;
  /** Optional click handler when tapping the card directly (when drawer is closed) */
  onCardClick?: () => void;
  /** Additional container styling classes */
  className?: string;
  /** Additional content card wrapper styling classes */
  contentClassName?: string;
  /** Callback when swipe drawer opens */
  onOpen?: () => void;
  /** Callback when swipe drawer closes */
  onClose?: () => void;
}

/**
 * Rubber-band resistance curve
 */
function rubber(x: number, max: number, factor = 0.55): number {
  if (x <= 0) return 0;
  return (x * max * factor) / (max + x * factor);
}

const DEFAULT_SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

/**
 * SwipeRow Component
 * Interactive gesture row with physics, elastic feedback, dual actions, and full accessibility support.
 * Follows Notion design tokens: Primary Purple (#5645d4), Destructive Red (#eb5757), Surface (#ffffff).
 */
export const SwipeRow: React.FC<SwipeRowProps> = ({
  children,
  action1,
  action2,
  revealWidth = 84,
  commitThreshold,
  enableCommitThreshold = false,
  dragHysteresis = 8,
  disabled = false,
  onCardClick,
  className,
  contentClassName,
  onOpen,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPastCommit, setIsPastCommit] = useState(false);

  // Motion values
  const x = useMotionValue(0);

  // Drag tracking refs
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isHorizontalScrollRef = useRef<boolean | null>(null);
  const initialOffsetRef = useRef(0);
  const wasOpenOnDownRef = useRef(false);

  // Calculate total drawer width for multiple actions and safe commit threshold
  const activeActionCount = (action1 ? 1 : 0) + (action2 ? 1 : 0);
  const totalDrawerWidth = activeActionCount * revealWidth;
  const effectiveCommitThreshold =
    commitThreshold ?? Math.max(totalDrawerWidth + 64, 230);

  const snapTo = useCallback((targetX: number, onComplete?: () => void) => {
    if (targetX < 0) {
      setIsOpen(true);
      onOpen?.();
    } else {
      setIsOpen(false);
      onClose?.();
    }

    if (shouldReduceMotion) {
      x.set(targetX);
      onComplete?.();
      return;
    }

    animate(x, targetX, {
      ...DEFAULT_SPRING_CONFIG,
      onComplete,
    });
  }, [x, shouldReduceMotion, onOpen, onClose]);

  const closeDrawer = useCallback(() => {
    snapTo(0);
  }, [snapTo]);

  const openDrawer = useCallback(() => {
    snapTo(-totalDrawerWidth);
  }, [snapTo, totalDrawerWidth]);

  // Touch / Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activeActionCount === 0) return;

    // Only track primary clicks / touches
    if (e.button !== 0) return;

    isTrackingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentXRef.current = e.clientX;
    initialOffsetRef.current = x.get();
    wasOpenOnDownRef.current = isOpen;
    isHorizontalScrollRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current || disabled) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    currentXRef.current = e.clientX;

    // Determine drag direction lock
    if (isHorizontalScrollRef.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < dragHysteresis && absY < dragHysteresis) {
        return;
      }

      if (absX > absY) {
        isHorizontalScrollRef.current = true;
        setIsDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          // Ignore pointer capture errors
        }
      } else {
        isHorizontalScrollRef.current = false;
        isTrackingRef.current = false;
        return;
      }
    }

    if (!isHorizontalScrollRef.current) return;

    // Calculate raw new position (swiping left reveals right actions)
    const rawX = initialOffsetRef.current + deltaX;

    let finalX = rawX;
    if (rawX > 0) {
      // Rubber-banding when dragged right beyond 0
      finalX = rubber(rawX, 48);
    } else if (rawX < -totalDrawerWidth) {
      // Elastic extension or full commit swipe
      const overdrag = -rawX - totalDrawerWidth;
      finalX = -(totalDrawerWidth + rubber(overdrag, 96));
    }

    x.set(finalX);

    // Check if passed commit threshold for Action 1 (only if enabled)
    if (enableCommitThreshold) {
      const reachedCommit = Boolean(
        action1 && !action1.disabled && -finalX >= effectiveCommitThreshold
      );
      if (reachedCommit !== isPastCommit) {
        setIsPastCommit(reachedCommit);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current && !isDragging) {
      // If the drawer was already open and user tapped the card without dragging, dismiss it
      if (wasOpenOnDownRef.current) {
        closeDrawer();
      }
      return;
    }

    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release error
    }

    const hadDragged = isDragging;
    isTrackingRef.current = false;
    setIsDragging(false);

    // If tap occurred while open without significant horizontal drag
    if (!hadDragged && wasOpenOnDownRef.current) {
      closeDrawer();
      return;
    }

    // If clean tap on closed card (no drag at all), trigger optional onCardClick
    if (!hadDragged && !wasOpenOnDownRef.current && onCardClick) {
      onCardClick();
      return;
    }

    const currentX = x.get();

    // If full commit drag was triggered
    if (enableCommitThreshold && isPastCommit && action1 && !action1.disabled) {
      setIsPastCommit(false);
      // Animate full slide-out then trigger action
      snapTo(-340, () => {
        action1.onClick();
        closeDrawer();
      });
      return;
    }

    setIsPastCommit(false);

    // Determine snapping based on drag offset and previous open state
    if (wasOpenOnDownRef.current) {
      // If closing from open state, snap closed if moved right towards 0 past 25% of drawer
      const closeThreshold = -totalDrawerWidth * 0.75;
      if (currentX > closeThreshold) {
        closeDrawer();
      } else {
        openDrawer();
      }
    } else {
      // If opening from closed state, snap open if moved left past 40% of drawer
      const openThreshold = -totalDrawerWidth * 0.4;
      if (currentX < openThreshold) {
        openDrawer();
      } else {
        closeDrawer();
      }
    }
  };

  // Click outside listener to auto-close drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, closeDrawer]);

  // Background colors and transforms
  const action1Width = useTransform(x, (val) => {
    if (val >= 0) return 0;
    if (!action2) return Math.abs(val);
    return Math.max(revealWidth, Math.abs(val) - revealWidth);
  });

  const action2Width = useTransform(x, (val) => {
    if (val >= 0 || !action2) return 0;
    return Math.min(revealWidth, Math.abs(val));
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden select-none touch-pan-y rounded-lg",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── Background Action Layer ── */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch z-0 bg-[#f6f5f4]"
        aria-hidden={!isOpen}
      >

        {/* Action 2: Secondary / Manage (e.g. Kelola) */}
        {action2 && (
          <motion.button
            type="button"
            disabled={action2.disabled}
            tabIndex={isOpen ? 0 : -1}
            aria-label={action2.ariaLabel || action2.label}
            onClick={() => {
              action2.onClick();
              closeDrawer();
            }}
            style={{ width: action2Width }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors border-l border-[#e6e6e6]",
              action2.disabled
                ? "bg-[#f6f5f4] text-[#a39e98] cursor-not-allowed"
                : action2.variant === "primary"
                ? "bg-[#e6e0f5] text-[#5645d4] hover:bg-[#d6b6f6] active:bg-[#4534b3] active:text-white cursor-pointer"
                : "bg-[#f6f5f4] text-[#391c57] hover:bg-[#eceae8] active:bg-[#e6e0f5] cursor-pointer"
            )}
          >
            <span className="p-1.5 rounded-md shrink-0">
              {action2.icon}
            </span>
            <span className="text-[10.5px] font-semibold tracking-tight whitespace-nowrap px-1">
              {action2.label}
            </span>
          </motion.button>
        )}

        {/* Action 1: Primary / Destructive (e.g. Hapus) */}
        {action1 && (
          <motion.button
            type="button"
            disabled={action1.disabled}
            tabIndex={isOpen ? 0 : -1}
            aria-label={action1.ariaLabel || action1.label}
            onClick={() => {
              action1.onClick();
              closeDrawer();
            }}
            style={{ width: action1Width }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 overflow-hidden transition-colors border-l border-[#e6e6e6]",
              action1.disabled
                ? "bg-[#f6f5f4] text-[#a39e98] cursor-not-allowed opacity-50"
                : isPastCommit
                ? "bg-[#eb5757] text-white cursor-pointer"
                : action1.variant === "destructive"
                ? "bg-[#fdf2f2] text-[#eb5757] hover:bg-[#fadad9] active:bg-[#eb5757] active:text-white cursor-pointer"
                : "bg-[#5645d4] text-white hover:bg-[#4534b3] cursor-pointer"
            )}
          >
            <span className={cn(
              "p-1.5 rounded-md shrink-0 transition-transform",
              isPastCommit && "scale-110"
            )}>
              {action1.icon}
            </span>
            <span className="text-[10.5px] font-semibold tracking-tight whitespace-nowrap px-1">
              {isPastCommit ? `Lepas: ${action1.label}` : action1.label}
            </span>
          </motion.button>
        )}
      </div>

      {/* ── Foreground Swipeable Card ── */}
      <motion.div
        style={{ x }}
        className={cn(
          "relative z-10 bg-white transition-shadow will-change-transform",
          isDragging && "shadow-notion-2",
          contentClassName
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};
