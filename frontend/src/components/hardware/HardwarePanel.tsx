import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, MQTTMessage } from '@/types';
import { useApp } from '@/context';
import { hardwareService } from '@/services/hardwareService';
import {
  Cpu,
  Fingerprint,
  Zap,
  AlertOctagon,
  VolumeX,
  Radio,
  Terminal,
  Trash2,
  ArrowRight,
  Activity,
  DoorClosed,
  DoorOpen,
  Lock,
  Unlock,
  AlertTriangle,
  MapPin,
  Play,
  Pause,
  Copy,
  Check,
  Usb,
  Wifi,
  WifiOff,
  Settings2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  Search,
  KeyRound,
  UserPlus,
  LayoutGrid,
  List,
  Layers,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaggerContainer, StaggerItem } from '@/components/animations/fade-in';
import { NumberTicker } from '@/components/animations/number-ticker';
import { HardwareSchematic } from '@/components/hardware/HardwareSchematic';
import { FingerprintEnrollModal } from '@/components/hardware/FingerprintEnrollModal';
import { cn } from '@/lib/utils';
import { gsap, useGSAP } from '@/lib/gsap';

export interface HardwarePanelProps {
  room?: Room;
}

const PayloadViewer: React.FC<{ payload: unknown }> = ({ payload }) => {
  const formatted = useMemo(() => {
    if (typeof payload === 'object' && payload !== null) {
      return JSON.stringify(payload, null, 2);
    }
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return payload;
      }
    }
    return String(payload);
  }, [payload]);

  return (
    <pre className="text-[11px] leading-relaxed font-mono text-[#d1d5db] bg-[#0c0f1d] py-1.5 px-2.5 rounded border border-[#1e293b] overflow-x-auto whitespace-pre-wrap break-all max-h-40">
      {formatted}
    </pre>
  );
};

interface MqttMessageRowProps {
  msg: MQTTMessage;
  copiedMsgId: string | null;
  onCopyPayload: (id: string, payload: unknown) => void;
}

const MqttMessageRow: React.FC<MqttMessageRowProps> = ({
  msg,
  copiedMsgId,
  onCopyPayload,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isIncoming = msg.direction === 'INCOMING';
  const isCopied = copiedMsgId === msg.id;

  useGSAP(
    () => {
      if (rowRef.current) {
        gsap.fromTo(
          rowRef.current,
          {
            backgroundColor: isIncoming
              ? 'rgba(26, 174, 57, 0.28)'
              : 'rgba(86, 69, 212, 0.32)',
          },
          {
            backgroundColor: '#0f1424',
            duration: 0.8,
            ease: 'power2.out',
          }
        );
      }
    },
    { scope: rowRef, dependencies: [msg.id] }
  );

  return (
    <div
      ref={rowRef}
      className="p-2.5 rounded-md bg-[#0f1424] border border-[#1e293b] text-[11px] space-y-1.5 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={cn(
              'px-1.5 py-0.2 rounded text-[10.5px] font-mono font-bold shrink-0',
              isIncoming
                ? 'bg-[#1aae39]/20 text-[#86efac] border border-[#1aae39]/30'
                : 'bg-[#5645d4]/30 text-[#d6b6f6] border border-[#5645d4]/40'
            )}
          >
            {msg.direction}
          </span>
          <span className="text-white font-medium truncate min-w-0 flex-1" title={msg.topic}>
            {msg.topic}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#9ca3af] text-[10.5px] font-mono">
            {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <button
            type="button"
            onClick={() => onCopyPayload(msg.id, msg.payload)}
            className={cn(
              'p-1 px-1.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#86efac]',
              isCopied
                ? 'bg-[#1aae39]/20 text-[#86efac]'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e293b]'
            )}
            title="Salin JSON Payload"
            aria-label="Salin JSON Payload"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 shrink-0 text-[#86efac]" />
                <span className="text-[10px] font-medium">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 shrink-0" />
                <span className="text-[10px] hidden sm:inline">Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      <PayloadViewer payload={msg.payload} />
    </div>
  );
};

// ============================================================================
// COMPACT ROOM HARDWARE SUMMARY CARD COMPONENT (Notion Design & Micro-Matrix)
// ============================================================================
interface RoomHardwareCardProps {
  room: Room;
  isFocusedOnSchematic: boolean;
  isPulsing: boolean;
  canManage: boolean;
  onFocusSchematic: (roomId: string) => void;
  onTestPulseUnlock: (roomId: string) => void;
  onOpenEnrollment: (room: Room) => void;
  onClearAlarm: (roomId: string) => void;
  onSelectDetail: (roomId: string) => void;
}

