import React from 'react';
import { motion } from 'framer-motion';
import { Room } from '../../types';
import { useApp } from '@/context';
import { 
  DoorClosed, 
  DoorOpen, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Activity, 
  ArrowRight, 
  Fingerprint, 
  Radio 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlowCard } from '@/components/animations/glow-card';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { PulseBeacon } from '@/components/animations/pulse-beacon';

interface RoomCardProps {
  room: Room;
  onSelect: (roomId: string) => void;
}

const RoomCardComponent: React.FC<RoomCardProps> = ({ room, onSelect }) => {
  const { currentUser } = useApp();

  const isLocked = room.lockStatus === 'LOCKED';
  const isDoorOpen = room.doorStatus === 'OPEN';
  const isOnline = room.deviceStatus === 'ONLINE';

  return (
    <GlowCard
      glowColor={
        room.isAlarmActive 
          ? 'rgba(244, 63, 94, 0.28)' 
          : !isLocked 
          ? 'rgba(14, 165, 233, 0.24)' 
          : 'rgba(56, 189, 248, 0.16)'
      }
      className={cn(
        'p-4 sm:p-5 flex flex-col justify-between group cursor-pointer transition-all duration-200 relative rounded-2xl bg-[#0c111d] border border-white/[0.09]',
        room.isAlarmActive && 'border-rose-500/60 bg-[#1c0810]/95 shadow-2xl shadow-rose-950/50'
      )}
      onClick={() => onSelect(room.id)}
    >
      {/* Top Section: Room Code & Status Badges */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge variant="mono" className="font-mono font-bold text-white bg-slate-950/90 border-white/15 px-2 py-0.5">
              {room.code}
            </Badge>
            <Badge 
              variant={isOnline ? 'online' : 'offline'} 
              icon={isOnline ? <PulseBeacon color="emerald" size="sm" /> : <PulseBeacon color="rose" size="sm" />}
            >
              {room.deviceStatus}
            </Badge>
          </div>

          {/* Alarm Indicator */}
          {room.isAlarmActive ? (
            <Badge variant="danger" pulse icon={<AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />} className="status-beacon-rose font-bold font-mono">
              ALARM ({room.openDurationSeconds}s)
            </Badge>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Radio className="h-3 w-3 text-sky-400" />
              <span>QoS 1</span>
            </span>
          )}
        </div>

        {/* Room Title & Description */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors leading-snug">
            {room.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {room.description}
          </p>
        </div>


        {/* Live Door & Lock States Visualizer */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
          {/* Physical Door State (MC-38) */}
          <div className={cn(
            'p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 sm:gap-2.5 transition-all shadow-inner',
            isDoorOpen 
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
              : 'bg-slate-950/85 border-white/[0.08] text-slate-300'
          )}>
            <motion.div 
              animate={{ rotate: isDoorOpen ? -15 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'p-1.5 rounded-lg shrink-0 transition-colors border',
                isDoorOpen ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-white/5'
              )}
            >
              {isDoorOpen ? <DoorOpen className="h-4 w-4" /> : <DoorClosed className="h-4 w-4" />}
            </motion.div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate font-mono">Pintu Fisik</div>
              <div className={cn('text-[11px] sm:text-xs font-bold truncate font-mono', isDoorOpen ? 'text-amber-300' : 'text-slate-200')}>
                {room.doorStatus}
              </div>
            </div>
          </div>

          {/* Solenoid Lock State */}
          <div className={cn(
            'p-2.5 sm:p-3 rounded-xl border flex items-center gap-2 sm:gap-2.5 transition-all shadow-inner',
            !isLocked 
              ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.15)]' 
              : 'bg-slate-950/85 border-white/[0.08] text-slate-300'
          )}>
            <motion.div
              animate={{ rotate: isLocked ? 0 : -20, scale: isLocked ? 1 : 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'p-1.5 rounded-lg shrink-0 transition-colors border',
                !isLocked ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-slate-800 text-slate-400 border-white/5'
              )}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-sky-400" />}
            </motion.div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider truncate font-mono">Solenoid 12V</div>
              <div className={cn('text-[11px] sm:text-xs font-bold truncate font-mono', !isLocked ? 'text-sky-300' : 'text-emerald-400')}>
                {room.lockStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center justify-between py-2 border-t border-white/[0.08] text-[10px] sm:text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Akses Hari Ini: <strong className="text-white font-mono font-bold"><AnimatedCounter value={room.todayAccessCount} duration={0.8} /></strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Fingerprint className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate">FP Slot: <strong className="text-white font-mono font-bold">{room.usedFingerprints}/{room.fingerprintCapacity}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 mt-2 sm:pt-3.5 sm:mt-3 border-t border-white/[0.08]">
        <Button
          variant="secondary"
          size="sm"
          className="w-full group/btn justify-between cursor-pointer"
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
          <span className="truncate font-semibold">
            {currentUser?.role === 'user' ? 'Lihat Riwayat & Status Saya' : 'Masuk Dashboard Kontrol'}
          </span>
        </Button>
      </div>

    </GlowCard>
  );
};
export const RoomCard = React.memo(RoomCardComponent);


