import React, { useState } from 'react';
import { useApp } from '@/context';
import { RoomCard } from './RoomCard';
import { 
  Layers, 
  Info,
  Lock,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations/fade-in';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { TextReveal } from '@/components/animations/text-animations';

interface RoomListProps {
  onSelectRoom: (roomId: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onSelectRoom }) => {
  const { rooms, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  // Filter rooms based on user's access rights
  const accessibleRooms = rooms.filter((r) => 
    currentUser.role === 'superadmin' || (currentUser.accessibleRoomIds || []).includes(r.id)
  );

  const filteredRooms = accessibleRooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAccessToday = rooms.reduce((acc, r) => acc + r.todayAccessCount, 0);
  const activeAlarms = rooms.filter((r) => r.isAlarmActive).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Hero Header & User Welcome */}
      <FadeIn direction="up">
        <Card className="p-4 sm:p-7 space-y-4 sm:space-y-0 relative overflow-hidden bg-[#0c111d] border-white/[0.09]">
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/15 via-purple-500/10 to-transparent rounded-full pointer-events-none blur-3xl -mr-20 -mt-20" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Selamat Datang, <TextReveal text={currentUser.name} delay={0.1} />
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {currentUser.role === 'user' && (
                  "Anda memiliki hak akses fisik biometrik fingerprint AS608 pada ruangan terdaftar. Anda dapat memantau status fisik pintu, solenoid, dan riwayat akses personal Anda."
                )}
                {currentUser.role === 'admin' && (
                  "Anda memiliki hak akses monitoring penuh, remote solenoid unlock darurat (5s safety auto-relock), dan manajemen alarm buzzer pada ruangan terdaftar."
                )}
                {currentUser.role === 'superadmin' && (
                  "Hak akses Super Administrator aktif: Konfigurasi IoT Hardware, Live Telemetry, pendaftaran sidik jari AS608, remote unlock, dan manajemen pengguna."
                )}
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 shrink-0 pt-1 lg:pt-0">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] flex flex-col justify-between shadow-inner">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate font-mono">Ruangan</div>
                <div className="text-lg sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                  <AnimatedCounter value={accessibleRooms.length} /> <span className="text-[10px] sm:text-xs text-slate-400 font-normal font-sans">Lab</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] flex flex-col justify-between shadow-inner">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate font-mono">Total Akses</div>
                <div className="text-lg sm:text-2xl font-extrabold text-slate-100 font-mono mt-0.5">
                  <AnimatedCounter value={totalAccessToday} /> <span className="text-[10px] sm:text-xs text-slate-400 font-normal font-sans">Hari Ini</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-white/[0.09] flex flex-col justify-between shadow-inner">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate font-mono">Status Alarm</div>
                <div className={`text-base sm:text-xl font-bold font-mono mt-0.5 ${activeAlarms > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {activeAlarms > 0 ? `${activeAlarms} Aktif` : 'Aman (Normal)'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Role Notice Callout */}
      {currentUser.role === 'user' && (
        <div className="p-3.5 rounded-2xl bg-[#0c111d] border border-sky-500/25 flex items-start gap-3 text-xs text-slate-300 shadow-md">
          <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Mode Akses Pengguna Biasa:</span> Sesuai standar keamanan laboratorium, Anda dapat melihat log autentikasi personal Anda dan membuka pintu fisik menggunakan sensor sidik jari AS608 terdaftar.
          </div>
        </div>
      )}

      {/* Rooms Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            Daftar Ruangan Terdaftar
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Pilih ruangan untuk melihat status IoT, aktuator Solenoid, dan log audit
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-full sm:w-60">
            <Input
              type="text"
              aria-label="Cari ruangan atau kode"
              placeholder="Cari ruangan / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
              className="h-8.5 text-xs bg-slate-950/80 border-white/10"
            />
          </div>

          <span className="text-[11px] sm:text-xs font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
            {filteredRooms.length}/{accessibleRooms.length} Ruang
          </span>
        </div>
      </div>

      {/* Room Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5" staggerDelay={0.1}>
        {filteredRooms.map((room) => (
          <StaggerItem key={room.id}>
            <RoomCard
              room={room}
              onSelect={onSelectRoom}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {filteredRooms.length === 0 && (
        <div className="text-center py-10 sm:py-12 p-6 rounded-2xl bg-[#080e1b] border border-slate-800 space-y-2">
          <Lock className="h-8 w-8 text-slate-500 mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-white">Tidak Ada Ruangan Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? `Tidak ada ruangan yang cocok dengan pencarian "${searchQuery}".` 
              : 'Akun Anda belum memiliki otorisasi ruangan. Hubungi Administrator untuk akses.'
            }
          </p>
        </div>
      )}

    </div>
  );
};
