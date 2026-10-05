import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gsap, useGSAP } from '@/lib/gsap';

export type BiometricScanStatus = 'idle' | 'scanning' | 'success' | 'failed' | 'denied';

interface BiometricScannerProps {
  status: BiometricScanStatus;
  size?: 'sm' | 'md' | 'lg';
  step?: number;
  maxSteps?: number;
  label?: string;
  sublabel?: string;
  onScanClick?: () => void;
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-20 h-20', iconSize: 'w-8 h-8' },
  md: { container: 'w-28 h-28', iconSize: 'w-12 h-12' },
  lg: { container: 'w-36 h-36', iconSize: 'w-16 h-16' },
};

const statusColors = {
  idle: {
    border: 'border-[#e5e3df] group-hover:border-[#5645d4]',
    bg: 'bg-white',
    glow: 'shadow-notion-1',
    icon: 'text-[#5d5b54] group-hover:text-[#5645d4]',
    laser: 'from-transparent via-[#5645d4] to-transparent',
    laserShadow: '',
    ring: 'border-[#d6b6f6]',
  },
  scanning: {
    border: 'border-[#5645d4] shadow-notion-2',
    bg: 'bg-[#e6e0f5]/30',
    glow: 'shadow-notion-2',
    icon: 'text-[#5645d4]',
    laser: 'from-transparent via-[#5645d4] to-transparent',
    laserShadow: '',
    ring: 'border-[#5645d4]',
  },
  success: {
    border: 'border-[#1aae39] shadow-notion-1',
    bg: 'bg-[#eefbf1]',
    glow: 'shadow-notion-1',
    icon: 'text-[#1aae39]',
    laser: 'from-transparent via-[#1aae39] to-transparent',
    laserShadow: '',
    ring: 'border-[#1aae39]',
  },
  failed: {
    border: 'border-[#eb5757] shadow-notion-1',
    bg: 'bg-[#fdf2f2]',
    glow: 'shadow-notion-1',
    icon: 'text-[#eb5757]',
    laser: 'from-transparent via-[#eb5757] to-transparent',
    laserShadow: '',
    ring: 'border-[#eb5757]',
  },
  denied: {
    border: 'border-[#dd5b00] shadow-notion-1',
    bg: 'bg-[#fdf3eb]',
    glow: 'shadow-notion-1',
    icon: 'text-[#dd5b00]',
    laser: 'from-transparent via-[#dd5b00] to-transparent',
    laserShadow: '',
    ring: 'border-[#dd5b00]',
  },
};

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  status = 'idle',
  size = 'md',
  step,
  maxSteps,
  label,
  sublabel,
  onScanClick,
  className,
}) => {
  const currentSize = sizeConfig[size];
  const currentColors = statusColors[status];
  const containerRef = useRef<HTMLButtonElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);

  // GSAP Laser & Pulse animation during biometric scanning
  useGSAP(
    () => {
      if (status === 'scanning' && laserRef.current) {
        // Continuous smooth oscillating laser beam
        gsap.fromTo(
          laserRef.current,
          { top: '8%', opacity: 0.85 },
          {
            top: '88%',
            opacity: 1,
            duration: 1.1,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        );

        // Subtle ambient scale breathing for scanner housing
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            boxShadow: '0 0 16px rgba(86, 69, 212, 0.25)',
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      } else {
        if (laserRef.current) {
          gsap.killTweensOf(laserRef.current);
        }
        if (containerRef.current) {
          gsap.killTweensOf(containerRef.current);
          gsap.set(containerRef.current, { clearProps: 'boxShadow' });
        }
      }

      // Micro-shake on error / failure
      if ((status === 'failed' || status === 'denied') && containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { x: -5 },
          {
            x: 5,
            duration: 0.08,
            repeat: 4,
            yoyo: true,
            ease: 'power1.inOut',
            onComplete: () => {
              if (containerRef.current) {
                gsap.set(containerRef.current, { x: 0 });
              }
            },
          }
        );
      }
    },
    {
      scope: containerRef,
      dependencies: [status],
    }
  );

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 select-none font-sans", className)}>
      <motion.button
        ref={containerRef}
        type="button"
        onClick={onScanClick}
        disabled={status === 'scanning'}
        aria-label={label || 'Sensor Biometrik Sidik Jari DY50'}
        whileHover={onScanClick && status === 'idle' ? { scale: 1.03 } : undefined}
        whileTap={onScanClick && status === 'idle' ? { scale: 0.96 } : undefined}
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center group transition-all duration-200 overflow-hidden',
          currentSize.container,
          currentColors.border,
          currentColors.bg,
          currentColors.glow,
          onScanClick && status === 'idle' && 'cursor-pointer'
        )}
      >
        <AnimatePresence>
          {status === 'scanning' && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className={cn('absolute inset-0 rounded-full border-2 pointer-events-none', currentColors.ring)}
              />
            </>
          )}
        </AnimatePresence>

        {/* GSAP Driven Laser Scan Bar */}
        {status === 'scanning' && (
          <div
            ref={laserRef}
            className={cn(
              'absolute inset-x-2 h-0.5 bg-gradient-to-r z-20 pointer-events-none shadow-[0_0_8px_rgba(86,69,212,0.8)]',
              currentColors.laser
            )}
          />
        )}

        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn('transition-colors duration-200', currentColors.icon)}
              >
                <Fingerprint className={currentSize.iconSize} strokeWidth={1.5} />
              </motion.div>
            )}

            {status === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn(currentColors.icon)}
              >
                <Fingerprint className={cn(currentSize.iconSize, 'animate-pulse')} strokeWidth={1.8} />
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-[#1aae39]"
              >
                <CheckCircle2 className={currentSize.iconSize} strokeWidth={2} />
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.5, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: [0, -6, 6, -4, 4, 0] }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="text-[#eb5757]"
              >
                <XCircle className={currentSize.iconSize} strokeWidth={2} />
              </motion.div>
            )}

            {status === 'denied' && (
              <motion.div
                key="denied"
                initial={{ opacity: 0, scale: 0.5, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: [0, -6, 6, -4, 4, 0] }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="text-[#dd5b00]"
              >
                <ShieldAlert className={currentSize.iconSize} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {(label || step !== undefined) && (
        <div className="text-center space-y-1 max-w-[280px]" aria-live="polite" aria-atomic="true">
          {step !== undefined && maxSteps !== undefined && (
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {Array.from({ length: maxSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i + 1 === step ? 1.2 : 1,
                    backgroundColor: i + 1 <= step ? '#5645d4' : '#e5e3df',
                  }}
                  className="h-1.5 w-5 rounded-full"
                />
              ))}
            </div>
          )}

          {label && (
            <div className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-tight leading-snug">
              {label}
            </div>
          )}

          {sublabel && (
            <div className="text-[10px] sm:text-xs text-[#5d5b54] font-mono leading-relaxed">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
BiometricScanner.displayName = 'BiometricScanner';

