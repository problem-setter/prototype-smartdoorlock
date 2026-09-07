import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoorStatus, LockStatus } from '@/types';

interface InteractiveDoorStateProps {
  doorStatus: DoorStatus;
  lockStatus: LockStatus;
  isAlarmActive?: boolean;
  className?: string;
}

export const InteractiveDoorState: React.FC<InteractiveDoorStateProps> = ({
  doorStatus,
  lockStatus,
  isAlarmActive = false,
  className,
}) => {
  const isOpen = doorStatus === 'OPEN';
  const isLocked = lockStatus === 'LOCKED';

  return (
    <div className={cn('relative p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden', className)}>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: isAlarmActive
            ? 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.15) 0%, transparent 70%)'
            : !isLocked
            ? 'radial-gradient(circle at 50% 50%, rgba(14,165,233,0.12) 0%, transparent 70%)'
            : isOpen
            ? 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-20 bg-slate-900 border-2 border-slate-700/80 rounded-t-lg overflow-hidden flex items-end justify-center shadow-inner perspective-[400px]">
            <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
              <span className="text-[9px] font-mono text-slate-600">LAB DOOR</span>
            </div>

            <motion.div
              animate={{
                rotateY: isOpen ? -65 : 0,
                x: isOpen ? -6 : 0,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ transformOrigin: 'left center' }}
              className={cn(
                'absolute inset-0 rounded-t-md border-r-2 border-b-2 flex flex-col justify-between p-1.5 transition-colors',
                isOpen
                  ? 'bg-amber-950/70 border-amber-500/60 shadow-lg'
                  : !isLocked
                  ? 'bg-sky-950/80 border-sky-500/60'
                  : 'bg-slate-800 border-slate-600'
              )}
            >
              <div className="w-full h-5 rounded-sm bg-slate-900/80 border border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-end pr-1">
                <motion.div
                  animate={{
                    scale: isLocked ? 1 : 1.15,
                    backgroundColor: isLocked ? '#10b981' : '#38bdf8',
                  }}
                  transition={{ duration: 0.2 }}
                  className="w-2 h-3 rounded-xs shadow-xs"
                />
              </div>
            </motion.div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">Status Fisik Pintu</span>
              <AnimatePresence mode="wait">
                {isAlarmActive ? (
                  <motion.span
                    key="alarm"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
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
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      isOpen
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    {isOpen ? 'PINTU TERBUKA' : 'PINTU TERTUTUP'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Sensor MC-38: <strong className={isOpen ? 'text-amber-400' : 'text-emerald-400'}>{doorStatus}</strong> &bull; Solenoid: <strong className={isLocked ? 'text-emerald-400' : 'text-sky-400'}>{lockStatus}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <motion.div
            animate={{
              borderColor: !isLocked ? 'rgba(56, 189, 248, 0.5)' : 'rgba(16, 185, 129, 0.4)',
              backgroundColor: !isLocked ? 'rgba(14, 165, 233, 0.1)' : 'rgba(16, 185, 129, 0.08)',
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: isLocked ? 0 : -25, scale: isLocked ? 1 : 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={cn('p-1.5 rounded-lg shrink-0', isLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400')}
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </motion.div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">12V Solenoid Bolt</div>
                <div className={cn('text-xs font-bold font-mono', isLocked ? 'text-emerald-400' : 'text-sky-400')}>
                  {isLocked ? 'TERKUNCI (SECURE)' : 'TERBUKA (RELAY ON)'}
                </div>
              </div>
            </div>

            <div className="w-5 h-2 rounded-full bg-slate-800 border border-slate-700 relative overflow-hidden shrink-0">
              <motion.div
                animate={{
                  x: isLocked ? 0 : 10,
                  backgroundColor: isLocked ? '#10b981' : '#38bdf8',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-3 h-full rounded-full shadow-xs"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
InteractiveDoorState.displayName = 'InteractiveDoorState';
