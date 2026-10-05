import React, { useMemo, useState } from 'react';
import { useApp } from '@/context';
import { RoomCard } from './RoomCard';
import { CircleAlert, CircleCheck, Layers, Search, SearchX, ShieldAlert, WifiOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StaggerContainer, StaggerItem } from '@/components/animations/fade-in';
import { Room } from '@/types';

type RoomFilter = 'all' | 'attention' | 'offline' | 'safe';
type RoomCondition = Exclude<RoomFilter, 'all'> | 'alarm';

const getRoomCondition = (room: Room): RoomCondition => {
  if (room.isAlarmActive) return 'alarm';
  if (room.deviceStatus === 'OFFLINE') return 'offline';
  if (room.doorStatus === 'OPEN' || room.lockStatus === 'UNLOCKED') return 'attention';
  return 'safe';
};

const conditionPriority: Record<RoomCondition, number> = { alarm: 0, attention: 1, offline: 2, safe: 3 };

interface RoomListProps {
  onSelectRoom: (roomId: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onSelectRoom }) => {
  const { rooms, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomFilter>('all');

  const accessibleRooms = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'superadmin') return rooms;
    const allowed = new Set(currentUser.accessibleRoomIds ?? []);
    return rooms.filter((room) => allowed.has(room.id));
  }, [rooms, currentUser]);

  const roomCounts = useMemo(() => ({
    alarm: accessibleRooms.filter((room) => getRoomCondition(room) === 'alarm').length,
    attention: accessibleRooms.filter((room) => getRoomCondition(room) === 'attention').length,
    offline: accessibleRooms.filter((room) => getRoomCondition(room) === 'offline').length,
    safe: accessibleRooms.filter((room) => getRoomCondition(room) === 'safe').length,
  }), [accessibleRooms]);

  const displayedRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return accessibleRooms
      .filter((room) => {
        const condition = getRoomCondition(room);
        const matchesFilter = activeFilter === 'all' || condition === activeFilter ||
          (activeFilter === 'attention' && condition === 'alarm');
        const matchesSearch = !query || [room.name, room.deviceId, room.description]
          .some((value) => value.toLowerCase().includes(query));
        return matchesFilter && matchesSearch;
      })
      .map((room) => ({ room, priority: conditionPriority[getRoomCondition(room)] }))
      .sort((a, b) => a.priority - b.priority || a.room.name.localeCompare(b.room.name))
      .map(({ room }) => room);
  }, [accessibleRooms, activeFilter, searchQuery]);

  const filters: Array<{ id: RoomFilter; label: string; count: number; icon: React.ReactNode; activeClass: string }> = [
    { id: 'all', label: 'Semua', count: accessibleRooms.length, icon: <Layers className="h-3.5 w-3.5" />, activeClass: 'border-[#c8c4be] bg-[#f6f5f4] text-[#1a1a1a] font-semibold' },
    { id: 'attention', label: 'Perlu perhatian', count: roomCounts.alarm + roomCounts.attention, icon: <CircleAlert className="h-3.5 w-3.5" />, activeClass: 'border-[#c8c4be] bg-[#f6f5f4] text-[#1a1a1a] font-semibold' },
    { id: 'offline', label: 'Offline', count: roomCounts.offline, icon: <WifiOff className="h-3.5 w-3.5" />, activeClass: 'border-[#c8c4be] bg-[#f6f5f4] text-[#1a1a1a] font-semibold' },
    { id: 'safe', label: 'Aman', count: roomCounts.safe, icon: <CircleCheck className="h-3.5 w-3.5" />, activeClass: 'border-[#c8c4be] bg-[#f6f5f4] text-[#1a1a1a] font-semibold' },
  ];

  const isFiltering = activeFilter !== 'all' || Boolean(searchQuery.trim());

  if (!currentUser) return null;

  return (
    <section className="space-y-3" aria-labelledby="room-list-heading">
      <div className="space-y-2 pb-2 border-b border-[#e5e3df]">
        <div>
          <h2 id="room-list-heading" className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#1a1a1a]">
            Daftar Ruangan
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-xs md:text-sm text-[#787671] leading-normal">
            Pilih ruangan untuk telemetri dan kontrol solenoid.
          </p>
        </div>

        <div className="flex w-full items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              type="text"
              aria-label="Cari nama, device ID, atau deskripsi ruangan"
              placeholder="Cari ruangan…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              icon={<Search className="h-4 w-4 text-[#a4a097]" />}
              className="h-9 sm:h-10 text-xs sm:text-sm bg-[#fafaf9] hover:bg-[#f6f5f4] focus:bg-white border-[#e5e3df] focus:border-[#5645d4] rounded-md pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#5d5b54] hover:bg-[#f6f5f4] hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5645d4]"
                aria-label="Hapus pencarian"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <span className="shrink-0 text-[11px] font-mono tabular-nums text-[#5d5b54]" aria-live="polite">
            {displayedRooms.length}/{accessibleRooms.length}
          </span>
        </div>
      </div>

      <div
        role="group"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:flex-wrap"
        aria-label="Filter status ruangan"
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          const isAlert = filter.id === 'attention' && filter.count > 0;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={isActive}
              className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/30 ${isActive ? filter.activeClass : 'border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#f6f5f4] hover:text-[#1a1a1a]'}`}
            >
              <span className={isAlert ? 'text-[#dd5b00]' : undefined} aria-hidden="true">{filter.icon}</span>
              <span>{filter.label}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-80">{filter.count}</span>
            </button>
          );
        })}
      </div>

      {roomCounts.alarm > 0 && activeFilter !== 'attention' && (
        <div className="flex items-start gap-2.5 rounded-md border border-[#fadad9] bg-[#fdf2f2] px-3.5 py-2.5 text-xs text-[#e03131]" role="status">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#e03131]" aria-hidden="true" />
          <p><strong className="font-semibold">{roomCounts.alarm} alarm aktif.</strong> Tinjau ruangan yang memerlukan perhatian segera.</p>
        </div>
      )}

      {displayedRooms.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5" staggerDelay={0.05}>
          {displayedRooms.map((room) => <StaggerItem key={room.id}><RoomCard room={room} onSelect={onSelectRoom} /></StaggerItem>)}
        </StaggerContainer>
      ) : (
        <div className="rounded-lg border border-[#e5e3df] bg-white px-6 py-10 text-center sm:py-12 shadow-notion-1">
          <SearchX className="mx-auto h-8 w-8 text-[#5d5b54]" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-semibold text-[#1a1a1a]">{isFiltering ? 'Tidak ada ruangan yang sesuai' : 'Belum ada ruangan yang dapat diakses'}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#5d5b54]">{searchQuery ? `Tidak ada ruangan yang cocok dengan “${searchQuery}” pada filter ini.` : activeFilter !== 'all' ? 'Tidak ada ruangan dengan status ini dalam daftar akses Anda.' : 'Akun Anda belum memiliki akses ke ruangan mana pun. Hubungi administrator laboratorium untuk meminta akses.'}</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs font-semibold text-[#5645d4] underline underline-offset-4 hover:text-[#4534b3] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] rounded"
            >
              Hapus pencarian
            </button>
          )}
        </div>
      )}
    </section>
  );
};

