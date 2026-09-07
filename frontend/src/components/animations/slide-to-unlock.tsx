import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { 
  Key, 
  Lock, 
  Unlock, 
  ChevronsRight, 
  WifiOff, 
  Zap, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export interface SlideToUnlockProps {
  onUnlock: () => Promise<unknown> | unknown;
  isUnlocking?: boolean;
  isUnlocked?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  countdownRemaining?: number;
  onForceRelock?: () => void;
  label?: string;
  unlockedLabel?: string;
  roomName?: string;
  roomCode?: string;
  variant?: 'hero' | 'compact';
  className?: string;
}

// Single shared audio context to prevent main-thread latency & memory leaks
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTactileSolenoidSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
    snapGain.gain.setValueAtTime(0.15, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.04);

    const clackOsc = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clackOsc.type = 'sine';
    clackOsc.frequency.setValueAtTime(240, now + 0.025);
    clackOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    clackGain.gain.setValueAtTime(0.2, now + 0.025);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    clackOsc.connect(clackGain);
    clackGain.connect(ctx.destination);
    clackOsc.start(now + 0.025);
    clackOsc.stop(now + 0.1);
  } catch {
    // Ignore audio errors
  }
}

function playTickSound(frequency = 600) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Ignore
  }
}

export const SlideToUnlock: React.FC<SlideToUnlockProps> = ({
  onUnlock,
  isUnlocking = false,
  isUnlocked = false,
  disabled = false,
  disabledReason = 'Perangkat tidak siap',
  countdownRemaining = 5,
  onForceRelock,
  label = 'GESER UNTUK REMOTE UNLOCK',
  unlockedLabel = 'SOLENOID 12V DIBUKA',
  roomName,
  variant = 'hero',
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [isLatched, setIsLatched] = useState(false);
  const isExecutingRef = useRef(false);
  const isDraggingRef = useRef(false);

  const currentXRef = useRef(0);
  const startXRef = useRef(0);
  const maxDragRef = useRef(200);
  const trackWidthRef = useRef(300);
  const lastHapticStepRef = useRef(0);
  const progressRef = useRef(0);
  const isRafScheduledRef = useRef(false);

  // Pre-allocated GSAP quickSetters for high performance 60-120fps drag updates
  type QuickSetterFn = ReturnType<typeof gsap.quickSetter>;
  const thumbXSetterRef = useRef<QuickSetterFn | null>(null);
  const fillScaleSetterRef = useRef<QuickSetterFn | null>(null);
  const textOpacitySetterRef = useRef<QuickSetterFn | null>(null);
  const textXSetterRef = useRef<QuickSetterFn | null>(null);

  // Invalidate stale quickSetters (called when DOM nodes are destroyed/remounted)
  const clearQuickSetters = useCallback(() => {
    thumbXSetterRef.current = null;
    fillScaleSetterRef.current = null;
    textOpacitySetterRef.current = null;
    textXSetterRef.current = null;
  }, []);

  // Always (re)create quickSetters from the current live DOM refs
  const initQuickSetters = useCallback(() => {
    if (thumbRef.current) {
      thumbXSetterRef.current = gsap.quickSetter(thumbRef.current, 'x', 'px');
    }
    if (fillRef.current) {
      fillScaleSetterRef.current = gsap.quickSetter(fillRef.current, 'scaleX');
    }
    if (textRef.current) {
      textOpacitySetterRef.current = gsap.quickSetter(textRef.current, 'opacity');
      textXSetterRef.current = gsap.quickSetter(textRef.current, 'x', 'px');
    }
  }, []);

  const updateDimensions = useCallback(() => {
    if (!trackRef.current || !thumbRef.current) return;
    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDrag = Math.max(10, trackWidth - thumbWidth - 8);
    maxDragRef.current = maxDrag;
    trackWidthRef.current = trackWidth;
  }, []);

  useEffect(() => {
    updateDimensions();
    initQuickSetters();
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    if (trackRef.current) {
      observer.observe(trackRef.current);
    }
    return () => observer.disconnect();
  }, [updateDimensions, initQuickSetters]);

  const prevUnlockedStateRef = useRef(isUnlocked || isUnlocking);

  useEffect(() => {
    const wasActive = prevUnlockedStateRef.current;
    const isNowActive = isUnlocked || isUnlocking;
    prevUnlockedStateRef.current = isNowActive;

    if (wasActive && !isNowActive) {
      // Unlock cycle completed — slider DOM has remounted with fresh nodes.
      // Invalidate stale quickSetters so they rebind on next pointerDown.
      isExecutingRef.current = false;
      currentXRef.current = 0;
      progressRef.current = 0;
      setIsLatched(false);
      clearQuickSetters();

      // Re-initialize after React has committed the new slider DOM
      requestAnimationFrame(() => {
        updateDimensions();
        initQuickSetters();

        if (thumbRef.current && fillRef.current && textRef.current) {
          gsap.set(thumbRef.current, { x: 0, scale: 1 });
          gsap.set(fillRef.current, { scaleX: 0 });
          gsap.set(textRef.current, { opacity: 1, x: 0 });
        }
      });
    }
  }, [isUnlocked, isUnlocking, clearQuickSetters, updateDimensions, initQuickSetters]);

  const executeUnlock = useCallback(async () => {
    if (isExecutingRef.current || disabled) return;
    isExecutingRef.current = true;
    setIsLatched(true);

    playTactileSolenoidSound();
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 70]);
    }

    // Cache origin before the DOM re-renders and the thumb unmounts
    let confettiOrigin = { x: 0.85, y: 0.5 };
    if (thumbRef.current) {
      const rect = thumbRef.current.getBoundingClientRect();
      confettiOrigin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    // Double-RAF: skip the re-render paint frame, then fire confetti on a clean compositor frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        confetti({
          particleCount: 18,
          spread: 45,
          startVelocity: 22,
          ticks: 50,
          origin: confettiOrigin,
          colors: ['#38bdf8', '#0ea5e9', '#06b6d4', '#10b981', '#ffffff'],
          disableForReducedMotion: true,
        });
      });
    });

    // Defer onUnlock to a separate macrotask so the slider snap animation
    // paints without contention from cascading state updates in the parent
    setTimeout(async () => {
      try {
        await onUnlock();
      } catch {
        setIsLatched(false);
        isExecutingRef.current = false;
        progressRef.current = 0;
        currentXRef.current = 0;
        if (thumbRef.current && fillRef.current && textRef.current) {
          gsap.to(thumbRef.current, { x: 0, duration: 0.25, ease: 'power3.out' });
          gsap.to(fillRef.current, { scaleX: 0, duration: 0.25, ease: 'power3.out' });
          gsap.to(textRef.current, { opacity: 1, x: 0, duration: 0.25, ease: 'power3.out' });
        }
      }
    }, 0);
  }, [disabled, onUnlock]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isUnlocked || isUnlocking || isLatched) return;
    
    isDraggingRef.current = true;
    startXRef.current = e.clientX - currentXRef.current;
    lastHapticStepRef.current = 0;

    initQuickSetters();
    e.currentTarget.setPointerCapture(e.pointerId);

    if (thumbRef.current) {
      gsap.to(thumbRef.current, {
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.out',
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || disabled || isUnlocked || isLatched) return;

    const rawX = e.clientX - startXRef.current;
    const maxDrag = maxDragRef.current;
    const clampedX = Math.max(0, Math.min(rawX, maxDrag));
    const progress = maxDrag > 0 ? clampedX / maxDrag : 0;

    currentXRef.current = clampedX;
    progressRef.current = progress;

    if (!isRafScheduledRef.current) {
      isRafScheduledRef.current = true;
      requestAnimationFrame(() => {
        isRafScheduledRef.current = false;
        
        // Calculate GPU composite scaleX (0 to 1) for the fill bar
        const fillScale = Math.min(1, Math.max(0, (clampedX + 28) / (trackWidthRef.current || 1)));

        if (thumbXSetterRef.current) thumbXSetterRef.current(currentXRef.current);
        if (fillScaleSetterRef.current) fillScaleSetterRef.current(fillScale);
        if (textOpacitySetterRef.current) textOpacitySetterRef.current(Math.max(0, 1 - progressRef.current * 1.5));
        if (textXSetterRef.current) textXSetterRef.current(currentXRef.current * 0.12);
      });
    }

    const currentStep = Math.floor(progress * 4);
    if (currentStep > lastHapticStepRef.current) {
      lastHapticStepRef.current = currentStep;
      playTickSound(450 + currentStep * 150);
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const progress = progressRef.current;
    const maxDrag = maxDragRef.current;

    if (progress >= 0.82) {
      progressRef.current = 1;
      currentXRef.current = maxDrag;
      if (thumbRef.current && fillRef.current && textRef.current) {
        gsap.to(thumbRef.current, {
          x: maxDrag,
          scale: 1,
          duration: 0.14,
          ease: 'power3.out',
        });
        gsap.to(fillRef.current, {
          scaleX: 1,
          duration: 0.14,
          ease: 'power3.out',
        });
        gsap.to(textRef.current, {
          opacity: 0,
          duration: 0.1,
        });
      }
      executeUnlock();
    } else {
      progressRef.current = 0;
      currentXRef.current = 0;
      if (thumbRef.current && fillRef.current && textRef.current) {
        gsap.to(thumbRef.current, {
          x: 0,
          scale: 1,
          duration: 0.22,
          ease: 'power3.out',
        });
        gsap.to(fillRef.current, {
          scaleX: 0,
          duration: 0.2,
          ease: 'power3.out',
        });
        gsap.to(textRef.current, {
          opacity: 1,
          x: 0,
          duration: 0.18,
          ease: 'power2.out',
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || isUnlocked || isUnlocking || isLatched) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const maxDrag = maxDragRef.current;
      const nextProgress = Math.min(1, progressRef.current + 0.34);
      const nextX = nextProgress * maxDrag;
      const fillScale = Math.min(1, Math.max(0, (nextX + 28) / (trackWidthRef.current || 1)));

      currentXRef.current = nextX;
      progressRef.current = nextProgress;

      if (thumbRef.current && fillRef.current && textRef.current) {
        gsap.to(thumbRef.current, { x: nextX, duration: 0.12, ease: 'power2.out' });
        gsap.to(fillRef.current, { scaleX: fillScale, duration: 0.12, ease: 'power2.out' });
        gsap.to(textRef.current, { opacity: Math.max(0, 1 - nextProgress * 1.5), duration: 0.12 });
      }

      playTickSound(600 + nextProgress * 200);

      if (nextProgress >= 0.9) {
        executeUnlock();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const maxDrag = maxDragRef.current;
      currentXRef.current = maxDrag;
      progressRef.current = 1;

      if (thumbRef.current && fillRef.current && textRef.current) {
        gsap.to(thumbRef.current, { x: maxDrag, duration: 0.16, ease: 'power3.out' });
        gsap.to(fillRef.current, { scaleX: 1, duration: 0.16, ease: 'power3.out' });
        gsap.to(textRef.current, { opacity: 0, duration: 0.1 });
      }
      executeUnlock();
    } else if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      currentXRef.current = 0;
      progressRef.current = 0;
      if (thumbRef.current && fillRef.current && textRef.current) {
        gsap.to(thumbRef.current, { x: 0, duration: 0.2, ease: 'power3.out' });
        gsap.to(fillRef.current, { scaleX: 0, duration: 0.2, ease: 'power3.out' });
        gsap.to(textRef.current, { opacity: 1, x: 0, duration: 0.2 });
      }
    }
  };

  const isHero = variant === 'hero';

  if (isUnlocked || isUnlocking) {
    return (
      <div 
        className={cn(
          'relative overflow-hidden rounded-2xl border',
          'bg-gradient-to-r from-sky-950/95 via-sky-900/90 to-blue-950/95',
          'border-sky-400/60 shadow-[0_0_30px_rgba(14,165,233,0.35)]',
          isHero ? 'p-3.5 sm:p-4' : 'p-2.5 sm:p-3',
          className
        )}
      >
        {/* GPU-only shimmer: uses translate3d + contain to avoid layout/paint recalculations */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(56,189,248,0.12)_50%,transparent_100%)] animate-[shimmer_2.5s_ease-in-out_infinite] pointer-events-none"
          style={{ willChange: 'transform', contain: 'strict' }} 
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-2 sm:p-2.5 rounded-xl bg-sky-500/25 border border-sky-400/50 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.4)] shrink-0">
              {/* Replaced animate-ping (layout-heavy) with GPU-only opacity pulse */}
              <span 
                className="absolute inline-flex h-full w-full rounded-xl bg-sky-400" 
                style={{ 
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  willChange: 'opacity',
                  contain: 'strict',
                }}
              />
              <Unlock className="h-5 w-5 sm:h-6 sm:w-6 relative z-10 text-sky-200" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide font-mono uppercase">
                  {unlockedLabel}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  RELAY 12V ON
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/90 font-mono mt-0.5">
                Auto-relock aktif: Menutup otomatis dalam <strong className="text-emerald-300 font-bold">{countdownRemaining}s</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-emerald-400 font-mono text-xs font-bold shrink-0">
              <Zap className="h-3.5 w-3.5" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', willChange: 'opacity' }} />
              <span>12V Aktif</span>
            </div>

            {onForceRelock && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onForceRelock}
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                className="shrink-0 shadow-md shadow-rose-950/60"
              >
                Kunci Paksa
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <Tooltip content={disabledReason}>
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-white/5 bg-[#080d18]/60 p-2 sm:p-2.5 opacity-60 cursor-not-allowed select-none',
            className
          )}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <div className="flex items-center gap-2.5 text-slate-500 font-mono text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Remote Unlock Terkunci</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <WifiOff className="h-3 w-3 text-rose-500" />
                  {disabledReason}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase px-2.5 py-1 rounded bg-slate-900/80 border border-white/5">
              OFFLINE
            </div>
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={cn('relative w-full select-none touch-none', className)}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`Slide to unlock ${roomName || 'pintu'}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex items-center rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-colors duration-200 outline-none',
          'bg-[#060a14] border border-white/[0.12] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_20px_rgba(0,0,0,0.4)]',
          'focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:border-sky-400',
          isHero ? 'h-14 sm:h-16 p-1.5' : 'h-12 sm:h-13 p-1'
        )}
      >
        <div
          ref={fillRef}
          className={cn(
            'absolute left-0 top-0 bottom-0 right-0 pointer-events-none rounded-2xl transition-opacity',
            'bg-gradient-to-r from-sky-600/30 via-sky-500/40 to-cyan-400/60',
            'border-r-2 border-cyan-300/80'
          )}
          style={{ 
            width: '100%', 
            transformOrigin: 'left center', 
            transform: 'scaleX(0)', 
            willChange: 'transform' 
          }}
        >
          <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-cyan-300 opacity-75" />
        </div>

        <div 
          className="absolute right-12 top-2 bottom-2 w-[1px] border-r border-dashed border-white/15 pointer-events-none hidden sm:block" 
          title="Batas Pemicu Unlock"
        />

        <div
          ref={textRef}
          className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none px-12 transition-opacity',
            'text-center font-mono font-bold tracking-wider',
            isHero ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
          )}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="relative inline-flex items-center gap-2 text-slate-300 group">
            <span>
              {label}
            </span>
            <ChevronsRight className="h-4 w-4 text-sky-400 animate-[pulse_1.5s_infinite]" />
          </div>
        </div>

        <div
          ref={thumbRef}
          className={cn(
            'relative z-20 flex items-center justify-center rounded-xl font-bold cursor-grab active:cursor-grabbing shadow-lg transition-shadow',
            'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white border border-sky-300/40',
            'shadow-[0_0_20px_rgba(14,165,233,0.4),0_4px_12px_rgba(0,0,0,0.5)]',
            'hover:shadow-[0_0_26px_rgba(14,165,233,0.6)]',
            isHero ? 'h-11 sm:h-13 w-12 sm:w-14' : 'h-9 sm:h-10 w-10 sm:w-11'
          )}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        >
          <Key className={cn('text-white drop-shadow', isHero ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4')} />
        </div>
      </div>
    </div>
  );
};

export default SlideToUnlock;
