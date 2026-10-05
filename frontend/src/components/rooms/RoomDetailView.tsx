import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/context';
import { HardwarePanel } from '../hardware/HardwarePanel';
import { LogViewer } from '../logs/LogViewer';
import { FingerprintEnrollModal } from '../hardware/FingerprintEnrollModal';
import {
  ArrowLeft,
  Fingerprint,
  WifiOff,
  UserPlus,
  Send,
  CheckCircle2,
  FileText,
  AlertOctagon,
  VolumeX,
  SlidersHorizontal,
  Cpu,
  Lock,
  Unlock,
  DoorClosed,
  DoorOpen,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { FadeIn } from '@/components/animations/fade-in';
import { SlideToUnlock } from '@/components/animations/slide-to-unlock';
import { cn } from '@/lib/utils';

export type RoomDetailTab = 'control' | 'hardware' | 'logs';

interface RoomDetailViewProps {
  roomId: string;
  onBack: () => void;
}

export const RoomDetailView: React.FC<RoomDetailViewProps> = ({ roomId, onBack }) => {
  const {
    rooms,
    currentUser,
    triggerRemoteUnlock,
    forceRelock,
    requestRoomAccess,
    clearAlarm,
    logs
  } = useApp();

  const [isInitiatingUnlock, setIsInitiatingUnlock] = useState(false);
  const [unlockFeedback, setUnlockFeedback] = useState<string | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState(5);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Self-service access request state
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessReason, setAccessReason] = useState('Keperluan Riset & Praktikum Jaringan FT UNTAN');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<RoomDetailTab>('control');
  const [prevRoomId, setPrevRoomId] = useState(roomId);

  // Reset to 'control' tab when roomId changes without triggering cascading effect renders
  if (prevRoomId !== roomId) {
    setPrevRoomId(roomId);
    setActiveSubTab('control');
  }

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const isSolenoidUnlocked = room?.lockStatus === 'UNLOCKED';
  const isOnline = room?.deviceStatus === 'ONLINE';
  const isDoorOpen = room?.doorStatus === 'OPEN';

  const availableSubTabs = useMemo(() => {
    if (!currentUser) return [];
    const tabs: {
      id: RoomDetailTab;
      label: string;
      shortLabel: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [
      { id: 'control', label: 'Kontrol & Status', shortLabel: 'Kontrol', icon: SlidersHorizontal },
    ];
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      tabs.push({ id: 'hardware', label: 'Telemetri Hardware', shortLabel: 'Telemetri', icon: Cpu });
    }
    tabs.push({ id: 'logs', label: 'Riwayat Akses', shortLabel: 'Riwayat', icon: FileText });
    return tabs;
  }, [currentUser]);

  const currentSubTab = (activeSubTab === 'hardware' && currentUser?.role === 'user') ? 'control' : activeSubTab;

  // Personal metrics for regular user - memoized at top level
  const { userSuccessCount, lastUserAccessFormatted } = useMemo(() => {
    if (!currentUser || !room) {
      return { userSuccessCount: 0, lastUserAccessFormatted: 'Belum pernah akses' };
    }
    const uLogs = logs.filter((l) => l.userId === currentUser.id && l.roomId === room.id);
    const successCount = uLogs.filter((l) => l.authResult === 'SUCCESS').length;
    const lastLog = uLogs.find((l) => l.authResult === 'SUCCESS') || uLogs[0];
    const formatted = lastLog
      ? `${new Date(lastLog.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })} WIB (${new Date(lastLog.timestamp).toLocaleDateString('id-ID')})`
      : 'Belum pernah akses';
    return { userSuccessCount: successCount, lastUserAccessFormatted: formatted };
  }, [logs, currentUser, room]);

  const hasAccessToRoom = useMemo(() => {
    if (!currentUser || !room) return false;
    return currentUser.role === 'superadmin' || currentUser.accessibleRoomIds.includes(room.id);
  }, [currentUser, room]);

  const handleExecuteUnlock = useCallback(async (): Promise<boolean> => {
    if (!room) return false;
    setIsInitiatingUnlock(true);
    setUnlockFeedback('Mengirim perintah buka kunci…');
    setCountdownRemaining(5);

    const success = await triggerRemoteUnlock(room.id);
    setIsInitiatingUnlock(false);

    if (success) {
      setUnlockFeedback('Perintah diterima. Kunci akan menutup otomatis dalam 5 detik.');
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdownRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setUnlockFeedback('Perintah tidak diterima. Periksa koneksi node dan coba lagi.');
    }
    return Boolean(success);
  }, [triggerRemoteUnlock, room]);

  const handleForceRelock = useCallback(() => {
    if (!room) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(5);
    setUnlockFeedback('Kunci paksa dikirim. Menunggu pembaruan status perangkat.');
    forceRelock(room.id);
  }, [forceRelock, room]);

  const handleSubmitAccessRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !accessReason.trim()) return;
    setIsSubmittingRequest(true);
    const res = await requestRoomAccess(room.id, accessReason.trim());
    setIsSubmittingRequest(false);
    if (res.success) {
      setRequestSuccessMessage(res.message);
      setTimeout(() => {
        setIsAccessRequestOpen(false);
        setRequestSuccessMessage(null);
      }, 2500);
    }
  }, [room, accessReason, requestRoomAccess]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  if (!room || !currentUser) return null;

  if (!hasAccessToRoom) {
    const isAdmin = currentUser.role === 'admin';
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5 shrink-0" />}
          className="w-fit cursor-pointer self-start"
        >
          Kembali ke Daftar Ruangan
        </Button>
        <div className="space-y-4 rounded-lg border border-[#fadad9] bg-white p-6 text-center sm:p-8 shadow-notion-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#fadad9] bg-[#fdf2f2] text-[#e03131]">
            <WifiOff className="h-6 w-6 shrink-0" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
              {isAdmin ? 'Ruangan Di Luar Otorisasi Pengelolaan' : 'Tidak Memiliki Hak Akses Ruangan'}
            </h2>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-[#5d5b54] sm:text-sm">
              Akun Anda ({currentUser.name} &bull; <span className="font-mono text-[#1a1a1a] font-semibold">{currentUser.email}</span>) saat ini belum memiliki wewenang untuk mengakses atau mengelola <strong>{room.name}</strong> ({room.deviceId}).
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              Pilih Ruangan Lain
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAccessRequestOpen(true)}
              leftIcon={<Send className="h-3.5 w-3.5 shrink-0" />}
              className="font-medium"
            >
              {isAdmin ? 'Ajukan Delegasi Pengelolaan' : 'Ajukan Izin Akses Laboratorium'}
            </Button>
          </div>
        </div>

        {/* Access Request Dialog */}
        <Dialog open={isAccessRequestOpen} onOpenChange={setIsAccessRequestOpen}>
          <DialogContent size="md" onClose={() => setIsAccessRequestOpen(false)}>
            <DialogHeader className="pr-12 sm:pr-14">
              <div className="flex items-center gap-2 text-[#5645d4]">
                <FileText className="h-5 w-5 shrink-0" />
                <DialogTitle>{isAdmin ? 'Permohonan Delegasi Pengelolaan Ruangan' : 'Permohonan Izin Akses Laboratorium'}</DialogTitle>
              </div>
              <DialogDescription>
                {isAdmin
                  ? 'Permohonan delegasi akan diteruskan ke Superadmin FT UNTAN untuk otorisasi hak kelola'
                  : 'Permohonan izin akan diteruskan ke Superadmin FT UNTAN untuk otorisasi hak akses'}
              </DialogDescription>
            </DialogHeader>

            {requestSuccessMessage ? (
              <DialogBody className="py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-[#eefbf1] text-[#1aae39] flex items-center justify-center mx-auto border border-[#d2f4d9]">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                </div>
                <h4 className="text-sm font-bold text-[#1a1a1a]">Permohonan Berhasil Dikirim</h4>
                <p className="text-xs text-[#5d5b54] max-w-sm mx-auto leading-relaxed">
                  {requestSuccessMessage}
                </p>
              </DialogBody>
            ) : (
              <form onSubmit={handleSubmitAccessRequest} className="flex flex-1 min-h-0 flex-col overflow-hidden">
                <DialogBody className="space-y-3.5">
                  <div className="p-3 rounded-md bg-[#f6f5f4] border border-[#e5e3df] text-xs font-mono space-y-1 text-[#5d5b54]">
                    <div className="flex justify-between">
                      <span>Pemohon:</span>
                      <span className="text-[#1a1a1a] font-semibold">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-[#37352f]">{currentUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ruangan Dituju:</span>
                      <span className="text-[#5645d4] font-semibold">{room.name} ({room.deviceId})</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="access-reason-input">Alasan / Keperluan Akses:</Label>
                    <Input
                      id="access-reason-input"
                      type="text"
                      value={accessReason}
                      onChange={(e) => setAccessReason(e.target.value)}
                      placeholder="Misal: Praktikum Jaringan Komputer..."
                      required
                    />
                  </div>

                  <p className="text-[11px] text-[#5d5b54] leading-relaxed">
                    Setelah disetujui, Superadmin akan mendaftarkan template sidik jari Anda pada sensor DY50 ruangan ini.
                  </p>
                </DialogBody>

                <DialogFooter className="pt-3 border-t border-[#e5e3df] bg-[#f6f5f4]">
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsAccessRequestOpen(false)}
                      className="min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer rounded-md font-medium"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      isLoading={isSubmittingRequest}
                      leftIcon={<Send className="h-3.5 w-3.5 shrink-0" />}
                      className="min-h-[40px] sm:min-h-[36px] px-5 font-medium cursor-pointer shadow-xs rounded-md"
                    >
                      Kirim Permohonan
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6 pb-6 sm:pb-0">

      {/* Navigation Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5 shrink-0" />}
          className="cursor-pointer text-xs h-8"
        >
          Kembali ke Ruangan
        </Button>
        <span className="shrink-0 rounded-md border border-[#e5e3df] bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[#1a1a1a] shadow-xs">
          {room.deviceId}
        </span>
      </div>

      {/* Room summary and primary control */}
      <div className="space-y-3.5 rounded-lg border border-[#e5e3df] bg-white p-4 shadow-notion-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#5d5b54]">
              <MapPin className="h-3.5 w-3.5 text-[#5d5b54]" />
              <span className="truncate">{room.description || 'Ruangan Laboratorium'}</span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#1a1a1a]">
              {room.name}
            </h1>
          </div>

          {currentUser.role === 'superadmin' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setEnrollModalOpen(true)}
              leftIcon={<UserPlus className="h-3.5 w-3.5 shrink-0" />}
              className="w-full sm:w-auto font-medium cursor-pointer shadow-xs rounded-md shrink-0"
            >
              Enroll Sidik Jari DY50
            </Button>
          )}
        </div>

        {/* Instant Alarm Banner at Top for Room Admin / Superadmin */}
        {room.isAlarmActive && (
          <div className="flex flex-col gap-2.5 rounded-md border border-[#fadad9] bg-[#fdf2f2] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#fdf2f2] text-[#e03131]">
                <AlertOctagon className="h-4.5 w-4.5 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#e03131] truncate">
                  PERINGATAN: Timeout Alarm Aktif!
                </div>
                <p className="text-[11px] text-[#5d5b54]">
                  Pintu terbuka {room.openDurationSeconds} dtk (Maks: 15 dtk). Buzzer aktif di ruangan.
                </p>
              </div>
            </div>
            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearAlarm(room.id)}
                leftIcon={<VolumeX className="h-3.5 w-3.5 shrink-0" />}
                className="w-full cursor-pointer"
              >
                Matikan Alarm & Buzzer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Notion Segmented Sub-Tabs Bar */}
      <div
        className="flex items-center gap-1 border-b border-[#e5e3df] overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Sub-navigasi Ruangan"
      >
        {availableSubTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer shrink-0 -mb-px outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 text-center whitespace-nowrap",
                isActive
                  ? "border-[#5645d4] text-[#5645d4] font-semibold bg-white"
                  : "border-transparent text-[#5d5b54] hover:text-[#1a1a1a] hover:border-[#c8c4be] hover:bg-[#fafaf9]"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-[#5645d4]" : "text-[#5d5b54]")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Kontrol & Status */}
      {currentSubTab === 'control' && (
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-[#e5e3df] bg-white p-4 sm:p-5 shadow-notion-1">
            {/* Hardware Telemetry 4-Cell Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Node Perangkat ESP32 */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e3df] bg-[#fafaf9] hover:border-[#c8c4be] transition-all shadow-2xs"
                title={`ESP32 Node: ${isOnline ? 'Terhubung (Online)' : 'Terputus (Offline)'}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0 border transition-transform duration-200',
                    isOnline
                      ? 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]'
                      : 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9]'
                  )}
                >
                  <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[10.5px] font-medium text-[#787671] truncate">ESP32 Node</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        isOnline ? 'bg-[#1aae39]' : 'bg-[#e03131]'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-xs truncate',
                        isOnline ? 'text-[#1a1a1a]' : 'text-[#e03131]'
                      )}
                    >
                      {isOnline ? 'Terhubung' : 'Terputus'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MC-38 Reed Switch */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e3df] bg-[#fafaf9] hover:border-[#c8c4be] transition-all shadow-2xs"
                title={`Sensor Pintu MC-38: ${isDoorOpen ? 'Terbuka (Door Open)' : 'Tertutup (Door Closed)'}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0 border transition-transform duration-200',
                    isDoorOpen
                      ? 'bg-[#ffe8d4] text-[#dd5b00] border-[#fbd6b8]'
                      : 'bg-[#dcecfa] text-[#0075de] border-[#bde0fe]'
                  )}
                >
                  {isDoorOpen ? (
                    <DoorOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <DoorClosed className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[10.5px] font-medium text-[#787671] truncate">Sensor Pintu</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        isDoorOpen ? 'bg-[#dd5b00]' : 'bg-[#1aae39]'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-xs truncate',
                        isDoorOpen ? 'text-[#dd5b00]' : 'text-[#1a1a1a]'
                      )}
                    >
                      {isDoorOpen ? 'Terbuka' : 'Tertutup'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solenoid 12V */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e3df] bg-[#fafaf9] hover:border-[#c8c4be] transition-all shadow-2xs"
                title={`Solenoid 12V: ${!isSolenoidUnlocked ? 'Terkunci (Locked)' : 'Terbuka (Unlocked)'}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0 border transition-transform duration-200',
                    !isSolenoidUnlocked
                      ? 'bg-[#d9f3e1] text-[#1aae39] border-[#d2f4d9]'
                      : 'bg-[#ffe8d4] text-[#dd5b00] border-[#fbd6b8]'
                  )}
                >
                  {!isSolenoidUnlocked ? (
                    <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Unlock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[10.5px] font-medium text-[#787671] truncate">Solenoid 12V</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        !isSolenoidUnlocked ? 'bg-[#1aae39]' : 'bg-[#dd5b00]'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-xs truncate',
                        !isSolenoidUnlocked ? 'text-[#1a1a1a]' : 'text-[#dd5b00]'
                      )}
                    >
                      {!isSolenoidUnlocked ? 'Terkunci' : 'Terbuka'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Alarm */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e3df] bg-[#fafaf9] hover:border-[#c8c4be] transition-all shadow-2xs"
                title={`Status Alarm: ${room.isAlarmActive ? 'Peringatan Aktif (Alarm)' : 'Normal (Aman)'}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0 border transition-transform duration-200',
                    room.isAlarmActive
                      ? 'bg-[#fdf2f2] text-[#e03131] border-[#fadad9] animate-pulse'
                      : 'bg-[#fafaf9] text-[#787671] border-[#e5e3df]'
                  )}
                >
                  {room.isAlarmActive ? (
                    <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1aae39]" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[10.5px] font-medium text-[#787671] truncate">Status Alarm</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        room.isAlarmActive ? 'bg-[#e03131]' : 'bg-[#1aae39]'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-xs truncate',
                        room.isAlarmActive ? 'text-[#e03131]' : 'text-[#1a1a1a]'
                      )}
                    >
                      {room.isAlarmActive ? 'Aktif!' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <div className="border-t border-[#e5e3df] pt-4.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-[#1a1a1a]">Kontrol Solenoid Jarak Jauh</h3>
                    <p className="text-[11px] text-[#787671] mt-0.5">
                      Buka kunci solenoid secara instan melalui instruksi MQTT
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-medium text-[#5d5b54] bg-[#fafaf9] px-2 py-0.5 rounded border border-[#e5e3df] shrink-0">
                    Auto-relock: 5s
                  </span>
                </div>
                <SlideToUnlock
                  onUnlock={handleExecuteUnlock}
                  isUnlocking={isInitiatingUnlock}
                  isUnlocked={isSolenoidUnlocked}
                  disabled={!isOnline}
                  disabledReason="Node ESP32 terputus - remote unlock tidak tersedia"
                  countdownRemaining={countdownRemaining}
                  onForceRelock={handleForceRelock}
                  roomName={room.name}
                  roomCode={room.deviceId}
                  label="Geser untuk Membuka Kunci"
                  unlockedLabel="Kunci Terbuka"
                  variant="compact"
                />
                {unlockFeedback && (
                  <p
                    className="flex items-center gap-2 rounded-md border border-[#e5e3df] bg-[#fafaf9] p-2.5 text-xs text-[#5d5b54]"
                    role="status"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1aae39] shrink-0" />
                    <span>{unlockFeedback}</span>
                  </p>
                )}
              </div>
            )}

            {/* User View: Quick status & access permissions summary */}
            {currentUser.role === 'user' && (
              <div className="space-y-3.5 border-t border-[#e5e3df] pt-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eefbf1] text-[#1aae39] border border-[#d2f4d9]">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#1a1a1a] truncate block">Status Otorisasi Akun Anda</span>
                      <p className="text-[11px] text-[#5d5b54] truncate">Terdaftar di direktori sivitas FT UNTAN &bull; Template DY50 aktif</p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#d2f4d9] bg-[#eefbf1] px-2.5 py-1 text-xs font-semibold text-[#1aae39] shrink-0">
                    <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                    Otorisasi Aktif
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-[#e5e3df] bg-[#fafaf9] p-2.5">
                    <span className="text-[10px] font-mono uppercase text-[#5d5b54]">Total Akses Berhasil</span>
                    <p className="mt-1 font-mono text-base font-bold text-[#1a1a1a]">{userSuccessCount} kali</p>
                  </div>
                  <div className="rounded-md border border-[#e5e3df] bg-[#fafaf9] p-2.5">
                    <span className="text-[10px] font-mono uppercase text-[#5d5b54]">Akses Terakhir</span>
                    <p className="mt-1 truncate font-mono text-xs font-medium text-[#37352f]">{lastUserAccessFormatted}</p>
                  </div>
                </div>

                <div className="rounded-md border border-[#e5e3df] bg-[#fafaf9] p-3 text-xs text-[#5d5b54] flex items-start gap-2">
                  <Fingerprint className="h-4 w-4 text-[#5645d4] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Untuk membuka pintu, tempelkan jari Anda yang telah didaftarkan ke modul sensor <strong>DY50</strong> pada panel fisik di samping pintu lab.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Telemetri Hardware */}
      {currentSubTab === 'hardware' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
        <FadeIn direction="up" delay={0.02}>
          <HardwarePanel room={room} />
        </FadeIn>
      )}

      {/* Tab 3: Riwayat Akses */}
      {currentSubTab === 'logs' && (
        <FadeIn direction="up" delay={0.02}>
          <LogViewer roomId={room.id} />
        </FadeIn>
      )}

      {/* Fingerprint Enrollment Modal */}
      <FingerprintEnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        targetUser={currentUser || null}
        targetRoom={room}
      />
    </div>
  );
};

export default RoomDetailView;