const RoomHardwareCard: React.FC<RoomHardwareCardProps> = ({
  room: r,
  isFocusedOnSchematic,
  isPulsing,
  canManage,
  onFocusSchematic,
  onTestPulseUnlock,
  onOpenEnrollment,
  onClearAlarm,
  onSelectDetail,
}) => {
  const isOnline = r.deviceStatus === 'ONLINE';
  const isLocked = r.lockStatus === 'LOCKED';
  const isDoorOpen = r.doorStatus === 'OPEN';
  const usedFp = r.usedFingerprints ?? 0;
  const capacityFp = 120;
  const fpPercent = Math.min(100, Math.round((usedFp / capacityFp) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white border rounded-xl p-3.5 sm:p-4 shadow-notion-1 flex flex-col justify-between space-y-3.5 transition-all relative group',
        r.isAlarmActive
          ? 'border-[#fadad9] bg-[#fffbfb] ring-2 ring-[#e03131]/20'
          : isFocusedOnSchematic
          ? 'border-[#5645d4] ring-2 ring-[#5645d4]/20 shadow-notion-2 bg-gradient-to-b from-white to-[#fcfaff]'
          : 'border-[#e5e3df] hover:border-[#c8c4be] hover:shadow-notion-2'
      )}
    >
      {/* Header: Room Title, Code Badge, Location & Node Status */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[13px] sm:text-sm text-[#1a1a1a] group-hover:text-[#5645d4] transition-colors truncate tracking-tight">
                {r.name}
              </h4>
              <span className="font-mono text-[10.5px] font-semibold text-[#5645d4] bg-[#e6e0f5] border border-[#d6b6f6] px-2 py-0.5 rounded-md shrink-0">
                {r.deviceId}
              </span>
              {isFocusedOnSchematic && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#5645d4] bg-[#e6e0f5] border border-[#d6b6f6] px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5645d4] animate-pulse" />
                  Skema Aktif
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#5d5b54] font-mono mt-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0 text-[#a4a097]" aria-hidden="true" />
              <span className="truncate">{r.description || 'Ruangan Laboratorium'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {r.isAlarmActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#fdf2f2] text-[#e03131] border border-[#fadad9] shrink-0 animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                ALARM
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border font-mono shrink-0',
                isOnline
                  ? 'bg-[#eefbf1] text-[#1aae39] border-[#d2f4d9]'
                  : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isOnline ? 'bg-[#1aae39] animate-pulse' : 'bg-[#e03131]'
                )}
              />
              {isOnline ? 'Terhubung' : 'Terputus'}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Cell Telemetry Matrix (Clean & Human-Centric) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
        {/* Cell 1: Node & Jaringan */}
        <div className="p-2.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="flex items-center gap-1.5 truncate font-semibold text-[#1a1a1a]">
              <div className="p-1 rounded bg-[#e6e0f5] text-[#5645d4] shrink-0">
                <Cpu className="h-3 w-3" />
              </div>
              Node Jaringan
            </span>
            <span className="text-[10px] text-[#5d5b54] font-mono font-medium px-1.5 py-0.5 bg-white border border-[#e5e3df] rounded truncate">
              {isOnline ? 'MQTT Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-[#5d5b54]">
            <span>Device ID:</span>
            <span className="font-semibold font-mono text-[#1a1a1a] truncate" title={r.deviceId}>{r.deviceId}</span>
          </div>
        </div>

        {/* Cell 2: Kunci Pintu (Solenoid) */}
        <div className="p-2.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="flex items-center gap-1.5 truncate font-semibold text-[#1a1a1a]">
              <div className={cn("p-1 rounded shrink-0", isLocked ? "bg-[#d9f3e1] text-[#1aae39]" : "bg-[#ffe8d4] text-[#dd5b00]")}>
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </div>
              Kunci Solenoid
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 font-mono',
                isLocked
                  ? 'bg-[#d9f3e1] text-[#1aae39] border border-[#d2f4d9]'
                  : 'bg-[#ffe8d4] text-[#dd5b00] border border-[#fbd6b8]'
              )}
            >
              {isLocked ? 'Terkunci' : 'Terbuka'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-[#5d5b54]">
            <span>Status Kunci:</span>
            <span className={cn('font-semibold font-mono', isLocked ? 'text-[#1aae39]' : 'text-[#dd5b00]')}>
              {isLocked ? 'Aman' : 'Terbuka'}
            </span>
          </div>
        </div>

        {/* Cell 3: Sensor Pintu */}
        <div className="p-2.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="flex items-center gap-1.5 truncate font-semibold text-[#1a1a1a]">
              <div className={cn("p-1 rounded shrink-0", isDoorOpen ? "bg-[#ffe8d4] text-[#dd5b00]" : "bg-[#dcecfa] text-[#0075de]")}>
                {isDoorOpen ? <DoorOpen className="h-3 w-3" /> : <DoorClosed className="h-3 w-3" />}
              </div>
              Sensor Pintu
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 font-mono',
                isDoorOpen
                  ? 'bg-[#ffe8d4] text-[#dd5b00] border border-[#fbd6b8]'
                  : 'bg-[#dcecfa] text-[#0075de] border border-[#bde0fe]'
              )}
            >
              {isDoorOpen ? 'Terbuka' : 'Rapat'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-[#5d5b54]">
            <span>Durasi:</span>
            <span className={cn('font-semibold font-mono', isDoorOpen ? 'text-[#dd5b00]' : 'text-[#37352f]')}>
              {isDoorOpen ? `${r.openDurationSeconds}s / 15s` : 'Rapat'}
            </span>
          </div>
        </div>

        {/* Cell 4: Biometrik Sidik Jari */}
        <div className="p-2.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="flex items-center gap-1.5 truncate font-semibold text-[#1a1a1a]">
              <div className="p-1 rounded bg-[#e6e0f5] text-[#5645d4] shrink-0">
                <Fingerprint className="h-3 w-3" />
              </div>
              Sidik Jari
            </span>
            <span className="font-mono text-[10px] font-semibold text-[#5645d4] bg-[#e6e0f5] border border-[#d6b6f6] px-1.5 py-0.5 rounded">
              {fpPercent}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-[#5d5b54]">
            <span>Slot Terdaftar:</span>
            <span className="font-semibold text-[#1a1a1a] font-mono">
              {usedFp} <span className="text-[#a4a097]">/</span> {capacityFp} Slot
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="pt-2.5 border-t border-[#e5e3df] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {canManage && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onTestPulseUnlock(r.id)}
                isLoading={isPulsing}
                disabled={!isOnline}
                leftIcon={<KeyRound className="h-3 w-3 text-[#5645d4]" />}
                className="h-7 text-[11px] px-2.5 font-medium cursor-pointer"
                title="Buka solenoid relay selama 5 detik"
              >
                Uji Buka 5s
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenEnrollment(r)}
                disabled={!isOnline}
                leftIcon={<UserPlus className="h-3 w-3 text-[#5645d4]" />}
                className="h-7 text-[11px] px-2.5 font-medium cursor-pointer"
                title="Daftarkan template sidik jari baru pada ruangan ini"
              >
                Daftar Sidik Jari
              </Button>

              {r.isAlarmActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onClearAlarm(r.id)}
                  leftIcon={<VolumeX className="h-3 w-3" />}
                  className="h-7 text-[11px] px-2.5 font-semibold cursor-pointer"
                >
                  Matikan Buzzer
                </Button>
              )}
            </>
          )}

          <Button
            variant={isFocusedOnSchematic ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => onFocusSchematic(r.id)}
            leftIcon={<Layers className="h-3 w-3 text-[#5645d4]" />}
            className={cn(
              'h-7 text-[11px] px-2.5 font-medium cursor-pointer',
              isFocusedOnSchematic
                ? 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6] shadow-xs'
                : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#fafaf9]'
            )}
            title="Tampilkan pinout dan status real-time ruangan ini pada skematik interaktif"
          >
            {isFocusedOnSchematic ? 'Skema Aktif' : 'Fokus Skema'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => onSelectDetail(r.id)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5645d4] hover:text-[#4534b3] transition-colors cursor-pointer ml-auto font-sans group/btn"
        >
          <span>Detail Ruangan</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// DETAILED LIST VIEW TABLE (Alternative compact view mode)
// ============================================================================
interface RoomHardwareListTableProps {
  rooms: Room[];
  focusedSchematicRoomId: string;
  pulsingRoomId: string | null;
  canManage: boolean;
  onFocusSchematic: (roomId: string) => void;
  onTestPulseUnlock: (roomId: string) => void;
  onOpenEnrollment: (room: Room) => void;
  onClearAlarm: (roomId: string) => void;
  onSelectDetail: (roomId: string) => void;
}

const RoomHardwareListTable: React.FC<RoomHardwareListTableProps> = ({
  rooms,
  focusedSchematicRoomId,
  pulsingRoomId,
  canManage,
  onFocusSchematic,
  onTestPulseUnlock,
  onOpenEnrollment,
  onClearAlarm,
  onSelectDetail,
}) => {
  return (
    <div className="overflow-x-auto border border-[#e5e3df] rounded-xl bg-white shadow-notion-1">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#fafaf9] border-b border-[#e5e3df] text-[#5d5b54] text-[10.5px] font-semibold uppercase tracking-wider">
          <tr>
            <th className="py-3 px-3.5">Ruangan &amp; Lokasi</th>
            <th className="py-3 px-3.5">Status Node</th>
            <th className="py-3 px-3.5">Solenoid 12V</th>
            <th className="py-3 px-3.5">Pintu MC-38</th>
            <th className="py-3 px-3.5">DY50 Sidik Jari</th>
            <th className="py-3 px-3.5">Buzzer Alarm</th>
            <th className="py-3 px-3.5 text-right">Aksi Cepat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e3df]">
          {rooms.map((r) => {
            const isOnline = r.deviceStatus === 'ONLINE';
            const isLocked = r.lockStatus === 'LOCKED';
            const isDoorOpen = r.doorStatus === 'OPEN';
            const isFocused = focusedSchematicRoomId === r.id;
            const isPulsing = pulsingRoomId === r.id;
            const usedFp = r.usedFingerprints ?? 0;
            const capacityFp = 120;
            const fpPercent = Math.min(100, Math.round((usedFp / capacityFp) * 100));

            return (
              <tr
                key={r.id}
                className={cn(
                  'hover:bg-[#fafaf9]/80 transition-colors group',
                  isFocused && 'bg-[#fcfaff]'
                )}
              >
                {/* Room & Location */}
                <td className="py-3 px-3.5 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#1a1a1a] group-hover:text-[#5645d4] transition-colors">
                      {r.name}
                    </span>
                    <span className="font-mono text-[10.5px] font-semibold text-[#5645d4] bg-[#e6e0f5] border border-[#d6b6f6] px-1.5 py-0.2 rounded">
                      {r.deviceId}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5d5b54] font-mono mt-0.5 truncate flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-[#a4a097] shrink-0" />
                    <span>{r.description || 'Ruangan Laboratorium'}</span>
                    <span className="text-[#a4a097]">•</span>
                    <span className="text-[#787671]">{isOnline ? 'MQTT Online' : 'Offline'}</span>
                  </div>
                </td>

                {/* Node Status */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border font-mono',
                      isOnline
                        ? 'bg-[#eefbf1] text-[#1aae39] border-[#d2f4d9]'
                        : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isOnline ? 'bg-[#1aae39] animate-pulse' : 'bg-[#e03131]'
                      )}
                    />
                    {isOnline ? 'Terhubung' : 'Terputus'}
                  </span>
                </td>

                {/* Solenoid 12V */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold',
                        isLocked
                          ? 'bg-[#d9f3e1] text-[#1aae39] border border-[#d2f4d9]'
                          : 'bg-[#ffe8d4] text-[#dd5b00] border border-[#fbd6b8]'
                      )}
                    >
                      {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      {isLocked ? 'Terkunci' : 'Terbuka'}
                    </span>
                    <span className="text-[10px] text-[#787671] font-mono">
                      (GPIO5: {r.relayStatus})
                    </span>
                  </div>
                </td>

                {/* Door MC-38 */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold',
                        isDoorOpen
                          ? 'bg-[#ffe8d4] text-[#dd5b00] border border-[#fbd6b8]'
                          : 'bg-[#dcecfa] text-[#0075de] border border-[#bde0fe]'
                      )}
                    >
                      {isDoorOpen ? <DoorOpen className="h-3 w-3" /> : <DoorClosed className="h-3 w-3" />}
                      {isDoorOpen ? 'Terbuka' : 'Rapat'}
                    </span>
                    <span className="text-[#5d5b54] text-[10.5px]">
                      {r.openDurationSeconds}s/15s
                    </span>
                  </div>
                </td>

                {/* DY50 Fingerprint */}
                <td className="py-3 px-3.5 whitespace-nowrap min-w-[130px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#1a1a1a] font-medium">{usedFp}/{capacityFp} Slot</span>
                      <span className="text-[#5645d4] font-semibold">{fpPercent}%</span>
                    </div>
                    <div className="w-full bg-[#e5e3df] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#5645d4] h-full rounded-full transition-all duration-300"
                        style={{ width: `${fpPercent}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Buzzer Alarm */}
                <td className="py-3 px-3.5 whitespace-nowrap">
                  {r.isAlarmActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#fdf2f2] text-[#e03131] border border-[#fadad9] animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      ALARM ON
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[#5d5b54] bg-[#fafaf9] px-2 py-0.5 rounded border border-[#e5e3df]">
                      Normal
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {canManage && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onTestPulseUnlock(r.id)}
                          isLoading={isPulsing}
                          disabled={!isOnline}
                          className="h-7 text-[11px] px-2.5 font-medium cursor-pointer"
                          title="Buka solenoid 5 detik"
                        >
                          Uji 5s
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenEnrollment(r)}
                          disabled={!isOnline}
                          className="h-7 text-[11px] px-2.5 font-medium cursor-pointer"
                          title="Daftarkan sidik jari"
                        >
                          Daftar Sidik Jari
                        </Button>

                        {r.isAlarmActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onClearAlarm(r.id)}
                            className="h-7 text-[11px] px-2.5 font-semibold cursor-pointer"
                          >
                            Matikan
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      variant={isFocused ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => onFocusSchematic(r.id)}
                      className={cn(
                        'h-7 text-[11px] px-2.5 font-medium cursor-pointer',
                        isFocused && 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]'
                      )}
                      title="Tampilkan pada skematik"
                    >
                      {isFocused ? 'Skema Aktif' : 'Skema'}
                    </Button>

                    <button
                      type="button"
                      onClick={() => onSelectDetail(r.id)}
                      className="p-1.5 text-[#5645d4] hover:text-[#4534b3] hover:bg-[#e6e0f5] rounded-md transition-colors cursor-pointer"
                      title="Lihat Detail Telemetri"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// PRIMARY HARDWARE PANEL COMPONENT
// ============================================================================
const HardwarePanelComponent: React.FC<HardwarePanelProps> = ({ room }) => {
  const {
    currentUser,
    rooms,
    mqttMessages,
    clearAlarm,
    clearMqttLogs,
    setSelectedRoomId,
    connectionState,
    connectMqtt,
    disconnectMqtt,
    connectSerial,
    disconnectSerial,
    triggerRemoteUnlock,
  } = useApp();

  // Developer Log & Transport Filters
  const [mqttFilter, setMqttFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [topicSubFilter, setTopicSubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [frozenMessages, setFrozenMessages] = useState<typeof mqttMessages | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showTransportConfig, setShowTransportConfig] = useState(false);
  const [brokerUrlInput, setBrokerUrlInput] = useState(connectionState.mqttBroker || 'wss://broker.emqx.io:8084/mqtt');
  const [isSerialConnecting, setIsSerialConnecting] = useState(false);
  const [pulsingRoomId, setPulsingRoomId] = useState<string | null>(null);

  // Room Summary Cards Toolbar State
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<
    'ALL' | 'ONLINE' | 'OFFLINE' | 'DOOR_OPEN' | 'ALARM' | 'LOCKED' | 'UNLOCKED'
  >('ALL');
  const [roomViewMode, setRoomViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [focusedSchematicRoomId, setFocusedSchematicRoomId] = useState<string>('ALL');

  // Biometric Enrollment Modal State
  const [enrollTargetRoom, setEnrollTargetRoom] = useState<Room | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const toggleStreamPause = () => {
    if (!isStreamPaused) {
      setFrozenMessages([...mqttMessages]);
      setIsStreamPaused(true);
    } else {
      setFrozenMessages(null);
      setIsStreamPaused(false);
    }
  };

  const handleCopyPayload = (id: string, payload: unknown) => {
    const text = typeof payload === 'object' && payload !== null
      ? JSON.stringify(payload, null, 2)
      : String(payload);
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => {
      setCopiedMsgId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleExportMqttLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mqttMessages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mqtt_packet_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleToggleSerial = async () => {
    if (connectionState.serialConnected) {
      await disconnectSerial();
    } else {
      setIsSerialConnecting(true);
      try {
        await connectSerial(115200);
      } finally {
        setIsSerialConnecting(false);
      }
    }
  };

  const handleToggleMqtt = () => {
    if (connectionState.mqttConnected || connectionState.mqttConnecting) {
      disconnectMqtt();
    } else {
      connectMqtt(brokerUrlInput);
    }
  };

  const handleTestPulseUnlock = async (roomId: string) => {
    try {
      setPulsingRoomId(roomId);
      await triggerRemoteUnlock(roomId);
    } finally {
      setTimeout(() => {
        setPulsingRoomId(null);
      }, 1500);
    }
  };

  const handleOpenEnrollment = (r: Room) => {
    setEnrollTargetRoom(r);
    setIsEnrollModalOpen(true);
  };

  const handleFocusSchematic = (roomId: string) => {
    setFocusedSchematicRoomId((prev) => (prev === roomId ? 'ALL' : roomId));
  };

  // Filtered Rooms for Summary Cards Grid / Table
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Status Filter
      if (roomStatusFilter === 'ONLINE' && r.deviceStatus !== 'ONLINE') return false;
      if (roomStatusFilter === 'OFFLINE' && r.deviceStatus !== 'OFFLINE') return false;
      if (roomStatusFilter === 'DOOR_OPEN' && r.doorStatus !== 'OPEN') return false;
      if (roomStatusFilter === 'ALARM' && !r.isAlarmActive) return false;
      if (roomStatusFilter === 'LOCKED' && r.lockStatus !== 'LOCKED') return false;
      if (roomStatusFilter === 'UNLOCKED' && r.lockStatus !== 'UNLOCKED') return false;

      // Search Query
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchDevice = r.deviceId.toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchName && !matchDevice && !matchDesc) return false;
      }

      return true;
    });
  }, [rooms, roomStatusFilter, roomSearchQuery]);

  const focusedRoom = useMemo(() => {
    if (focusedSchematicRoomId === 'ALL') return null;
    return rooms.find((r) => r.id === focusedSchematicRoomId) || null;
  }, [rooms, focusedSchematicRoomId]);

  const renderConnectionBadge = useCallback(() => {
    if (connectionState.mqttConnected && connectionState.serialConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eefbf1] text-[#1aae39] border border-[#d2f4d9] text-[11px] font-medium shrink-0 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39] animate-pulse shrink-0" />
          Terhubung (Dual)
        </span>
      );
    }
    if (connectionState.mqttConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eefbf1] text-[#1aae39] border border-[#d2f4d9] text-[11px] font-medium shrink-0 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39] animate-pulse shrink-0" />
          Terhubung
        </span>
      );
    }
    if (connectionState.serialConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] text-[11px] font-medium shrink-0 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5645d4] animate-pulse shrink-0" />
          Terhubung (USB)
        </span>
      );
    }
    if (connectionState.mqttConnecting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fdf3eb] text-[#dd5b00] border border-[#fbd6b8] text-[11px] font-medium shrink-0 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dd5b00] animate-ping shrink-0" />
          Menghubungkan...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fafaf9] text-[#5d5b54] border border-[#e5e3df] text-[11px] font-medium shrink-0 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#a4a097] shrink-0" />
        Terputus
      </span>
    );
  }, [connectionState]);

  const renderTransportControls = () => {
    const isSerialSupported = hardwareService.isSerialSupported();

    return (
      <div className="bg-white border border-[#e5e3df] rounded-xl shadow-notion-1 overflow-hidden space-y-0">
        <div className="p-2.5 sm:p-3.5 border-b border-[#e5e3df] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] flex items-center justify-center shrink-0">
              <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-tight truncate">
                Koneksi &amp; Dual-Transport
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTransportConfig(!showTransportConfig)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[#37352f] hover:text-[#1a1a1a] hover:bg-[#fafaf9] transition-colors cursor-pointer border border-[#e5e3df] shadow-2xs"
            title="Pengaturan Broker"
          >
            <Settings2 className="h-3.5 w-3.5 shrink-0 text-[#5645d4]" />
            <span className="hidden sm:inline">Konfigurasi</span>
            {showTransportConfig ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
          </button>
        </div>

        {/* Transport Config Drawer */}
        <AnimatePresence>
          {showTransportConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 sm:p-3.5 bg-[#fafaf9] border-b border-[#e5e3df] space-y-2 overflow-hidden text-xs"
            >
              <label className="block text-[11px] font-semibold text-[#1a1a1a]">
                URL Broker MQTT WebSocket:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={brokerUrlInput}
                  onChange={(e) => setBrokerUrlInput(e.target.value)}
                  placeholder="wss://broker.emqx.io:8084/mqtt"
                  className="flex-1 px-3 py-1.5 rounded-md border border-[#e5e3df] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => connectMqtt(brokerUrlInput)}
                  className="h-8 text-xs cursor-pointer shrink-0 font-medium"
                >
                  Hubungkan
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dual Transport Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e3df]">
          {/* Transport 1: MQTT WebSocket */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={cn(
                'w-8 h-8 aspect-square rounded-lg border flex items-center justify-center shrink-0',
                connectionState.mqttConnected ? 'bg-[#eefbf1] text-[#1aae39] border-[#d2f4d9]' : 'bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df]'
              )}>
                {connectionState.mqttConnected ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#1a1a1a] truncate">MQTT WebSocket</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border shrink-0',
                    connectionState.mqttConnected
                      ? 'bg-[#eefbf1] text-[#1aae39] border-[#d2f4d9]'
                      : connectionState.mqttConnecting
                      ? 'bg-[#fdf3eb] text-[#dd5b00] border-[#fbd6b8]'
                      : 'bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df]'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', connectionState.mqttConnected ? 'bg-[#1aae39]' : connectionState.mqttConnecting ? 'bg-[#dd5b00] animate-ping' : 'bg-[#a4a097]')} />
                    {connectionState.mqttConnected ? 'Terhubung' : connectionState.mqttConnecting ? 'Menghubungkan' : 'Terputus'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#787671] truncate" title={connectionState.mqttBroker}>
                  {connectionState.mqttBroker.replace('wss://', '').replace('/mqtt', '')}
                </div>
              </div>
            </div>

            <Button
              variant={connectionState.mqttConnected ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleMqtt}
              isLoading={connectionState.mqttConnecting}
              leftIcon={connectionState.mqttConnected ? <WifiOff className="h-3 w-3 shrink-0" /> : <Wifi className="h-3 w-3 shrink-0" />}
              className="h-7.5 text-xs px-2.5 cursor-pointer shrink-0 font-medium"
            >
              {connectionState.mqttConnected ? 'Putuskan' : 'Hubungkan'}
            </Button>
          </div>

          {/* Transport 2: Web Serial USB */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={cn(
                'w-8 h-8 aspect-square rounded-lg border flex items-center justify-center shrink-0',
                connectionState.serialConnected ? 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]' : 'bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df]'
              )}>
                <Usb className="h-4 w-4 shrink-0" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#1a1a1a] truncate">Web Serial (USB)</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border shrink-0',
                    connectionState.serialConnected
                      ? 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]'
                      : !isSerialSupported
                      ? 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                      : 'bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df]'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', connectionState.serialConnected ? 'bg-[#5645d4]' : !isSerialSupported ? 'bg-[#e03131]' : 'bg-[#a4a097]')} />
                    {connectionState.serialConnected ? '115200 bps' : !isSerialSupported ? 'Tidak Didukung' : 'Siap'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#787671] truncate">
                  {connectionState.serialConnected ? (connectionState.serialPortName || 'ESP32 Serial') : 'Kabel USB / Serial'}
                </div>
              </div>
            </div>

            <Button
              variant={connectionState.serialConnected ? 'outline' : 'secondary'}
              size="sm"
              onClick={handleToggleSerial}
              disabled={!isSerialSupported}
              isLoading={isSerialConnecting}
              leftIcon={<Usb className="h-3 w-3 shrink-0" />}
              className="h-7.5 text-xs px-2.5 cursor-pointer shrink-0 font-medium"
            >
              {connectionState.serialConnected ? 'Putuskan' : 'Hubungkan'}
            </Button>
          </div>
        </div>

        {/* Optional Error Alert */}
        <AnimatePresence>
          {connectionState.lastError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-2.5 bg-[#fdf2f2] border-t border-[#fadad9] text-[#e03131] text-xs flex items-center gap-2"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate flex-1 font-mono text-[11px]">{connectionState.lastError}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ==========================================
  // SINGLE ROOM MODE (Embedded in RoomDetailView)
  // ==========================================
  if (room) {
    const isLocked = room.lockStatus === 'LOCKED';
    const isDoorOpen = room.doorStatus === 'OPEN';
    const isOnline = room.deviceStatus === 'ONLINE';

    const usedFpCount = room.usedFingerprints ?? 0;
    const capacityFpCount = 120;
    const fpPercentage = Math.min(100, Math.round((usedFpCount / capacityFpCount) * 100));

    return (
      <div className="space-y-3.5 sm:space-y-4 font-sans">
        {/* Transport Connection Manager */}
        {renderTransportControls()}

        {/* Interactive Hardware Schematic Component */}
        <HardwareSchematic
          solenoidLocked={isLocked}
          doorOpen={isDoorOpen}
          alarmActive={room.isAlarmActive}
          focusedRoomName={room.name}
          focusedRoomCode={room.deviceId}
        />

        {/* Compact Telemetry Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 items-stretch" staggerDelay={0.04}>
          {/* Card 1: Node ESP32 */}
          <StaggerItem className="h-full">
            <div className="h-full flex flex-col justify-between p-3 sm:p-3.5 bg-white border border-[#e5e3df] rounded-lg shadow-notion-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-md bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] flex items-center justify-center shrink-0">
                    <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1a1a1a] truncate">Node Kontroler</h3>
                    <p className="text-[11px] text-[#5d5b54] font-mono truncate">{room.deviceId}</p>
                  </div>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-medium border shrink-0',
                  isOnline
                    ? 'bg-[#eefbf1] text-[#1aae39] border-[#d2f4d9]'
                    : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isOnline ? 'bg-[#1aae39]' : 'bg-[#e03131]')} />
                  {isOnline ? 'Terhubung' : 'Terputus'}
                </span>
              </div>

              <div className="rounded-md bg-[#fafaf9] border border-[#e5e3df] p-2 space-y-1.5 text-xs text-[#5d5b54]">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Status Jaringan</span>
                  <span className="font-mono font-medium text-[#1a1a1a] truncate">{isOnline ? 'MQTT Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Device ID</span>
                  <span className="font-mono text-[#37352f] truncate max-w-[140px]">{room.deviceId}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#e5e3df] flex items-center gap-1.5 text-[11px] font-mono text-[#5d5b54] min-w-0">
                <Radio className="h-3 w-3 text-[#5645d4] shrink-0" aria-hidden="true" />
                <span className="truncate" title={`doorlock/${room.deviceId}`}>doorlock/{room.deviceId}</span>
              </div>
            </div>
          </StaggerItem>

          {/* Card 2: Status Solenoid & Pintu */}
          <StaggerItem className="h-full">
            <div className="h-full flex flex-col justify-between p-3 sm:p-3.5 bg-white border border-[#e5e3df] rounded-lg shadow-notion-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={cn(
                    'h-7 w-7 rounded-md border flex items-center justify-center shrink-0',
                    isLocked ? 'bg-[#d9f3e1] text-[#1aae39] border-[#d2f4d9]' : 'bg-[#ffe8d4] text-[#dd5b00] border-[#fbd6b8]'
                  )}>
                    <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1a1a1a] truncate">Solenoid &amp; Pintu</h3>
                    <p className="text-[11px] text-[#5d5b54] truncate">Sensor MC-38 &amp; Relay 5V</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-[#fafaf9] border border-[#e5e3df] p-2 space-y-1.5 text-xs text-[#5d5b54]">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Solenoid 12V</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-[#1aae39] shrink-0" aria-hidden="true" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5 text-[#dd5b00] shrink-0" aria-hidden="true" />
                    )}
                    <span className={cn('font-semibold font-mono text-xs', isLocked ? 'text-[#1aae39]' : 'text-[#dd5b00]')}>
                      {isLocked ? 'Terkunci' : 'Terbuka'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Sensor Pintu</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDoorOpen ? (
                      <DoorOpen className="h-3.5 w-3.5 text-[#dd5b00] shrink-0" aria-hidden="true" />
                    ) : (
                      <DoorClosed className="h-3.5 w-3.5 text-[#37352f] shrink-0" aria-hidden="true" />
                    )}
                    <span className={cn('font-semibold font-mono text-xs', isDoorOpen ? 'text-[#dd5b00]' : 'text-[#37352f]')}>
                      {isDoorOpen ? 'Terbuka' : 'Tertutup'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#e5e3df] flex items-center justify-between gap-2 text-[11px] font-mono text-[#5d5b54]">
                <span className="shrink-0">Durasi Terbuka</span>
                <span className={cn('truncate', isDoorOpen ? 'text-[#dd5b00] font-semibold' : 'text-[#37352f]')}>
                  {room.openDurationSeconds}s <span className="text-[#a4a097]">/</span> 15s
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* Card 3: Biometrik DY50 */}
          <StaggerItem className="h-full">
            <div className="h-full flex flex-col justify-between p-3 sm:p-3.5 bg-white border border-[#e5e3df] rounded-lg shadow-notion-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-md bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] flex items-center justify-center shrink-0">
                    <Fingerprint className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1a1a1a] truncate">Biometrik DY50</h3>
                    <p className="text-[11px] text-[#5d5b54] truncate">Sensor Sidik Jari Optik</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#5645d4] bg-[#e6e0f5] border border-[#d6b6f6] px-2 py-0.5 rounded-full shrink-0">
                  {fpPercentage}%
                </span>
              </div>

              <div className="rounded-md bg-[#fafaf9] border border-[#e5e3df] p-2 space-y-1.5 text-xs text-[#5d5b54]">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Terdaftar</span>
                  <span className="font-mono font-medium text-[#1a1a1a] truncate">
                    {usedFpCount} <span className="text-[#a4a097]">/</span> {capacityFpCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-[11px] shrink-0">Sisa Kapasitas</span>
                  <span className="font-mono text-[#37352f] truncate">
                    {Math.max(0, capacityFpCount - usedFpCount)} slot
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#e5e3df] flex items-center justify-between gap-2 text-[11px] font-mono text-[#5d5b54]">
                <span className="shrink-0">Basis Data Onboard</span>
                <span className="text-[#1aae39] font-medium shrink-0 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Tersinkron
                </span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Alarm Banner if Active */}
        <AnimatePresence>
          {room.isAlarmActive && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-stretch justify-between gap-2.5 rounded-lg border border-[#fadad9] bg-[#fdf2f2] p-2.5 sm:p-3 sm:flex-row sm:items-center sm:gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#fadad9] bg-white text-[#e03131]">
                  <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#e03131] sm:text-[13px] truncate">
                    Peringatan: Timeout Pintu Terbuka ({room.openDurationSeconds}s)
                  </div>
                  <p className="text-[11px] text-[#5d5b54] truncate">
                    Pintu melebihi batas toleransi 15s. Buzzer aktif di lokasi.
                  </p>
                </div>
              </div>

              {canManage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearAlarm(room.id)}
                  leftIcon={<VolumeX className="h-3.5 w-3.5 shrink-0" />}
                  className="w-full shrink-0 cursor-pointer sm:w-auto h-8 text-xs font-medium"
                >
                  Matikan Buzzer
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================
  // GLOBAL FLEET OVERVIEW MODE (Navigation Tab)
  // ==========================================
  const totalNodes = rooms.length;
  const onlineNodes = rooms.filter((r) => r.deviceStatus === 'ONLINE').length;
  const offlineNodes = totalNodes - onlineNodes;
  const lockedNodes = rooms.filter((r) => r.lockStatus === 'LOCKED').length;
  const closedDoors = rooms.filter((r) => r.doorStatus === 'CLOSED').length;
  const openDoors = totalNodes - closedDoors;
  const activeAlarms = rooms.filter((r) => r.isAlarmActive);

  const totalUsedFp = rooms.reduce((acc, r) => acc + (r.usedFingerprints ?? 0), 0);
  const totalCapacityFp = rooms.length * 120;
  const overallFpPercentage = totalCapacityFp > 0 ? Math.round((totalUsedFp / totalCapacityFp) * 100) : 0;

  const activeMessages = isStreamPaused && frozenMessages ? frozenMessages : mqttMessages;
  const pausedNewCount = isStreamPaused && frozenMessages ? Math.max(0, mqttMessages.length - frozenMessages.length) : 0;

  const filteredMqttMessages = activeMessages.filter((msg) => {
    // Direction filter
    if (mqttFilter === 'INCOMING' && msg.direction !== 'INCOMING') return false;
    if (mqttFilter === 'OUTGOING' && msg.direction !== 'OUTGOING') return false;

    // Topic sub-filter
    if (topicSubFilter !== 'ALL') {
      if (!msg.topic.toLowerCase().includes(topicSubFilter.toLowerCase())) return false;
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const topicMatch = msg.topic.toLowerCase().includes(q);
      const payloadStr = typeof msg.payload === 'object' ? JSON.stringify(msg.payload) : String(msg.payload);
      const payloadMatch = payloadStr.toLowerCase().includes(q);
      if (!topicMatch && !payloadMatch) return false;
    }

    return true;
  });

  const handleClearAllAlarms = () => {
    activeAlarms.forEach((r) => clearAlarm(r.id));
  };

  return (
    <div className="space-y-4 sm:space-y-4.5 font-sans">
      {/* Compact Notion-Inspired Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e3df]">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#1a1a1a]">
            Pusat Kendali Perangkat Keras
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-[#787671] mt-0.5 leading-normal">
            Telemetri mikrokontroler ESP32, solenoid 12V, sensor pintu MC-38, modul optik DY50 &amp; live packet stream
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          {renderConnectionBadge()}
        </div>
      </div>

      {/* Transport Connection Manager */}
      {renderTransportControls()}

      {/* Global Alarm Banner */}
      <AnimatePresence>
        {activeAlarms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3 sm:p-3.5 rounded-lg bg-[#fdf2f2] border border-[#fadad9] text-[#e03131] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1.5 rounded-md bg-white border border-[#fadad9] shrink-0">
                <AlertTriangle className="h-4 w-4 text-[#e03131] shrink-0" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs sm:text-[13px] truncate">
                  {activeAlarms.length} Ruangan Mengalami Timeout Pintu
                </div>
                <div className="text-[11px] text-[#5d5b54] truncate">
                  Ruangan: {activeAlarms.map((r) => r.name).join(', ')}
                </div>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {activeAlarms.length >= 2 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAllAlarms}
                    leftIcon={<VolumeX className="h-3 w-3 shrink-0" />}
                    className="cursor-pointer text-[11px] h-7.5 px-2.5 font-semibold shrink-0 shadow-xs"
                  >
                    Matikan Semua ({activeAlarms.length})
                  </Button>
                )}
                {activeAlarms.map((r) => (
                  <Button
                    key={r.id}
                    variant={activeAlarms.length >= 2 ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => clearAlarm(r.id)}
                    className={cn(
                      'cursor-pointer text-[11px] h-7.5 px-2 shrink-0',
                      activeAlarms.length >= 2 && 'bg-white text-[#e03131] border-[#fadad9] hover:bg-[#fdf2f2]'
                    )}
                  >
                    Matikan {r.deviceId}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Compact Telemetry Overview Cards with Spring Number Tickers */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 font-sans" staggerDelay={0.03}>
        {/* Metric 1: ESP32 Online */}
        <StaggerItem className="h-full">
          <div className="group relative overflow-hidden rounded-xl p-3 sm:p-3.5 bg-white border border-[#e5e3df] hover:border-[#c8c4be] hover:bg-[#fafaf9] shadow-2xs transition-all flex flex-col justify-between h-full space-y-1 select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate">
                    Node Aktif
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border tabular-nums',
                    onlineNodes === totalNodes
                      ? 'bg-[#eefbf1] text-[#0f762a] border-[#d2f4d9]'
                      : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                  )}>
                    {onlineNodes}/{totalNodes}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1a1a1a] leading-none tabular-nums">
                  <NumberTicker value={onlineNodes} />
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border flex items-center justify-center shrink-0 bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]">
                <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Metric 2: Solenoid Status */}
        <StaggerItem className="h-full">
          <div className="group relative overflow-hidden rounded-xl p-3 sm:p-3.5 bg-white border border-[#e5e3df] hover:border-[#c8c4be] hover:bg-[#fafaf9] shadow-2xs transition-all flex flex-col justify-between h-full space-y-1 select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate">
                    Kunci Solenoid
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#eefbf1] text-[#0f762a] border border-[#d2f4d9] tabular-nums">
                    {lockedNodes}/{totalNodes}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1a1a1a] leading-none tabular-nums">
                  <NumberTicker value={lockedNodes} />
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border flex items-center justify-center shrink-0 bg-[#d9f3e1] text-[#0f762a] border-[#c2ecd0]">
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Metric 3: Pintu MC-38 */}
        <StaggerItem className="h-full">
          <div className="group relative overflow-hidden rounded-xl p-3 sm:p-3.5 bg-white border border-[#e5e3df] hover:border-[#c8c4be] hover:bg-[#fafaf9] shadow-2xs transition-all flex flex-col justify-between h-full space-y-1 select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate">
                    Sensor Pintu
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border tabular-nums',
                    closedDoors === totalNodes
                      ? 'bg-[#eefbf1] text-[#0f762a] border-[#d2f4d9]'
                      : 'bg-[#fdf3eb] text-[#b34500] border-[#fbd6b8]'
                  )}>
                    {closedDoors}/{totalNodes} Rapat
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1a1a1a] leading-none tabular-nums">
                  <NumberTicker value={closedDoors} />
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border flex items-center justify-center shrink-0 bg-[#dcecfa] text-[#0075de] border-[#bde0fe]">
                <DoorClosed className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Metric 4: DY50 Fingerprint */}
        <StaggerItem className="h-full">
          <div className="group relative overflow-hidden rounded-xl p-3 sm:p-3.5 bg-white border border-[#e5e3df] hover:border-[#c8c4be] hover:bg-[#fafaf9] shadow-2xs transition-all flex flex-col justify-between h-full space-y-1 select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate">
                    Slot Sidik Jari
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] tabular-nums">
                    {overallFpPercentage}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#1a1a1a] leading-none tabular-nums">
                  <NumberTicker value={totalUsedFp} />
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border flex items-center justify-center shrink-0 bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]">
                <Fingerprint className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Interactive Hardware Schematic & Pinout Diagram */}
      <HardwareSchematic
        solenoidLocked={focusedRoom ? focusedRoom.lockStatus === 'LOCKED' : lockedNodes === totalNodes}
        doorOpen={focusedRoom ? focusedRoom.doorStatus === 'OPEN' : closedDoors < totalNodes}
        alarmActive={focusedRoom ? focusedRoom.isAlarmActive : activeAlarms.length > 0}
        focusedRoomName={focusedRoom?.name}
        focusedRoomCode={focusedRoom?.deviceId}
      />

      {/* ===================================================================== */}
      {/* ROOM HARDWARE DIRECTORY: SUMMARY CARDS GROUPED PER ROOM */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#e5e3df] rounded-xl shadow-notion-1 overflow-hidden space-y-0">
        {/* Header & Filter Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[#e5e3df] space-y-3 bg-[#fafaf9]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-[#0a1530] text-white border border-[#1a2a52] shrink-0 shadow-xs">
                <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-tight truncate">
                    Ringkasan Hardware Per Ruangan Terdaftar
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] shrink-0">
                    {filteredRooms.length} / {rooms.length} Ruangan
                  </span>
                </div>
                <p className="text-[11px] text-[#5d5b54] truncate mt-0.5">
                  Direktori status telemetri mikrokontroler ESP32, solenoid bolt 12V, kontak MC-38, &amp; biometrik DY50
                </p>
              </div>
            </div>

            {/* View Mode Switcher (Grid vs List) */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <div className="flex items-center bg-[#fafaf9] p-0.5 rounded-lg border border-[#e5e3df] text-xs">
                <button
                  type="button"
                  onClick={() => setRoomViewMode('GRID')}
                  className={cn(
                    'p-1.5 px-2.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[11px]',
                    roomViewMode === 'GRID'
                      ? 'bg-white font-semibold text-[#5645d4] shadow-xs border border-[#e5e3df]/60'
                      : 'text-[#5d5b54] hover:text-[#1a1a1a] font-medium'
                  )}
                  title="Tampilan Grid Kartu Kompak"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kartu Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomViewMode('LIST')}
                  className={cn(
                    'p-1.5 px-2.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-[11px]',
                    roomViewMode === 'LIST'
                      ? 'bg-white font-semibold text-[#5645d4] shadow-xs border border-[#e5e3df]/60'
                      : 'text-[#5d5b54] hover:text-[#1a1a1a] font-medium'
                  )}
                  title="Tampilan Tabel Rinci"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Daftar Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Input & Status Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a097]" />
              <input
                type="text"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                placeholder="Cari ruangan (nama, kode SRV-01, lokasi, IP, device ID)..."
                className="w-full pl-8.5 pr-8 py-1.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] text-xs font-mono text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#5645d4] focus:border-[#5645d4] transition-all"
              />
              {roomSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRoomSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a4a097] hover:text-[#1a1a1a] cursor-pointer p-0.5 rounded hover:bg-[#e5e3df]/60 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-mono scrollbar-thin">
              <button
                type="button"
                onClick={() => setRoomStatusFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium',
                  roomStatusFilter === 'ALL'
                    ? 'bg-[#5645d4] text-white border-[#5645d4] font-semibold shadow-xs'
                    : 'bg-white text-[#5d5b54] border-[#e5e3df] hover:border-[#d6b6f6] hover:text-[#1a1a1a]'
                )}
              >
                Semua ({rooms.length})
              </button>

              <button
                type="button"
                onClick={() => setRoomStatusFilter('ONLINE')}
                className={cn(
                  'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium',
                  roomStatusFilter === 'ONLINE'
                    ? 'bg-[#1aae39] text-white border-[#1aae39] font-semibold shadow-xs'
                    : 'bg-white text-[#1aae39] border-[#d2f4d9] hover:bg-[#eefbf1]'
                )}
              >
                Terhubung ({onlineNodes})
              </button>

              {offlineNodes > 0 && (
                <button
                  type="button"
                  onClick={() => setRoomStatusFilter('OFFLINE')}
                  className={cn(
                    'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium',
                    roomStatusFilter === 'OFFLINE'
                      ? 'bg-[#e03131] text-white border-[#e03131] font-semibold shadow-xs'
                      : 'bg-white text-[#e03131] border-[#fadad9] hover:bg-[#fdf2f2]'
                  )}
                >
                  Terputus ({offlineNodes})
                </button>
              )}

              <button
                type="button"
                onClick={() => setRoomStatusFilter('DOOR_OPEN')}
                className={cn(
                  'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium',
                  roomStatusFilter === 'DOOR_OPEN'
                    ? 'bg-[#dd5b00] text-white border-[#dd5b00] font-semibold shadow-xs'
                    : 'bg-white text-[#dd5b00] border-[#fbd6b8] hover:bg-[#ffe8d4]'
                )}
              >
                Pintu Terbuka ({openDoors})
              </button>

              <button
                type="button"
                onClick={() => setRoomStatusFilter('UNLOCKED')}
                className={cn(
                  'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium',
                  roomStatusFilter === 'UNLOCKED'
                    ? 'bg-[#dd5b00] text-white border-[#dd5b00] font-semibold shadow-xs'
                    : 'bg-white text-[#5d5b54] border-[#e5e3df] hover:border-[#d6b6f6] hover:text-[#1a1a1a]'
                )}
              >
                Solenoid Terbuka ({totalNodes - lockedNodes})
              </button>

              {activeAlarms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRoomStatusFilter('ALARM')}
                  className={cn(
                    'px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 animate-pulse font-medium',
                    roomStatusFilter === 'ALARM'
                      ? 'bg-[#e03131] text-white border-[#e03131] font-semibold shadow-xs'
                      : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                  )}
                >
                  Alarm Aktif ({activeAlarms.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rooms Display Container (Grid vs List Table) */}
        <div className="p-3 sm:p-3.5 bg-[#fafaf9]/60">
          {rooms.length === 0 ? (
            <div className="py-12 text-center text-[#5d5b54] space-y-2 bg-white rounded-lg border border-[#e5e3df]">
              <Cpu className="h-8 w-8 mx-auto text-[#a4a097] opacity-60" />
              <p className="text-xs sm:text-sm font-semibold text-[#1a1a1a]">
                Belum ada node perangkat keras / ruangan terdaftar.
              </p>
              <p className="text-[11px] text-[#5d5b54]">
                Sistem saat ini berada dalam kondisi bersih (0 node terkonfigurasi). Anda dapat mendaftarkan node ESP32 baru melalui menu Ruangan.
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-12 text-center text-[#5d5b54] space-y-2 bg-white rounded-lg border border-[#e5e3df]">
              <Cpu className="h-8 w-8 mx-auto text-[#a4a097] opacity-60" />
              <p className="text-xs sm:text-sm font-semibold text-[#1a1a1a]">
                Tidak ada ruangan yang cocok dengan filter atau pencarian Anda.
              </p>
              <p className="text-[11px] text-[#5d5b54]">
                Coba setel ulang kata kunci pencarian atau pilih filter "Semua Ruangan".
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRoomSearchQuery('');
                  setRoomStatusFilter('ALL');
                }}
                className="text-xs h-7.5 px-3 cursor-pointer mt-2"
              >
                Reset Filter
              </Button>
            </div>
          ) : roomViewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5">
              <AnimatePresence mode="popLayout">
                {filteredRooms.map((r) => (
                  <RoomHardwareCard
                    key={r.id}
                    room={r}
                    isFocusedOnSchematic={focusedSchematicRoomId === r.id}
                    isPulsing={pulsingRoomId === r.id}
                    canManage={canManage}
                    onFocusSchematic={handleFocusSchematic}
                    onTestPulseUnlock={handleTestPulseUnlock}
                    onOpenEnrollment={handleOpenEnrollment}
                    onClearAlarm={clearAlarm}
                    onSelectDetail={setSelectedRoomId}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <RoomHardwareListTable
              rooms={filteredRooms}
              focusedSchematicRoomId={focusedSchematicRoomId}
              pulsingRoomId={pulsingRoomId}
              canManage={canManage}
              onFocusSchematic={handleFocusSchematic}
              onTestPulseUnlock={handleTestPulseUnlock}
              onOpenEnrollment={handleOpenEnrollment}
              onClearAlarm={clearAlarm}
              onSelectDetail={setSelectedRoomId}
            />
          )}
        </div>
      </div>

      {/* Modern Developer MQTT Live Stream Panel */}
      <div className="bg-white border border-[#e5e3df] rounded-lg shadow-notion-1 overflow-hidden">
        {/* Terminal Header */}
        <div className="p-3 sm:p-3.5 border-b border-[#e5e3df] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1.5 rounded-md bg-[#0a1530] text-white border border-[#1a2a52] shrink-0">
                <Terminal className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-tight truncate">
                    Aliran Paket Data MQTT Real-Time
                  </h3>
                  {isStreamPaused && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-mono font-semibold bg-[#fdf3eb] text-[#dd5b00] border border-[#fbd6b8] shrink-0">
                      Dijeda {pausedNewCount > 0 ? `(+${pausedNewCount} baru)` : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5d5b54] truncate">
                  Log diagnostik paket JSON sensor MC-38, relay solenoid, biometrik DY50 &amp; broker MQTT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant={isStreamPaused ? 'default' : 'secondary'}
                size="sm"
                onClick={toggleStreamPause}
                leftIcon={isStreamPaused ? <Play className="h-3 w-3 shrink-0" /> : <Pause className="h-3 w-3 shrink-0" />}
                className="text-xs h-7.5 px-3 cursor-pointer shrink-0 font-medium"
              >
                {isStreamPaused ? 'Lanjutkan' : 'Jeda'}
              </Button>

              {mqttMessages.length > 0 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportMqttLogs}
                    leftIcon={<Download className="h-3 w-3 shrink-0 text-[#5645d4]" />}
                    className="text-xs h-7.5 px-2.5 cursor-pointer shrink-0 font-medium"
                    title="Unduh log paket sebagai file JSON"
                  >
                    Ekspor
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMqttLogs}
                    leftIcon={<Trash2 className="h-3 w-3 shrink-0" />}
                    className="text-xs text-[#e03131] hover:bg-[#fdf2f2] hover:text-[#e03131] cursor-pointer h-7.5 px-2.5 shrink-0 font-medium"
                  >
                    Bersihkan
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search & Topic Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a4a097]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik atau isi payload JSON..."
                className="w-full pl-8 pr-3 py-1 rounded-md border border-[#e5e3df] bg-[#fafaf9] text-xs font-mono text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#5645d4]"
              />
            </div>

            {/* Direction Filter Tabs */}
            <div className="flex items-center bg-[#fafaf9] p-0.5 rounded-md border border-[#e5e3df] text-xs shrink-0">
              <button
                type="button"
                onClick={() => setMqttFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-colors cursor-pointer text-center font-mono',
                  mqttFilter === 'ALL'
                    ? 'bg-white font-semibold text-[#1a1a1a] shadow-xs'
                    : 'text-[#5d5b54] hover:text-[#1a1a1a]'
                )}
              >
                Semua ({activeMessages.length})
              </button>
              <button
                type="button"
                onClick={() => setMqttFilter('INCOMING')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-colors cursor-pointer text-center font-mono',
                  mqttFilter === 'INCOMING'
                    ? 'bg-white font-semibold text-[#1aae39] shadow-xs'
                    : 'text-[#5d5b54] hover:text-[#1a1a1a]'
                )}
              >
                Masuk (IN)
              </button>
              <button
                type="button"
                onClick={() => setMqttFilter('OUTGOING')}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-colors cursor-pointer text-center font-mono',
                  mqttFilter === 'OUTGOING'
                    ? 'bg-white font-semibold text-[#5645d4] shadow-xs'
                    : 'text-[#5d5b54] hover:text-[#1a1a1a]'
                )}
              >
                Keluar (OUT)
              </button>
            </div>
          </div>

          {/* Quick Subtopic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-mono">
            <span className="text-[#a4a097] text-[10.5px] uppercase shrink-0">Topik:</span>
            {['ALL', 'telemetry', 'status', 'alarm', 'enroll', 'unlock'].map((topicKey) => {
              const isSelected = topicSubFilter === topicKey;
              return (
                <button
                  key={topicKey}
                  type="button"
                  onClick={() => setTopicSubFilter(topicKey)}
                  className={cn(
                    'px-2 py-0.5 rounded-full border transition-colors cursor-pointer shrink-0',
                    isSelected
                      ? 'bg-[#5645d4] text-white border-[#5645d4] font-semibold'
                      : 'bg-white text-[#5d5b54] border-[#e5e3df] hover:border-[#d6b6f6]'
                  )}
                >
                  {topicKey === 'ALL' ? 'Semua Topik' : topicKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stream Viewport Console */}
        <div className="bg-[#070a14] p-3 sm:p-3.5 font-mono text-xs text-[#d1d5db] max-h-80 overflow-y-auto space-y-2 scrollbar-thin">
          {filteredMqttMessages.length === 0 ? (
            <div className="py-10 text-center text-[#9ca3af] space-y-1.5">
              <Activity className="h-5 w-5 mx-auto opacity-40 text-[#a4a097] shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold text-white">Belum ada paket MQTT yang cocok.</p>
              <p className="text-[11px] text-[#6b7280]">
                {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Pesan akan tampil otomatis saat sensor atau aktuator memicu pembaruan.'}
              </p>
            </div>
          ) : (
            filteredMqttMessages.map((msg) => (
              <MqttMessageRow
                key={msg.id}
                msg={msg}
                copiedMsgId={copiedMsgId}
                onCopyPayload={handleCopyPayload}
              />
            ))
          )}
        </div>
      </div>

      {/* Biometric Enrollment Modal */}
      {enrollTargetRoom && (
        <FingerprintEnrollModal
          isOpen={isEnrollModalOpen}
          onClose={() => {
            setIsEnrollModalOpen(false);
            setEnrollTargetRoom(null);
          }}
          targetUser={currentUser}
          targetRoom={enrollTargetRoom}
        />
      )}
    </div>
  );
};

export const HardwarePanel = React.memo(HardwarePanelComponent);
export default HardwarePanel;
