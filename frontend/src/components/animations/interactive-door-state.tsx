import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertTriangle, Zap, Magnet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoorStatus, LockStatus } from '@/types';

interface InteractiveDoorStateProps {
  doorStatus: DoorStatus;
  lockStatus: LockStatus;
  isAlarmActive?: boolean;
  onToggleDoor?: () => void;
  className?: string;
}

export const InteractiveDoorState: React.FC<InteractiveDoorStateProps> = ({
  doorStatus,
  lockStatus,
  isAlarmActive = false,
  onToggleDoor,
  className,
}) => {
  const isOpen = doorStatus === 'OPEN';
  const isLocked = lockStatus === 'LOCKED';

  return (
    <div className={cn('relative p-4 sm:p-5 rounded-2xl bg-[#070c17]/95 border border-white/[0.09] shadow-2xl overflow-hidden backdrop-blur-xl transition-all', className)}>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: isAlarmActive
            ? 'radial-gradient(circle at 30% 50%, rgba(244,63,94,0.22) 0%, transparent 65%)'
            : !isLocked
            ? 'radial-gradient(circle at 30% 50%, rgba(14,165,233,0.18) 0%, transparent 65%)'
            : isOpen
            ? 'radial-gradient(circle at 30% 50%, rgba(245,158,11,0.16) 0%, transparent 65%)'
            : 'radial-gradient(circle at 30% 50%, rgba(16,185,129,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
        {/* Left Side: 3D Door & MC-38 Magnetic Visualizer */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onToggleDoor}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleDoor?.();
              }
            }}
            aria-label={`Simulasi sensor pintu fisik MC-38: saat ini ${isOpen ? 'Terbuka' : 'Tertutup'}`}
            className={cn(
              'relative w-18 sm:w-20 h-26 sm:h-28 bg-[#0c111d] border border-white/15 rounded-t-xl overflow-hidden flex items-end justify-center shadow-2xl shrink-0 perspective-[500px] text-left p-0',
              onToggleDoor && 'cursor-pointer hover:border-sky-400/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'
            )}
            title={onToggleDoor ? 'Klik untuk simulasi buka/tutup pintu fisik' : undefined}
          >
            {/* Door Frame Inner Background */}
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-between p-1.5 border-b border-white/5">
              <div className="w-full flex items-center justify-between text-[7px] font-mono text-slate-400 px-0.5">
                <span>MC-38</span>
                <span className={isLocked ? 'text-emerald-400' : 'text-sky-400'}>12V</span>
              </div>

              {isOpen ? (
                <span className="text-[9px] font-bold text-amber-400 font-mono animate-pulse tracking-wider">
                  OPEN
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-400/80 font-mono tracking-wider">
                  CLOSED
                </span>
              )}

              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn('h-full w-full', isOpen ? 'bg-amber-400' : 'bg-emerald-400')} />
              </div>
            </div>

            {/* 3D Animated Door Leaf */}
            <motion.div
              animate={{
                rotateY: isOpen ? -70 : 0,
                x: isOpen ? -8 : 0,
              }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              style={{ transformOrigin: 'left center', willChange: 'transform' }}
              className={cn(
                'absolute inset-0 rounded-t-lg border flex flex-col justify-between p-2 transition-colors shadow-2xl',
                isOpen
                  ? 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border-amber-500/70 shadow-amber-950/50'
                  : !isLocked
                  ? 'bg-gradient-to-br from-sky-950/95 via-slate-900 to-slate-950 border-sky-500/70 shadow-sky-950/50'
                  : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-white/20'
              )}
            >
              {/* Inspection Glass Window */}
              <div className="w-full h-7 rounded-md bg-slate-950/90 border border-white/15 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>

              {/* Physical Magnetic Solenoid Plunger Pin */}
              <div className="flex items-center justify-end pr-0.5">
                <motion.div
                  animate={{
                    x: isLocked ? 2 : -5,
                    backgroundColor: isLocked ? '#10b981' : '#38bdf8',
                    boxShadow: isLocked
                      ? '0 0 8px rgba(16, 185, 129, 0.8)'
                      : '0 0 10px rgba(56, 189, 248, 0.9)',
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="w-3.5 h-2 rounded-xs border border-white/30"
                />
              </div>
            </motion.div>
          </button>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Magnet className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Sensor Pintu & Solenoid 12V</span>
              </h4>
              <AnimatePresence mode="wait">
                {isAlarmActive ? (
                  <motion.span
                    key="alarm"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-mono shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  >
                    <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                    TIMEOUT ALARM
                  </motion.span>
                ) : (
                  <motion.span
                    key="normal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border font-mono',
                      isOpen
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    )}
                  >
                    {isOpen ? 'PINTU TERBUKA' : 'PINTU TERTUTUP'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[11px] text-slate-400 font-mono truncate">
              MC-38: <strong className={isOpen ? 'text-amber-400' : 'text-emerald-400'}>{doorStatus}</strong> &bull; Solenoid: <strong className={isLocked ? 'text-emerald-400' : 'text-sky-400'}>{lockStatus}</strong>
            </p>
          </div>
        </div>

        {/* Right Side: 12V Solenoid Bolt State Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <motion.div
            animate={{
              borderColor: !isLocked ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.4)',
              backgroundColor: !isLocked ? 'rgba(14, 165, 233, 0.12)' : 'rgba(16, 185, 129, 0.09)',
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 shadow-inner backdrop-blur-xs"
          >
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ rotate: isLocked ? 0 : -25, scale: isLocked ? 1 : 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={cn(
                  'p-1.5 rounded-lg shrink-0 border transition-colors',
                  isLocked 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                    : 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.25)] animate-pulse'
                )}
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </motion.div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  12V Solenoid Bolt
                </div>
                <div className={cn('text-xs font-bold font-mono', isLocked ? 'text-emerald-400' : 'text-sky-400')}>
                  {isLocked ? 'TERKUNCI (SECURE)' : 'TERBUKA (RELAY ON)'}
                </div>
              </div>
            </div>

            <div className="w-6 h-2.5 rounded-full bg-slate-900 border border-white/10 relative overflow-hidden shrink-0">
              <motion.div
                animate={{
                  x: isLocked ? 0 : 12,
                  backgroundColor: isLocked ? '#10b981' : '#38bdf8',
                  boxShadow: isLocked ? '0 0 6px #10b981' : '0 0 8px #38bdf8',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-3.5 h-full rounded-full shadow-xs"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
InteractiveDoorState.displayName = 'InteractiveDoorState';
