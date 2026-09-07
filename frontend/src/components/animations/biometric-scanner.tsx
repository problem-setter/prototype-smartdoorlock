import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  sm: { container: 'w-24 h-24', iconSize: 'w-10 h-10' },
  md: { container: 'w-32 h-32', iconSize: 'w-14 h-14' },
  lg: { container: 'w-44 h-44', iconSize: 'w-20 h-20' },
};

const statusColors = {
  idle: {
    border: 'border-white/10 group-hover:border-sky-500/60',
    bg: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90',
    glow: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.25)]',
    icon: 'text-slate-400 group-hover:text-sky-400',
    laser: 'from-transparent via-sky-400 to-transparent',
    laserShadow: 'shadow-[0_0_10px_rgba(56,189,248,0.9)]',
    ring: 'border-sky-500/20',
  },
  scanning: {
    border: 'border-sky-400 shadow-[0_0_35px_rgba(14,165,233,0.5)]',
    bg: 'bg-gradient-to-b from-sky-950/60 to-slate-950/90',
    glow: 'shadow-[0_0_40px_rgba(14,165,233,0.4)]',
    icon: 'text-sky-300',
    laser: 'from-transparent via-sky-300 to-transparent',
    laserShadow: 'shadow-[0_0_16px_rgba(56,189,248,1)]',
    ring: 'border-sky-400/50',
  },
  success: {
    border: 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]',
    bg: 'bg-gradient-to-b from-emerald-950/60 to-slate-950/90',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.45)]',
    icon: 'text-emerald-300',
    laser: 'from-transparent via-emerald-300 to-transparent',
    laserShadow: 'shadow-[0_0_16px_rgba(16,185,129,1)]',
    ring: 'border-emerald-400/60',
  },
  failed: {
    border: 'border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.5)]',
    bg: 'bg-gradient-to-b from-rose-950/60 to-slate-950/90',
    glow: 'shadow-[0_0_40px_rgba(244,63,94,0.45)]',
    icon: 'text-rose-300',
    laser: 'from-transparent via-rose-300 to-transparent',
    laserShadow: 'shadow-[0_0_16px_rgba(244,63,94,1)]',
    ring: 'border-rose-400/60',
  },
  denied: {
    border: 'border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)]',
    bg: 'bg-gradient-to-b from-amber-950/60 to-slate-950/90',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.45)]',
    icon: 'text-amber-300',
    laser: 'from-transparent via-amber-300 to-transparent',
    laserShadow: 'shadow-[0_0_16px_rgba(245,158,11,1)]',
    ring: 'border-amber-400/60',
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

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 select-none', className)}>
      <motion.button
        type="button"
        onClick={onScanClick}
        disabled={status === 'scanning'}
        aria-label={label || 'Sensor Biometrik Sidik Jari AS608'}
        whileHover={onScanClick && status === 'idle' ? { scale: 1.04 } : undefined}
        whileTap={onScanClick && status === 'idle' ? { scale: 0.95 } : undefined}
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center group transition-all duration-300 overflow-hidden',
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
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                className={cn('absolute inset-0 rounded-full border-2 pointer-events-none', currentColors.ring)}
              />
              <motion.div
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.4, delay: 0.7, repeat: Infinity, ease: 'easeOut' }}
                className={cn('absolute inset-0 rounded-full border-2 pointer-events-none', currentColors.ring)}
              />
            </>
          )}
        </AnimatePresence>

        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />

        <AnimatePresence>
          {status === 'scanning' && (
            <motion.div
              initial={{ top: '5%' }}
              animate={{ top: ['5%', '90%', '5%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className={cn(
                'absolute inset-x-2 h-0.5 bg-gradient-to-r z-20 pointer-events-none',
                currentColors.laser,
                currentColors.laserShadow
              )}
            />
          )}
        </AnimatePresence>

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
                className="text-emerald-400"
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
                className="text-rose-400"
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
                className="text-amber-400"
              >
                <ShieldAlert className={currentSize.iconSize} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Outer Bevel Highlight */}
        <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />
      </motion.button>

      {(label || step !== undefined) && (
        <div className="text-center space-y-1 max-w-[280px]">
          {step !== undefined && maxSteps !== undefined && (
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {Array.from({ length: maxSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i + 1 === step ? 1.25 : 1,
                    backgroundColor: i + 1 <= step ? '#a855f7' : '#334155',
                    boxShadow: i + 1 === step ? '0 0 8px #a855f7' : 'none',
                  }}
                  className="h-1.5 w-5 rounded-full"
                />
              ))}
            </div>
          )}

          {label && (
            <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
              {label}
            </div>
          )}

          {sublabel && (
            <div className="text-[10px] sm:text-xs text-slate-400 font-mono leading-relaxed">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
BiometricScanner.displayName = 'BiometricScanner';
