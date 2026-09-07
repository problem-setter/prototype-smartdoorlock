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

export const HardwarePanel: React.FC<HardwarePanelProps> = ({ room }) => {
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
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" staggerDelay={0.08}>
        
        {/* ESP32 Controller Card */}
        <StaggerItem>
          <SpotlightCard className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3" spotlightColor="rgba(59, 130, 246, 0.06)">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">ESP32-WROOM-32</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">{room.deviceId}</p>
              </div>
            </div>
            <Badge variant={isOnline ? 'online' : 'offline'} icon={isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} className="font-mono shrink-0">
              {room.deviceStatus}
            </Badge>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>IP Address:</span>
              <span className="text-slate-200">{room.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span>Protocol:</span>
              <span className="text-cyan-400">MQTT QoS 1</span>
            </div>
            <div className="flex justify-between">
              <span>Topic:</span>
              <span className="text-slate-300 truncate max-w-[150px]">{room.mqttTopicPrefix}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              {pingStatus ? (
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  pingStatus.startsWith('ACK') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                }`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {pingStatus}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono truncate block">ESP32 Diagnostics</span>
              )}
            </div>

            <Tooltip content="Kirim perintah diagnostic ping via broker MQTT">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePing}
                isLoading={isPinging}
                className="h-6 text-[10px] px-2 py-0 shrink-0"
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
          <SpotlightCard className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3" spotlightColor="rgba(168, 85, 247, 0.06)">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Sensor AS608</h4>
                  <p className="text-[10px] text-slate-400 truncate">Biometric Optical</p>
                </div>
              </div>
              <Badge variant="purple" className="font-mono shrink-0">READY</Badge>
            </div>

          <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Kapasitas FP:</span>
              <span className="text-slate-200">{room.usedFingerprints} / {room.fingerprintCapacity}</span>
            </div>
            <div className="flex justify-between">
              <span>Penyimpanan:</span>
              <span className="text-purple-400">Flash Internal</span>
            </div>
            <div className="flex justify-between">
              <span>Match Speed:</span>
              <span className="text-emerald-400">&lt; 0.8 detik</span>
            </div>
          </div>
          </SpotlightCard>
        </StaggerItem>

        {/* Actuator & Sensor States (MC-38 & Solenoid 12V) */}
        <StaggerItem>
          <SpotlightCard className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 sm:col-span-2 lg:col-span-1" spotlightColor="rgba(245, 158, 11, 0.06)">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
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

          <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Kunci Solenoid:</span>
              <span className={isLocked ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
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
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-xl shadow-rose-950/40"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white animate-pulse shrink-0 mt-0.5 sm:mt-0 shadow-[0_0_22px_rgba(244,63,94,0.7)] border border-rose-400/50">
                <AlertOctagon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-rose-300">
                  PERINGATAN: Door Open Timeout Alarm Aktif!
                </div>
                <p className="text-[11px] sm:text-xs text-rose-200/80 leading-relaxed mt-0.5">
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
                className="w-full sm:w-auto whitespace-nowrap shadow-lg shadow-rose-600/30"
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
