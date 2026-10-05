import React, { useMemo } from "react";
import { User, Room } from "../../types";
import {
  Users,
  ShieldCheck,
  DoorClosed,
  Fingerprint,
} from "lucide-react";
import { NumberTicker } from "@/components/animations/number-ticker";
import { cn } from "@/lib/utils";

interface UserStatsOverviewProps {
  users: User[];
  rooms: Room[];
}

export const UserStatsOverview: React.FC<UserStatsOverviewProps> = ({ users, rooms }) => {
  const {
    totalFpCount,
    activeUsersCount,
    pendingUsersCount,
    maxGlobalFpCapacity,
    fpPercentage,
    activePercentage,
    onlineRoomsCount,
  } = useMemo(() => {
    const totalFp = users.reduce((acc, u) => {
      const slots = u.fingerprints
        ? u.fingerprints.length
        : u.fingerprintTemplateIds?.length || (u.fingerprintTemplateId ? 1 : 0);
      return acc + slots;
    }, 0);

    const activeCount = users.filter((u) => u.status === "ACTIVE").length;
    const pendingCount = users.filter((u) => u.status === "PENDING_APPROVAL").length;
    const maxCapacity = 127; // DY50 hardware flash capacity limit per sensor
    const pct = Math.min(100, Math.round((totalFp / maxCapacity) * 100));
    const activePct = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;
    const onRooms = rooms.filter((r) => r.deviceStatus === "ONLINE").length;

    return {
      totalFpCount: totalFp,
      activeUsersCount: activeCount,
      pendingUsersCount: pendingCount,
      maxGlobalFpCapacity: maxCapacity,
      fpPercentage: pct,
      activePercentage: activePct,
      onlineRoomsCount: onRooms,
    };
  }, [users, rooms]);

  return (
    <section
      aria-label="Ringkasan Telemetri dan Pengguna"
      className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 font-sans"
    >
      {/* 1. Total Sivitas */}
      <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
              Total Sivitas
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#1a1a1a]">
              <NumberTicker value={users.length} />
              <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                Pengguna
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#5d5b54] shrink-0">
            <Users className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. Kapasitas DY50 */}
      <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
              Kapasitas DY50
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#1a1a1a]">
              <NumberTicker value={totalFpCount} />
              <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                / {maxGlobalFpCapacity}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#5d5b54] shrink-0">
            <Fingerprint className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. Otorisasi Aktif */}
      <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
              Otorisasi Aktif
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#0f762a]">
              <NumberTicker value={activeUsersCount} />
              <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                / {users.length}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#0f762a] shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 4. Node Terdaftar */}
      <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
              Node Terdaftar
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#1a1a1a]">
              <NumberTicker value={rooms.length} />
              <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                Ruangan
              </span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#5d5b54] shrink-0">
            <DoorClosed className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
};
