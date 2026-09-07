import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context';
import { HardwarePanel } from '../hardware/HardwarePanel';
import { LogViewer } from '../logs/LogViewer';
import { FingerprintEnrollModal } from '../hardware/FingerprintEnrollModal';
import { 
  ArrowLeft, 
  Key, 
  ShieldCheck, 
  Activity, 
  Fingerprint, 
  DoorOpen, 
  DoorClosed, 
  Wifi, 
  WifiOff, 
  UserPlus,
  Lock,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusDot } from '@/components/ui/status-dot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { FadeIn } from '@/components/animations/fade-in';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { InteractiveDoorState } from '@/components/animations/interactive-door-state';



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
  
  const [isConfirmUnlockOpen, setIsConfirmUnlockOpen] = useState(false);
  const [isInitiatingUnlock, setIsInitiatingUnlock] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(5);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  // Self-service access request state
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessReason, setAccessReason] = useState('Keperluan Riset & Praktikum Jaringan FT UNTAN');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  const room = rooms.find((r) => r.id === roomId);
  const isSolenoidUnlocked = room?.lockStatus === 'UNLOCKED';
  const isUnlockingActive = isSolenoidUnlocked || isInitiatingUnlock;

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  if (!room || !currentUser) return null;

  const hasAccessToRoom = 
    currentUser.role === 'superadmin' || 
    currentUser.accessibleRoomIds.includes(room.id);

  const handleSubmitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessReason.trim()) return;
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
  };

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

  const isOnline = room.deviceStatus === 'ONLINE';
  const isDoorOpen = room.doorStatus === 'OPEN';

  // Personal metrics for regular user
  const userLogs = logs.filter(
    (l) => l.userId === currentUser.id && l.roomId === room.id
  );
  const userSuccessCount = userLogs.filter(
    (l) => l.authResult === 'SUCCESS'
  ).length;
  const lastUserLog = userLogs.find((l) => l.authResult === 'SUCCESS') || userLogs[0];
  const lastUserAccessFormatted = lastUserLog
    ? `${new Date(lastUserLog.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })} WIB (${new Date(lastUserLog.timestamp).toLocaleDateString('id-ID')})`
    : 'Belum pernah akses';

  const isAccessAllowed =
    currentUser.status === 'ACTIVE' &&
    currentUser.accessibleRoomIds.includes(room.id);

  const handleStartUnlockFlow = () => {
    if (isUnlockingActive || !isOnline) return;
    setIsConfirmUnlockOpen(true);
  };

  const handleExecuteUnlock = async () => {
    setIsConfirmUnlockOpen(false);
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
  };

  const handleForceRelock = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(5);
    forceRelock(room.id);
  };

  const handleTestScan = (validUser = true) => {
    if (!validUser) {
      simulateFingerprintScan(room.id, null);
    } else {
      simulateFingerprintScan(room.id, currentUser);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Navigation Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5 shrink-0" />}
        >
          Kembali
        </Button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="mono">{room.code}</Badge>
          <Badge variant="default" className="truncate max-w-[130px] sm:max-w-none">{room.location}</Badge>
        </div>
      </div>

      {/* Hero Room Info & Main Action Control */}
      <div className="rounded-2xl p-4 sm:p-7 modern-card space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-1.5">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              {room.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {room.description}
            </p>
          </div>

          {/* Primary Action Controls */}
          {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isUnlockingActive ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-sky-950/80 border border-sky-500/40 shadow-[0_0_20px_rgba(14,165,233,0.25)]">
                  <div className="flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold text-sky-300">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                    </span>
                    <span>SOLENOID DIBUKA ({countdownRemaining}s)</span>
                  </div>
                  <Tooltip content="Kunci kembali solenoid seketika tanpa menunggu timer">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleForceRelock}
                      leftIcon={<Lock className="h-3.5 w-3.5 shrink-0" />}
                      className="shadow-md shadow-rose-950/50"
                    >
                      Kunci Paksa
                    </Button>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip content={!isOnline ? 'Perangkat offline' : 'Buka kunci remote via MQTT (Perlu konfirmasi)'}>
                  <Button
                    onClick={handleStartUnlockFlow}
                    disabled={!isOnline}
                    variant="default"
                    size="default"
                    className={cn(
                      'py-2.5 px-4',
                      !isOnline && 'opacity-50',
                      isOnline && 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-600/30'
                    )}
                    leftIcon={<Key className="h-4 w-4 shrink-0" />}
                  >
                    REMOTE UNLOCK
                  </Button>
                </Tooltip>
              )}

              {currentUser.role === 'superadmin' && (
                <Button
                  variant="purple"
                  size="default"
                  onClick={() => setEnrollModalOpen(true)}
                  leftIcon={<UserPlus className="h-4 w-4 shrink-0" />}
                >
                  Enroll FP
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Interactive Door 3D Simulation & Solenoid Status */}
        <InteractiveDoorState
          doorStatus={room.doorStatus}
          lockStatus={room.lockStatus}
          isAlarmActive={room.isAlarmActive}
        />

        {/* Interactive Simulation Sandbox Strip for Testing (Admin/Superadmin) */}
        {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400">IoT Simulator:</span>
              <span className="text-[11px] text-slate-300">Uji interaksi perangkat keras</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleDoorPhysics(room.id)}
                leftIcon={isDoorOpen ? <DoorClosed className="h-3.5 w-3.5 text-emerald-400" /> : <DoorOpen className="h-3.5 w-3.5 text-amber-400" />}
              >
                Pintu: {isDoorOpen ? 'Tutup Pintu' : 'Buka Pintu'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleDeviceOnline(room.id)}
                leftIcon={isOnline ? <WifiOff className="h-3.5 w-3.5 text-rose-400" /> : <Wifi className="h-3.5 w-3.5 text-emerald-400" />}
              >
                {isOnline ? 'Set Offline' : 'Set Online'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestScan(true)}
                leftIcon={<Fingerprint className="h-3.5 w-3.5 text-emerald-400" />}
              >
                Scan Valid
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestScan(false)}
                leftIcon={<Fingerprint className="h-3.5 w-3.5 text-rose-400" />}
              >
                Scan Asing
              </Button>
            </div>
          </div>
        )}


        {/* Metrics View */}
        {currentUser.role === 'user' ? (
          /* Personal User Overview */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.08] text-xs">
            <FadeIn delay={0.05} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Fingerprint className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Akses Fisik Personal Anda</span>
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                <AnimatedCounter value={userSuccessCount} /> <span className="text-xs text-slate-400 font-normal">Kali Terverifikasi</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Melalui sensor sidik jari AS608 di pintu ini
              </p>
            </FadeIn>

            <FadeIn delay={0.1} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Activity className="h-4 w-4 text-sky-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Waktu Akses Terakhir Anda</span>
              </div>
              <div className="text-xs font-semibold text-sky-300 mt-1 truncate">
                {lastUserAccessFormatted}
              </div>
              <p className="text-[11px] text-slate-400">
                Tercatat pada append-only audit log server
              </p>
            </FadeIn>

            <FadeIn delay={0.15} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Status Hak Akses Ruangan</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusDot status={isAccessAllowed ? 'online' : 'offline'} />
                <span className={`text-xs font-semibold ${isAccessAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isAccessAllowed ? 'TEROTORISASI & AKTIF' : 'AKSES DINONAKTIFKAN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAccessAllowed ? 'Dapat membuka pintu fisik via sensor' : 'Hubungi admin untuk aktivasi'}
              </p>
            </FadeIn>
          </div>
        ) : (
          /* Room-Wide Metrics View for Admin & Superadmin */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.08] text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Pintu Fisik (MC-38)</span>
              <div className="text-xs font-semibold text-white mt-0.5">{room.doorStatus}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Kunci Solenoid</span>
              <div className={`text-xs font-semibold mt-0.5 ${room.lockStatus === 'LOCKED' ? 'text-emerald-400' : 'text-sky-400'}`}>
                {room.lockStatus}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Akses Terakhir</span>
              <div className="text-xs font-semibold text-slate-300 mt-0.5 truncate">
                {room.lastUserAccessed || 'Belum ada akses'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Total Akses Hari Ini</span>
              <div className="text-xs font-bold text-slate-100 mt-0.5 font-mono">
                {room.todayAccessCount} Kali
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IoT Hardware State Panel (Hanya untuk Admin & Superadmin) */}
      {currentUser.role !== 'user' && <HardwarePanel room={room} />}

      {/* Access History & Audit Logs Section */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            {currentUser.role === 'user' ? 'Riwayat Akses Autentikasi Saya' : 'Riwayat & Log Keamanan Ruangan'}
          </h3>
          <p className="text-xs text-slate-400">
            {currentUser.role === 'user' 
              ? 'Pencatatan aktivitas waktu autentikasi sidik jari personal Anda' 
              : 'Audit log append-only mencatat seluruh event autentikasi, status pintu, dan alarm'}
          </p>
        </div>

        <LogViewer roomId={room.id} />
      </div>

      {/* Safety Confirmation Dialog for Remote Solenoid Unlock */}
      <Dialog open={isConfirmUnlockOpen} onOpenChange={setIsConfirmUnlockOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <DialogTitle>Konfirmasi Pembukaan Kunci Solenoid</DialogTitle>
            </div>
            <DialogDescription>
              Otorisasi remote unlock aktuator fisik 12V via jaringan kampus
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3.5">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300">Peringatan Keamanan:</span> Aksi ini akan segera mengalirkan arus 12V ke solenoid lock pada <strong>{room.name}</strong> ({room.code}) selama <strong>5.0 detik</strong>.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Ruangan Sasaran:</span>
                <span className="text-white font-semibold">{room.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Device Node:</span>
                <span className="text-slate-200">{room.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span>Eksekutor:</span>
                <span className="text-sky-300">{currentUser.name} ({currentUser.roleLabel})</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Relock Timeout:</span>
                <span className="text-emerald-400 font-bold">5 Detik</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pastikan area pintu dalam kondisi steril. Seluruh log pembukaan akan dicatat secara permanen pada log audit keamanan FT UNTAN.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmUnlockOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExecuteUnlock}
              leftIcon={<Key className="h-3.5 w-3.5" />}
              className="bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30"
            >
              Konfirmasi & Buka Solenoid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Modal for Superadmin */}
      {enrollModalOpen && (
        <FingerprintEnrollModal
          isOpen={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          targetUser={users[1]}
          targetRoom={room}
        />
      )}

    </div>
  );
};
