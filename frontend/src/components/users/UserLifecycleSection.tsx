import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Room, getUserAccessValidity } from "@/types";
import {
  Search,
  X,
  Clock,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  DoorClosed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserLifecycleSectionProps {
  users: User[];
  rooms: Room[];
  onExtendAccess: (user: User) => void;
}

type LifecycleFilter = "ALL" | "EXPIRED" | "EXPIRING_SOON" | "TEMPORAL" | "PERMANENT";

export const UserLifecycleSection: React.FC<UserLifecycleSectionProps> = ({
  users,
  rooms,
  onExtendAccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<LifecycleFilter>("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Only consider active/verified or expired users in lifecycle
  const lifecycleUsers = useMemo(() => {
    return users.filter((u) => u.status !== "PENDING_APPROVAL" && u.status !== "REJECTED");
  }, [users]);

  // Telemetry metrics
  const { permanentCount, temporalCount, expiringSoonCount, expiredCount } = useMemo(() => {
    let perm = 0;
    let temp = 0;
    let expiring = 0;
    let expired = 0;

    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    lifecycleUsers.forEach((u) => {
      const validity = getUserAccessValidity(u);

      if (!u.validUntil) {
        perm++;
      } else if (validity.isExpired || u.status === "EXPIRED") {
        expired++;
      } else {
        temp++;
        const diffMs = new Date(u.validUntil).getTime() - now;
        if (diffMs > 0 && diffMs <= sevenDaysMs) {
          expiring++;
        }
      }
    });

    return {
      permanentCount: perm,
      temporalCount: temp,
      expiringSoonCount: expiring,
      expiredCount: expired,
    };
  }, [lifecycleUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return lifecycleUsers.filter((user) => {
      const validity = getUserAccessValidity(user);
      const isPermanent = !user.validUntil;
      const isExpired = validity.isExpired || user.status === "EXPIRED";

      const diffMs = user.validUntil ? new Date(user.validUntil).getTime() - now : 0;
      const isExpiringSoon = !isPermanent && !isExpired && diffMs > 0 && diffMs <= sevenDaysMs;

      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filterTab === "EXPIRED") matchesFilter = isExpired;
      else if (filterTab === "EXPIRING_SOON") matchesFilter = isExpiringSoon;
      else if (filterTab === "TEMPORAL") matchesFilter = !isPermanent && !isExpired;
      else if (filterTab === "PERMANENT") matchesFilter = isPermanent;

      return matchesSearch && matchesFilter;
    });
  }, [lifecycleUsers, searchTerm, filterTab]);

  return (
    <div className="space-y-3.5 font-sans">
      {/* ── Lifecycle Telemetry Summary Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* 1. Akses Permanen */}
        <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
                Akses Permanen
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#1a1a1a]">
                {permanentCount}
                <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                  Akun
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#0f762a] shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* 2. Akses Temporal Aktif */}
        <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
                Akses Temporal
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#5645d4]">
                {temporalCount}
                <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                  Akun
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#5645d4] shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* 3. Mendekati Kedaluwarsa (< 7 Hari) */}
        <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
                Mendekati Berakhir
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#dd5b00]">
                {expiringSoonCount}
                <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                  Akun
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#dd5b00] shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* 4. Kedaluwarsa */}
        <div className="rounded-xl border border-[#e5e3df] bg-white p-3 sm:p-3.5 shadow-2xs hover:border-[#c8c4be] hover:bg-[#fafaf9] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[11px] sm:text-xs font-medium text-[#787671] truncate block">
                Kedaluwarsa
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight leading-none text-[#e03131]">
                {expiredCount}
                <span className="text-xs font-normal text-[#787671] font-sans ml-1">
                  Akun
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-lg border border-[#e5e3df] bg-[#f6f5f4] flex items-center justify-center text-[#e03131] shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Tab Bar ── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#e5e3df] shadow-2xs space-y-3">
        <div className="relative w-full">
          <Input
            ref={searchInputRef}
            type="text"
            aria-label="Cari nama atau email pengguna"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-[#a4a097]" />}
            className="h-10 text-xs sm:text-sm bg-[#fafaf9] hover:bg-[#f6f5f4] focus:bg-white border-[#e5e3df] focus:border-[#5645d4] focus:ring-2 focus:ring-[#5645d4]/15 rounded-md pl-9 pr-14 text-[#1a1a1a] placeholder:text-[#a4a097] transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Hapus pencarian"
                className="text-[#a4a097] hover:text-[#5d5b54] p-1 cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center font-mono text-[11px] text-[#787671] bg-white border border-[#e5e3df] rounded px-1.5 py-0.5 shadow-xs select-none pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-[#ede9e4]" role="tablist">
          {[
            { id: "ALL", label: "Semua Akun", count: lifecycleUsers.length },
            { id: "EXPIRED", label: "Kedaluwarsa", count: expiredCount, isDanger: expiredCount > 0 },
            { id: "EXPIRING_SOON", label: "Mendekati Berakhir (< 7 Hari)", count: expiringSoonCount, isWarning: expiringSoonCount > 0 },
            { id: "TEMPORAL", label: "Akses Temporal", count: temporalCount },
            { id: "PERMANENT", label: "Akses Permanen", count: permanentCount },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            const hasAlert = Boolean((tab.isDanger || tab.isWarning) && tab.count > 0);

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterTab(tab.id as LifecycleFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 border shrink-0",
                  isActive
                    ? "bg-[#5645d4] text-white border-[#5645d4] shadow-xs"
                    : "bg-[#fafaf9] hover:bg-[#f6f5f4] text-[#787671] hover:text-[#1a1a1a] border-[#e5e3df]"
                )}
              >
                {!isActive && hasAlert && (
                  <span className="relative flex h-2 w-2 mr-0.5 shrink-0">
                    <span
                      className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        tab.isDanger ? "bg-[#e03131]" : "bg-[#dd5b00]"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        tab.isDanger ? "bg-[#e03131]" : "bg-[#dd5b00]"
                      )}
                    />
                  </span>
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded-full tabular-nums",
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : tab.isDanger
                      ? "bg-[#fdf2f2] text-[#e03131] border border-[#e03131]/30 font-bold"
                      : tab.isWarning
                      ? "bg-[#fdf3eb] text-[#dd5b00] border border-[#dd5b00]/30 font-bold"
                      : "bg-[#e5e3df] text-[#787671]"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lifecycle Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredUsers.map((user) => {
          const validity = getUserAccessValidity(user);
          const isPermanent = !user.validUntil;
          const isExpired = validity.isExpired || user.status === "EXPIRED";

          return (
            <div
              key={user.id}
              className={cn(
                "border rounded-xl bg-white p-4 space-y-3 transition-all shadow-2xs hover:shadow-xs",
                isExpired
                  ? "border-[#e03131]/30 bg-[#fdf2f2]/20"
                  : "border-[#e5e3df] hover:border-[#c8c4be]"
              )}
            >
              {/* Header: User identity & Validity Status Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-[#1a1a1a] truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-[#787671] font-sans truncate mt-0.5">
                      <span className="font-mono font-medium text-[#5d5b54]">{user.email}</span>{" "}
                      <span className="text-[#a4a097]">&bull;</span> <span className="uppercase text-[10px] font-semibold">{user.role}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded-full border shrink-0",
                    validity.badgeVariant === "success"
                      ? "bg-[#ebfbee] text-[#1aae39] border-[#1aae39]/30"
                      : validity.badgeVariant === "warning"
                      ? "bg-[#fdf3eb] text-[#dd5b00] border-[#dd5b00]/30"
                      : "bg-[#fdf2f2] text-[#e03131] border-[#e03131]/30"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      validity.badgeVariant === "success"
                        ? "bg-[#1aae39]"
                        : validity.badgeVariant === "warning"
                        ? "bg-[#dd5b00] animate-pulse"
                        : "bg-[#e03131]"
                    )}
                  />
                  <span>{validity.statusText}</span>
                </span>
              </div>

              {/* Timeline & Duration Box */}
              <div className="p-3 rounded-lg bg-[#fafaf9] border border-[#ede9e4] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#787671] font-medium">Tipe Masa Berlaku:</span>
                  <span className="font-semibold text-[#1a1a1a]">
                    {isPermanent ? "Permanen (Tanpa Batas)" : "Batas Waktu Spesifik"}
                  </span>
                </div>

                {user.validUntil && !isPermanent ? (
                  <div className="space-y-1 pt-1.5 border-t border-[#ede9e4]">
                    <div className="flex items-center justify-between text-[11px] text-[#787671]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#a4a097]" />
                        <span>Kedaluwarsa Pada:</span>
                      </span>
                      <span className="font-mono font-medium text-[#37352f]">
                        {new Date(user.validUntil).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-[#787671]">Sisa Waktu:</span>
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          isExpired ? "text-[#e03131]" : "text-[#5645d4]"
                        )}
                      >
                        {validity.remainingText}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#1aae39] flex items-center gap-1.5 pt-1 border-t border-[#ede9e4]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Akses permanen aktif tanpa batas kedaluwarsa otomatis.</span>
                  </div>
                )}
              </div>

              {/* Accessible Rooms */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#787671]">
                <DoorClosed className="h-3.5 w-3.5 text-[#a4a097] shrink-0" />
                <span className="truncate">
                  Akses berlaku untuk {user.accessibleRoomIds?.length || rooms.length} ruangan lab
                </span>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#ede9e4] flex items-center justify-end">
                {isExpired ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onExtendAccess(user)}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5 text-white shrink-0" />}
                    className="w-full text-xs h-8 bg-[#e03131] hover:bg-[#c92a2a] text-white font-medium rounded-md cursor-pointer transition-all shadow-xs"
                  >
                    Perpanjang Masa Akses Ruangan
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onExtendAccess(user)}
                    leftIcon={<Clock className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />}
                    className="text-xs h-8 px-3.5 border-[#e5e3df] text-[#5645d4] hover:bg-[#fafaf9] hover:border-[#c8c4be] font-medium rounded-md cursor-pointer transition-all shadow-xs"
                  >
                    {isPermanent ? "Atur Batas Waktu Akses" : "Sesuaikan Durasi Akses"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="rounded-lg border border-[#e5e3df] bg-white px-6 py-10 text-center sm:py-12 shadow-notion-1">
          <Search className="mx-auto h-8 w-8 text-[#5d5b54]" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-semibold text-[#1a1a1a]">
            {filterTab === "EXPIRED"
              ? "Tidak ada akun kedaluwarsa"
              : searchTerm
              ? `Tidak ada hasil untuk “${searchTerm}”`
              : "Pengguna tidak ditemukan"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#5d5b54]">
            {filterTab === "EXPIRED"
              ? "Seluruh sivitas memiliki masa akses aktif atau izin akses permanen."
              : searchTerm
              ? `Tidak ada data pengguna yang cocok dengan “${searchTerm}” pada kategori ini.`
              : "Coba gunakan kata kunci pencarian yang berbeda atau reset filter kategori."}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                searchInputRef.current?.focus();
              }}
              className="mt-4 text-xs font-semibold text-[#5645d4] underline underline-offset-4 hover:text-[#4534b3] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] rounded"
            >
              Hapus pencarian
            </button>
          )}
        </div>
      )}
    </div>
  );
};
