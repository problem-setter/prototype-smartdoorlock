import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/context';
import { HardwarePanel } from '../hardware/HardwarePanel';
import { LogViewer } from '../logs/LogViewer';
import { FingerprintEnrollModal } from '../hardware/FingerprintEnrollModal';
import { 
  ArrowLeft, 
  Key, 
  Fingerprint, 
  DoorOpen, 
  DoorClosed, 
  Wifi, 
  WifiOff, 
  UserPlus, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { FadeIn } from '@/components/animations/fade-in';
import { InteractiveDoorState } from '@/components/animations/interactive-door-state';
import { SlideToUnlock } from '@/components/animations/slide-to-unlock';

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
    toggleDoorPhysics,
    toggleDeviceOnline,
    simulateFingerprintScan,
    requestRoomAccess,
    users, 
    logs 
  } = useApp();
  
  const [isInitiatingUnlock, setIsInitiatingUnlock] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(5);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Self-service access request state
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessReason, setAccessReason] = useState('Keperluan Riset & Praktikum Jaringan FT UNTAN');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const isSolenoidUnlocked = room?.lockStatus === 'UNLOCKED';
  const isUnlockingActive = isSolenoidUnlocked || isInitiatingUnlock;
  const isOnline = room?.deviceStatus === 'ONLINE';
  const isDoorOpen = room?.doorStatus === 'OPEN';

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
    setCountdownRemaining(5);

    const success = await triggerRemoteUnlock(room.id);
    setIsInitiatingUnlock(false);

    if (success) {
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
    }
    return Boolean(success);
  }, [triggerRemoteUnlock, room]);

  const handleStartUnlockFlow = useCallback(() => {
    if (isUnlockingActive || !isOnline) return;
    handleExecuteUnlock();
  }, [isUnlockingActive, isOnline, handleExecuteUnlock]);

  const handleForceRelock = useCallback(() => {
    if (!room) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(5);
    forceRelock(room.id);
  }, [forceRelock, room]);

  const handleTestScan = useCallback((validUser = true) => {
    if (!room) return;
    if (!validUser) {
      simulateFingerprintScan(room.id, null);
    } else {
      simulateFingerprintScan(room.id, currentUser);
    }
  }, [simulateFingerprintScan, room, currentUser]);

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
    return (
      <div className="space-y-4 sm:space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5 shrink-0" />}
        >
          Kembali ke Daftar Ruangan
        </Button>
        <div className="p-6 sm:p-8 text-center rounded-2xl bg-[#0c111d] border border-rose-900/40 space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <WifiOff className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Tidak Memiliki Hak Akses Ruangan</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Akun Anda ({currentUser.name} &bull; <span className="font-mono text-slate-300">{currentUser.nipNim}</span>) saat ini belum diotorisasikan untuk mengakses <strong>{room.name}</strong> ({room.code}).
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
              leftIcon={<Send className="h-3.5 w-3.5" />}
              className="bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/30"
            >
              Ajukan Izin Akses Laboratorium
            </Button>
          </div>
        </div>

        {/* Access Request Dialog */}
        <Dialog open={isAccessRequestOpen} onOpenChange={setIsAccessRequestOpen}>
          <DialogContent size="md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-sky-400">
                <FileText className="h-5 w-5 shrink-0" />
                <DialogTitle>Permohonan Izin Akses Laboratorium</DialogTitle>
              </div>
              <DialogDescription>
                Tiket permohonan akan diteruskan ke Superadmin FT UNTAN untuk otorisasi sidik jari
              </DialogDescription>
            </DialogHeader>

            {requestSuccessMessage ? (
              <DialogBody className="py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Permohonan Berhasil Dikirim</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {requestSuccessMessage}
                </p>
              </DialogBody>
            ) : (
              <form onSubmit={handleSubmitAccessRequest}>
                <DialogBody className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Pemohon:</span>
                      <span className="text-white">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Identitas:</span>
                      <span className="text-slate-300">{currentUser.nipNim}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ruangan Dituju:</span>
                      <span className="text-sky-300 font-semibold">{room.name} ({room.code})</span>
                    </div>
                  </div>

                  <div className="space-y-1">
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

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Setelah disetujui, Superadmin akan mendaftarkan template sidik jari Anda pada sensor AS608 ruangan ini.
                  </p>
                </DialogBody>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsAccessRequestOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    isLoading={isSubmittingRequest}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    className="bg-sky-600 hover:bg-sky-500"
                  >
                    Kirim Permohonan
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Navigation Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5 shrink-0" />}
          className="cursor-pointer"
        >
          Kembali ke Ruangan
        </Button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
          <span className="font-semibold text-slate-200">{room.code}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-sans">{room.location}</span>
        </div>
      </div>

      {/* Hero Room Info & Main Action Control */}
      <div className="rounded-2xl p-4 sm:p-7 bg-[#0b111e]/90 border border-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-md space-y-4 sm:space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 via-purple-500/5 to-transparent rounded-full pointer-events-none blur-3xl -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {room.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                Node ID: <strong className="text-sky-400 font-semibold">{room.deviceId}</strong>
              </span>
              <span className="text-slate-700">•</span>
              <StatusDot status={isOnline ? 'online' : 'offline'} label={isOnline ? 'ESP32 Terhubung' : 'Perangkat Terputus'} />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {room.description}
            </p>
          </div>

          {/* Primary Action Controls */}
          {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={handleStartUnlockFlow}
                disabled={!isOnline || isUnlockingActive}
                variant="outline"
                size="sm"
                className={cn(
                  'border-sky-500/30 text-sky-300 hover:bg-sky-500/10 cursor-pointer font-mono text-xs',
                  !isOnline && 'opacity-50'
                )}
                leftIcon={<ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
              >
                Logika Keamanan
              </Button>

              {currentUser.role === 'superadmin' && (
                <Button
                  variant="purple"
                  size="sm"
                  onClick={() => setEnrollModalOpen(true)}
                  leftIcon={<UserPlus className="h-3.5 w-3.5 shrink-0" />}
                >
                  Enroll FP
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dedicated Industrial Slide-to-Unlock Command Deck */}
        {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-sky-500/20 shadow-inner space-y-2.5 relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                  <Key className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                  Remote Actuator Control &bull; Slide to Unlock
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-800/40">
                Solenoid Control &bull; 12V
              </span>
            </div>

            <SlideToUnlock
              onUnlock={handleExecuteUnlock}
              isUnlocking={isInitiatingUnlock}
              isUnlocked={isSolenoidUnlocked}
              disabled={!isOnline}
              disabledReason="Node ESP32 terputus - Remote unlock dinonaktifkan"
              countdownRemaining={countdownRemaining}
              onForceRelock={handleForceRelock}
              roomName={room.name}
              roomCode={room.code}
              label="GESER UNTUK REMOTE UNLOCK SOLENOID"
              unlockedLabel="SOLENOID 12V TERBUKA (RELAY AKTIF)"
              variant="hero"
            />
          </div>
        )}

        {/* User View: Quick status & access permissions summary */}
        {currentUser.role === 'user' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-400">
                Status Otorisasi: <strong className="text-emerald-400 font-bold">AKSES FISIK AKTIF</strong>
              </span>
              <span className="text-slate-400 text-[11px]">
                Gunakan sensor fingerprint AS608 fisik di pintu {room.code}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-0.5">
                <span className="text-slate-400 text-[10px]">Akses Sukses Anda:</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {userSuccessCount} <span className="text-xs text-slate-400 font-normal">Kali</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-0.5">
                <span className="text-slate-400 text-[10px]">Terakhir Diakses:</span>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {lastUserAccessFormatted}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Physics State Display & Real-time Telemetry Dashboard */}
      <FadeIn direction="up" delay={0.05}>
        <InteractiveDoorState
          doorStatus={room.doorStatus}
          lockStatus={room.lockStatus}
          isAlarmActive={room.isAlarmActive}
          onToggleDoor={() => toggleDoorPhysics(room.id)}
        />
      </FadeIn>

      {/* Admin/Superadmin Hardware Sandbox Controls */}
      {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
        <FadeIn direction="up" delay={0.1}>
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-300">IoT Hardware Sandbox</span>
                <p className="text-[11px] text-slate-400">Simulasi trigger sensor dan sinyal aktuator secara lokal</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleDoorPhysics(room.id)}
                leftIcon={isDoorOpen ? <DoorClosed className="h-3.5 w-3.5 text-emerald-400" /> : <DoorOpen className="h-3.5 w-3.5 text-amber-400" />}
                className="cursor-pointer"
              >
                Pintu: {isDoorOpen ? 'Tutup (MC-38)' : 'Buka (MC-38)'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleDeviceOnline(room.id)}
                leftIcon={isOnline ? <WifiOff className="h-3.5 w-3.5 text-rose-400" /> : <Wifi className="h-3.5 w-3.5 text-emerald-400" />}
                className="cursor-pointer"
              >
                Node: {isOnline ? 'Set Offline' : 'Set Online'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTestScan(true)}
                leftIcon={<Fingerprint className="h-3.5 w-3.5 text-emerald-400" />}
                className="cursor-pointer"
              >
                Scan FP Valid
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTestScan(false)}
                leftIcon={<Fingerprint className="h-3.5 w-3.5 text-rose-400" />}
                className="cursor-pointer"
              >
                Scan FP Ditolak
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Deep Hardware Diagnostic Panel */}
      <FadeIn direction="up" delay={0.12}>
        <HardwarePanel room={room} />
      </FadeIn>

      {/* Audit Log Stream */}
      <FadeIn direction="up" delay={0.15}>
        <LogViewer roomId={room.id} />
      </FadeIn>

      {/* Fingerprint Enrollment Modal */}
      <FingerprintEnrollModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        targetUser={users[0] || null}
        targetRoom={room}
      />
    </div>
  );
};

export default RoomDetailView;
