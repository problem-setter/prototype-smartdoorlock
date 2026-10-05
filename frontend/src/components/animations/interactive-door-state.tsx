import React from 'react';
import { AlertTriangle, DoorClosed, DoorOpen, Lock, Unlock } from 'lucide-react';
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
  const stateLabel = isAlarmActive ? 'ALARM AKTIF' : isOpen || !isLocked ? 'PERLU PERHATIAN' : 'AMAN';
  const stateClass = isAlarmActive
    ? 'text-[#eb5757] border-[#fadad9] bg-[#fdf2f2]'
    : isOpen || !isLocked
    ? 'text-[#dd5b00] border-[#fbd6b8] bg-[#fdf3eb]'
    : 'text-[#1aae39] border-[#d2f4d9] bg-[#eefbf1]';

  return (
    <section
      className={cn('flex flex-col gap-3.5 rounded-lg border border-[#e6e6e6] bg-white p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between shadow-notion-1', className)}
      aria-label="Status fisik pintu"
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className={cn(
            "p-2 rounded-lg shrink-0 border",
            isAlarmActive ? "bg-[#fdf2f2] border-[#fadad9] text-[#eb5757]" : isOpen ? "bg-[#fdf3eb] border-[#fbd6b8] text-[#dd5b00]" : "bg-[#eefbf1] border-[#d2f4d9] text-[#1aae39]"
          )}>
            {isAlarmActive ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : isOpen ? <DoorOpen className="h-4 w-4" aria-hidden="true" /> : <DoorClosed className="h-4 w-4" aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#000000]">Status Fisik Pintu</p>
            <p className="text-[11px] text-[#615d59] truncate">Sensor reed MC-38 &amp; solenoid 12V</p>
          </div>
        </div>

        {/* Mobile primary status badge right-aligned in header */}
        <span className={cn('sm:hidden shrink-0 rounded-full border px-2.5 py-0.5 font-semibold text-[10px] font-mono tracking-tight', stateClass)}>
          {stateLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-2 text-[10px] sm:text-[11px] font-mono">
        {/* Desktop primary status badge */}
        <span className={cn('hidden sm:inline-flex rounded-full border px-2.5 py-0.5 font-semibold tracking-tight', stateClass)}>
          {stateLabel}
        </span>
        <span className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-0.5 text-center font-semibold truncate',
          isOpen
            ? 'border-[#fbd6b8] bg-[#fdf3eb] text-[#dd5b00]'
            : 'border-[#e6e6e6] bg-[#f6f5f4] text-[#31302e]'
        )}>
          {isOpen ? <DoorOpen className="h-3.5 w-3.5 text-[#dd5b00] shrink-0" aria-hidden="true" /> : <DoorClosed className="h-3.5 w-3.5 text-[#1aae39] shrink-0" aria-hidden="true" />}
          <span className="truncate">{isOpen ? 'PINTU TERBUKA' : 'PINTU TERTUTUP'}</span>
        </span>
        <span className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-0.5 text-center font-semibold truncate',
          !isLocked
            ? 'border-[#fbd6b8] bg-[#fdf3eb] text-[#dd5b00]'
            : 'border-[#e6e6e6] bg-[#f6f5f4] text-[#31302e]'
        )}>
          {isLocked ? <Lock className="h-3.5 w-3.5 text-[#1aae39] shrink-0" aria-hidden="true" /> : <Unlock className="h-3.5 w-3.5 text-[#dd5b00] shrink-0" aria-hidden="true" />}
          <span className="truncate">{isLocked ? 'SOLENOID TERKUNCI' : 'SOLENOID TERBUKA'}</span>
        </span>
      </div>
    </section>
  );
};
InteractiveDoorState.displayName = 'InteractiveDoorState';

