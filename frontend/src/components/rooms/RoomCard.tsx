import React from 'react';
import { Room } from '@/types';
import {
  AlertTriangle,
  ChevronRight,
  DoorClosed,
  DoorOpen,
  Lock,
  Unlock,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
  onSelect: (roomId: string) => void;
}

const RoomCardComponent: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const isLocked = room.lockStatus === 'LOCKED';
  const isDoorOpen = room.doorStatus === 'OPEN';
  const isAlarm = room.isAlarmActive;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={() => onSelect(room.id)}
      aria-label={`Ruangan ${room.name} - Solenoid ${isLocked ? 'Terkunci' : 'Terbuka'}, Pintu ${isDoorOpen ? 'Terbuka' : 'Tertutup'}${isAlarm ? ', Alarm aktif' : ''}`}
      className={cn(
        'group relative flex w-full flex-col justify-between rounded-lg border border-[#e5e3df] bg-white p-3.5 sm:p-4 text-left transition-colors duration-150 ease-out hover:border-[#c8c4be] hover:shadow-notion-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f4] cursor-pointer shadow-notion-1',
        isAlarm && 'border-[#fadad9] bg-[#fdf2f2]/30'
      )}
    >
      <div className="w-full space-y-3">
        {/* Header: Room Name, Location & Action Chevron */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span
              className="block text-sm sm:text-[15px] font-bold tracking-tight text-[#1a1a1a] leading-snug line-clamp-1 group-hover:text-[#5645d4] transition-colors"
              title={room.name}
            >
              {room.name}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5d5b54]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#5d5b54]" aria-hidden="true" />
              <span className="truncate" title={room.description}>
                {room.description || 'Ruangan Laboratorium'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {isAlarm && (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-full border border-[#fadad9] bg-[#fdf2f2] text-[#e03131] shrink-0 animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>ALARM</span>
              </span>
            )}
            <ChevronRight
              className="h-4 w-4 text-[#5d5b54] group-hover:text-[#5645d4] group-hover:translate-x-0.5 transition-all shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Hardware Security Telemetry: Solenoid 12V & MC-38 Magnetic Door Switch */}
        <div className="grid grid-cols-2 divide-x divide-[#e5e3df] rounded-md border border-[#e5e3df] bg-[#fafaf9] overflow-hidden">
          {/* Solenoid Status */}
          <div
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 transition-colors',
              !isLocked && 'bg-[#fdf3eb]'
            )}
            title={`Solenoid 12V: ${isLocked ? 'Terkunci (Secure)' : 'Terbuka (Unlocked)'}`}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md shrink-0 transition-transform duration-200',
                isLocked
                  ? 'bg-[#eefbf1] text-[#1aae39]'
                  : 'bg-[#fdf3eb] text-[#dd5b00] scale-105'
              )}
            >
              {isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Unlock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[9.5px] uppercase font-mono tracking-wider text-[#5d5b54]">Solenoid</div>
              <div
                className={cn(
                  'font-semibold text-xs truncate transition-colors',
                  isLocked ? 'text-[#1aae39]' : 'text-[#dd5b00]'
                )}
              >
                {isLocked ? 'Terkunci' : 'Terbuka'}
              </div>
            </div>
          </div>

          {/* Door Status */}
          <div
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 transition-colors',
              isDoorOpen && 'bg-[#fdf3eb]'
            )}
            title={`Sensor Pintu MC-38: ${isDoorOpen ? 'Terbuka (Open)' : 'Tertutup (Closed)'}`}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md shrink-0 transition-transform duration-200',
                isDoorOpen
                  ? 'bg-[#fdf3eb] text-[#dd5b00] scale-105'
                  : 'bg-white border border-[#e5e3df] text-[#5d5b54]'
              )}
            >
              {isDoorOpen ? (
                <DoorOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <DoorClosed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[9.5px] uppercase font-mono tracking-wider text-[#5d5b54]">Pintu</div>
              <div
                className={cn(
                  'font-semibold text-xs truncate transition-colors',
                  isDoorOpen ? 'text-[#dd5b00]' : 'text-[#37352f]'
                )}
              >
                {isDoorOpen ? 'Terbuka' : 'Tertutup'}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert if Door Open Timeout is Active */}
        {isAlarm && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border bg-[#fdf2f2] border-[#fadad9] text-[#e03131] min-w-0">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              Timeout pintu terbuka: {room.openDurationSeconds}s (batas 15s)
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export const RoomCard = React.memo(RoomCardComponent);
