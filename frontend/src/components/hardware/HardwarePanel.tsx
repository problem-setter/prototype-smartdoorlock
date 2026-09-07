import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room } from '../../types';
import { useApp } from '@/context';
import { 
  Cpu, 
  Fingerprint, 
  Zap, 
  Wifi, 
  WifiOff, 
  AlertOctagon,
  VolumeX,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { SpotlightCard } from '@/components/animations/spotlight-card';
import { StaggerContainer, StaggerItem } from '@/components/animations/fade-in';


interface HardwarePanelProps {
  room: Room;
}

const HardwarePanelComponent: React.FC<HardwarePanelProps> = ({ room }) => {
  const { currentUser, clearAlarm, pingDevice } = useApp();
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const isLocked = room.lockStatus === 'LOCKED';
  const isDoorOpen = room.doorStatus === 'OPEN';
  const isRelayOn = room.relayStatus === 'ON';
  const isOnline = room.deviceStatus === 'ONLINE';

  const handlePing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingStatus(null);
    const ok = await pingDevice(room.id);
    setIsPinging(false);
    setPingStatus(ok ? 'ACK: 12ms (Sehat)' : 'Timeout (Offline)');
    setTimeout(() => setPingStatus(null), 3500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Hardware Overview Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4" staggerDelay={0.08}>
        
        {/* ESP32 Controller Card */}
        <StaggerItem>
          <SpotlightCard className="p-3.5 sm:p-4 space-y-3" spotlightColor="rgba(56, 189, 248, 0.1)">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/25 shrink-0 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
                  <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">ESP32-WROOM-32</h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{room.deviceId}</p>
                </div>
              </div>
              <Badge variant={isOnline ? 'online' : 'offline'} icon={isOnline ? <Wifi className="h-3 w-3 shrink-0 text-emerald-400" /> : <WifiOff className="h-3 w-3 shrink-0 text-rose-400" />} className="font-mono shrink-0">
                {room.deviceStatus}
              </Badge>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>IP Address:</span>
                <span className="text-white font-semibold">{room.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Device ID:</span>
                <span className="text-sky-400 font-semibold">{room.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span>Channel Node:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{room.code}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <div className="min-w-0" aria-live="polite">
                {pingStatus ? (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    pingStatus.startsWith('ACK') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  }`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {pingStatus}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono truncate block">ESP32 Heartbeat Telemetry</span>
                )}
              </div>

              <Tooltip content="Kirim perintah diagnostic ping ke node perangkat">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePing}
                  isLoading={isPinging}
                  aria-label="Kirim diagnostic ping ke perangkat node ESP32"
                  className="h-6 text-[10px] px-2.5 py-0 shrink-0 cursor-pointer"
                  leftIcon={!isPinging ? <Radio className="h-3 w-3 text-sky-400" /> : undefined}
                >
                  {isPinging ? 'Pinging...' : 'Ping Node'}
                </Button>
              </Tooltip>
            </div>
          </SpotlightCard>
        </StaggerItem>

        {/* AS608 Fingerprint Sensor Card */}
        <StaggerItem>
          <SpotlightCard className="p-3.5 sm:p-4 space-y-3" spotlightColor="rgba(168, 85, 247, 0.1)">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/25 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                  <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Sensor AS608</h4>
                  <p className="text-[10px] text-slate-400 truncate">Biometric Optical</p>
                </div>
              </div>
              <Badge variant="purple" className="font-mono shrink-0">READY</Badge>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Kapasitas FP:</span>
                <span className="text-white font-semibold">{room.usedFingerprints} / {room.fingerprintCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span>Penyimpanan:</span>
                <span className="text-purple-300 font-semibold">Flash Internal</span>
              </div>
              <div className="flex justify-between">
                <span>Match Speed:</span>
                <span className="text-emerald-400 font-semibold">&lt; 0.8 detik</span>
              </div>
            </div>
          </SpotlightCard>
        </StaggerItem>

        {/* Actuator & Sensor States (MC-38 & Solenoid 12V) */}
        <StaggerItem>
          <SpotlightCard className="p-3.5 sm:p-4 space-y-3 sm:col-span-2 lg:col-span-1" spotlightColor="rgba(245, 158, 11, 0.1)">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Relay & Solenoid 12V</h4>
                  <p className="text-[10px] text-slate-400 truncate">Actuator & MC-38</p>
                </div>
              </div>
              <Badge variant={isRelayOn ? 'warning' : 'default'} className="font-mono shrink-0">
                RELAY: {room.relayStatus}
              </Badge>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Kunci Solenoid:</span>
                <span className={isLocked ? 'text-emerald-400 font-bold' : 'text-sky-400 font-bold'}>
                  {room.lockStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sensor MC-38:</span>
                <span className={isDoorOpen ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                  {room.doorStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Open Timeout:</span>
                <span className="text-slate-300">{room.openDurationSeconds}s / {room.maxOpenThresholdSeconds}s</span>
              </div>
            </div>
          </SpotlightCard>
        </StaggerItem>

      </StaggerContainer>

      {/* Alarm Status Banner (If Active) with Smooth Spring Entrance */}
      <AnimatePresence>
        {room.isAlarmActive && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-2xl shadow-rose-950/60 backdrop-blur-xl"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white animate-pulse shrink-0 mt-0.5 sm:mt-0 shadow-[0_0_22px_rgba(244,63,94,0.7)] border border-rose-400/50">
                <AlertOctagon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-rose-200">
                  PERINGATAN: Door Open Timeout Alarm Aktif!
                </div>
                <p className="text-[11px] sm:text-xs text-rose-300/80 leading-relaxed mt-0.5">
                  Pintu fisik terdeteksi OPEN selama {room.openDurationSeconds}s (Maks: {room.maxOpenThresholdSeconds}s). Active Buzzer berbunyi di ruangan.
                </p>
              </div>
            </div>

            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearAlarm(room.id)}
                leftIcon={<VolumeX className="h-4 w-4 shrink-0" />}
                className="w-full sm:w-auto whitespace-nowrap shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Matikan Alarm & Buzzer
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export const HardwarePanel = React.memo(HardwarePanelComponent);

