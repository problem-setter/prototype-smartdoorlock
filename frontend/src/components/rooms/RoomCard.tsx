import React from 'react';
import { motion } from 'framer-motion';
import { Room } from '../../types';
import { useApp } from '@/context';
import { 
  DoorClosed, 
  DoorOpen, 
  Lock, 
  Unlock, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Activity, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/animations/glow-card';
import { AnimatedCounter } from '@/components/animations/animated-counter';

interface RoomCardProps {
  room: Room;
  onSelect: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const { currentUser } = useApp();

  const isLocked = room.lockStatus === 'LOCKED';
  const isDoorOpen = room.doorStatus === 'OPEN';
  const isOnline = room.deviceStatus === 'ONLINE';

  return (
    <GlowCard
      glowColor={room.isAlarmActive ? 'rgba(244, 63, 94, 0.15)' : !isLocked ? 'rgba(14, 165, 233, 0.18)' : 'rgba(56, 189, 248, 0.12)'}
      className={cn(
        'p-4 sm:p-6 flex flex-col justify-between group cursor-pointer transition-all duration-300',
        room.isAlarmActive && 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/30'
      )}
      onClick={() => onSelect(room.id)}
    >
      {/* Top Section: Room Code & Status Badges */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge variant="mono">{room.code}</Badge>
            <Badge variant={isOnline ? 'online' : 'offline'} icon={isOnline ? <Wifi className="h-3 w-3 shrink-0" /> : <WifiOff className="h-3 w-3 shrink-0" />}>
              {room.deviceStatus}
            </Badge>
          </div>

          {/* Alarm Indicator */}
          {room.isAlarmActive && (
            <Badge variant="danger" pulse icon={<AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />} className="status-beacon-rose font-bold">
              ALARM ({room.openDurationSeconds}s)
            </Badge>
          )}
        </div>

        {/* Room Title & Description */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
            {room.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {room.description}
          </p>
        </div>


        {/* Live Door & Lock States Visualizer */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
          {/* Physical Door State (MC-38) */}
          <div className={cn(
            'p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 sm:gap-3 transition-colors',
            isDoorOpen 
              ? 'bg-amber-950/30 border-amber-800/40 text-amber-300' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          )}>
            <motion.div 
              animate={{ rotate: isDoorOpen ? -15 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'p-1.5 rounded-lg shrink-0 transition-colors',
                isDoorOpen ? 'bg-amber-900/40 text-amber-400' : 'bg-slate-800 text-slate-400'
              )}
            >
              {isDoorOpen ? <DoorOpen className="h-4 w-4" /> : <DoorClosed className="h-4 w-4" />}
            </motion.div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">Pintu Fisik</div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate">{room.doorStatus}</div>
            </div>
          </div>

          {/* Solenoid Lock State */}
          <div className={cn(
            'p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 sm:gap-3 transition-colors',
            !isLocked 
              ? 'bg-sky-950/30 border-sky-800/40 text-sky-300' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          )}>
            <motion.div
              animate={{ rotate: isLocked ? 0 : -20, scale: isLocked ? 1 : 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'p-1.5 rounded-lg shrink-0 transition-colors',
                !isLocked ? 'bg-sky-900/40 text-sky-400' : 'bg-slate-800 text-slate-400'
              )}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-sky-400" />}
            </motion.div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate">Kunci Solenoid</div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate">{room.lockStatus}</div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center justify-between py-1.5 sm:py-2 border-t border-slate-800 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Akses: <strong className="text-slate-200 font-mono"><AnimatedCounter value={room.todayAccessCount} duration={0.8} /></strong></span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <Fingerprint className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate">FP: <strong className="text-slate-200 font-mono">{room.usedFingerprints}/{room.fingerprintCapacity}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 mt-2 sm:pt-3.5 sm:mt-3 border-t border-slate-800/80">
        <Button
          variant="secondary"
          size="sm"
          className="w-full group/btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(room.id);
          }}
          rightIcon={
            <motion.span
              className="inline-block"
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <ArrowRight className="h-3.5 w-3.5 shrink-0 group-hover/btn:translate-x-1 transition-transform" />
            </motion.span>
          }
        >
          <span className="truncate">
            {currentUser?.role === 'user' ? 'Lihat Riwayat & Status Saya' : 'Masuk Dashboard Kontrol'}
          </span>
        </Button>
      </div>

    </GlowCard>
  );
};

