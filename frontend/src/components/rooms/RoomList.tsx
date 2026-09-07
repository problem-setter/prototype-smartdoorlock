import React from 'react';
import { useApp } from '@/context';
import { RoomCard } from './RoomCard';
import { 
  Layers, 
  Info,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations/fade-in';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { PulseBeacon } from '@/components/animations/pulse-beacon';
import { TextReveal } from '@/components/animations/text-animations';

interface RoomListProps {
  onSelectRoom: (roomId: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onSelectRoom }) => {
  const { rooms, currentUser } = useApp();

  if (!currentUser) return null;

  // Filter rooms based on user's access rights
  const accessibleRooms = rooms.filter((r) => 
    currentUser.role === 'superadmin' || (currentUser.accessibleRoomIds || []).includes(r.id)
  );

  const totalAccessToday = rooms.reduce((acc, r) => acc + r.todayAccessCount, 0);
  const activeAlarms = rooms.filter((r) => r.isAlarmActive).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Hero Header & User Welcome */}
      <FadeIn direction="up">
        <Card className="p-4 sm:p-7 space-y-4 sm:space-y-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-1 sm:space-y-1.5">
              <Badge variant="success" icon={<PulseBeacon color="emerald" size="sm" />}>
                Sistem Biometrik Aktif
              </Badge>

              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                Selamat Datang, <TextReveal text={currentUser.name} delay={0.1} />
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {currentUser.role === 'user' && (
                  "Anda memiliki hak akses fisik menggunakan fingerprint pada ruangan di bawah ini. Anda dapat memeriksa status sensor dan log autentikasi personal Anda."
                )}
                {currentUser.role === 'admin' && (
                  "Anda memiliki hak akses monitoring penuh dan pengendalian kunci darurat khusus pada ruangan yang diotorisasikan kepada Anda. Seluruh log keamanan tercatat aman."
                )}
                {currentUser.role === 'superadmin' && (
                  "Hak akses Super Administrator aktif: Konfigurasi IoT, Live MQTT Telemetry, pendaftaran sidik jari AS608, remote unlock, dan manajemen pengguna."
                )}
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 pt-1 lg:pt-0">
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Ruangan</div>
              <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                <AnimatedCounter value={accessibleRooms.length} /> <span className="text-[10px] sm:text-xs text-slate-400 font-normal">Ruang</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Total Akses</div>
              <div className="text-base sm:text-lg font-bold text-slate-100 font-mono mt-0.5">
                <AnimatedCounter value={totalAccessToday} /> <span className="text-[10px] sm:text-xs text-slate-400 font-normal">Hari Ini</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Alarm</div>
              <div className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${activeAlarms > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeAlarms > 0 ? `${activeAlarms} Aktif` : 'Aman'}
              </div>
            </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Role Notice Callout */}
      {currentUser.role === 'user' && (
        <div className="p-3.5 rounded-xl bg-[#0c111d] border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
          <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Mode Akses Pengguna Biasa:</span> Sesuai standar keamanan sistem, Anda dapat melihat log autentikasi personal Anda dan membuka pintu fisik menggunakan sensor fingerprint terdaftar.
          </div>
        </div>
      )}

      {/* Rooms Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Daftar Ruangan Terdaftar
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Pilih ruangan untuk melihat status IoT dan log aktivitas
          </p>
        </div>

        <span className="text-[11px] sm:text-xs font-mono text-slate-400 bg-slate-900 px-2 sm:px-2.5 py-1 rounded-md border border-slate-800 shrink-0">
          {accessibleRooms.length} Ruang
        </span>
      </div>

      {/* Room Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5" staggerDelay={0.1}>
        {accessibleRooms.map((room) => (
          <StaggerItem key={room.id}>
            <RoomCard
              room={room}
              onSelect={onSelectRoom}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {accessibleRooms.length === 0 && (
        <div className="text-center py-10 sm:py-12 p-6 rounded-2xl bg-[#0c111d] border border-slate-800 space-y-2">
          <Lock className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Tidak Ada Hak Akses Ruangan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Akun Anda belum diberikan hak akses ke ruangan manapun. Silakan hubungi Administrator untuk meminta otorisasi.
          </p>
        </div>
      )}

    </div>
  );
};
