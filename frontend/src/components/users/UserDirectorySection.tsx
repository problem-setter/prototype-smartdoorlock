import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Room, UserRole } from "@/types";
import {
  Search,
  SearchX,
  X,
  User as UserIcon,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  Trash2,
  Edit3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { RoomBadgeList } from "./RoomBadgeList";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { cn } from "@/lib/utils";

interface UserDirectorySectionProps {
  users: User[];
  rooms: Room[];
  currentUser: User | null;
  onEditUser: (user: User, initialTab: "info" | "fingerprint" | "rooms") => void;
  onDeleteUser: (user: User) => void;
}

type RoleFilter = "ALL" | UserRole;

export const UserDirectorySection: React.FC<UserDirectorySectionProps> = ({
  users,
  rooms,
  currentUser,
  onEditUser,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
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

  // Only consider active/verified or non-pending users in the directory
  const directoryUsers = useMemo(() => {
    return users.filter((u) => u.status !== "PENDING_APPROVAL" && u.status !== "REJECTED");
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return directoryUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [directoryUsers, searchTerm, roleFilter]);

  const roleCounts = useMemo(() => ({
    ALL: directoryUsers.length,
    superadmin: directoryUsers.filter((u) => u.role === "superadmin").length,
    admin: directoryUsers.filter((u) => u.role === "admin").length,
    user: directoryUsers.filter((u) => u.role === "user").length,
  }), [directoryUsers]);

  return (
    <div className="space-y-3.5 font-sans">
      {/* ── Search & Role Filter Header ── */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-[#e5e3df] shadow-2xs space-y-2.5">
        {/* Search Input */}
        <div className="relative w-full">
          <Input
            ref={searchInputRef}
            type="text"
            aria-label="Cari nama atau email pengguna"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-[#a4a097]" />}
            className="h-9 sm:h-10 text-xs sm:text-sm bg-[#fafaf9] hover:bg-[#f6f5f4] focus:bg-white border-[#e5e3df] focus:border-[#5645d4] focus:ring-2 focus:ring-[#5645d4]/15 rounded-md pl-9 pr-14 text-[#1a1a1a] placeholder:text-[#a4a097] transition-all"
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

        {/* Quick Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#ede9e4]">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" role="tablist">
            {[
              { id: "ALL", label: "Semua Pengguna", count: roleCounts.ALL },
              { id: "superadmin", label: "Superadmin", count: roleCounts.superadmin },
              { id: "admin", label: "Admin Lab", count: roleCounts.admin },
              { id: "user", label: "Pengguna", count: roleCounts.user },
            ].map((tab) => {
              const isActive = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setRoleFilter(tab.id as RoleFilter)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 border shrink-0 select-none",
                    isActive
                      ? "bg-[#5645d4] text-white border-[#5645d4] shadow-xs"
                      : "bg-[#fafaf9] hover:bg-[#f6f5f4] text-[#787671] hover:text-[#1a1a1a] border-[#e5e3df]"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded-full tabular-nums",
                      isActive ? "bg-white/20 text-white font-semibold" : "bg-[#e5e3df] text-[#787671]"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Summary & Count Header ── */}
      <div className="flex items-center justify-between px-1 text-xs text-[#787671]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1aae39]" />
          <span>
            Menampilkan <strong className="text-[#1a1a1a]">{filteredUsers.length}</strong> pengguna
          </span>
        </div>
        {(searchTerm || roleFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("ALL");
            }}
            className="text-[#5645d4] hover:text-[#4534b3] hover:underline cursor-pointer text-xs font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ── User Directory Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {filteredUsers.map((user) => {
          const isSuperadmin = user.role === "superadmin";
          const isCurrentUser = currentUser?.id === user.id;

          const fpCount = user.fingerprints
            ? user.fingerprints.length
            : user.fingerprintTemplateIds?.length || (user.fingerprintTemplateId ? 1 : 0);

          return (
            <SwipeRow
              key={user.id}
              action1={{
                label: "Hapus",
                icon: <Trash2 className="h-4 w-4" />,
                variant: "destructive",
                disabled: isSuperadmin,
                ariaLabel: isSuperadmin
                  ? `Hapus akun ${user.name} (tidak tersedia)`
                  : `Hapus akun ${user.name}`,
                onClick: () => {
                  if (isSuperadmin) return;
                  onDeleteUser(user);
                },
              }}
              action2={{
                label: "Kelola",
                icon: <Edit3 className="h-4 w-4 text-[#5645d4]" />,
                variant: "neutral",
                ariaLabel: `Kelola profil pengguna ${user.name}`,
                onClick: () => onEditUser(user, "info"),
              }}
              className="border border-[#e5e3df] hover:border-[#c8c4be] rounded-xl overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-all"
              contentClassName="p-3.5 sm:p-4 space-y-3 bg-white"
            >
              {/* Header: Identity & Role Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-[#1a1a1a] flex items-center gap-1.5 truncate">
                      <span className="truncate">{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] sm:text-[11px] font-sans px-1.5 py-0.5 rounded-md bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] shrink-0 font-semibold">
                          Anda
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#787671] font-mono truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Role Pill */}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df] shrink-0">
                  {isSuperadmin ? (
                    <ShieldAlert className="h-3 w-3 text-[#5645d4] shrink-0" />
                  ) : user.role === "admin" ? (
                    <KeyRound className="h-3 w-3 text-[#787671] shrink-0" />
                  ) : (
                    <UserIcon className="h-3 w-3 text-[#787671] shrink-0" />
                  )}
                  <span>
                    {isSuperadmin ? "Superadmin" : user.role === "admin" ? "Admin Lab" : "Pengguna"}
                  </span>
                </span>
              </div>

              {/* Status and Biometric Quick Indicators */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-[#787671] pt-0.5">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    user.status === "ACTIVE" ? "bg-[#1aae39]" : "bg-[#a4a097]"
                  )} />
                  <span className="truncate text-[#5d5b54] font-medium uppercase text-[11px]">{user.status}</span>
                </div>

                <div
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border shrink-0",
                    fpCount > 0
                      ? "bg-[#fafaf9] text-[#5d5b54] border-[#e5e3df]"
                      : "bg-[#fafaf9] text-[#a4a097] border-[#e5e3df]"
                  )}
                  title={fpCount > 0 ? `${fpCount} slot sidik jari terdaftar` : "Belum mendaftarkan sidik jari"}
                >
                  <Fingerprint className="h-3 w-3 shrink-0" />
                  <span>{fpCount > 0 ? `${fpCount} Sidik Jari` : "0 DY50"}</span>
                </div>
              </div>

              {/* Room Access Badges List */}
              <div className="pt-1.5 border-t border-[#ede9e4]">
                <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider mb-1.5">
                  Hak Akses Laboratorium
                </div>
                <RoomBadgeList
                  accessibleRoomIds={user.accessibleRoomIds || []}
                  rooms={rooms}
                  isSuperadmin={isSuperadmin}
                  maxVisible={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#ede9e4] flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditUser(user, "fingerprint")}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md text-[#5645d4] hover:text-[#4534b3] bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors cursor-pointer font-medium"
                  title="Kelola Sidik Jari DY50"
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  <span>Biometrik</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditUser(user, "info")}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md text-[#5d5b54] hover:text-[#1a1a1a] bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors cursor-pointer font-medium"
                  title="Edit Profil & Hak Akses"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </SwipeRow>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="rounded-lg border border-[#e5e3df] bg-white px-6 py-10 text-center sm:py-12 shadow-notion-1">
          <SearchX className="mx-auto h-8 w-8 text-[#5d5b54]" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-semibold text-[#1a1a1a]">
            {searchTerm
              ? `Tidak ada hasil untuk “${searchTerm}”`
              : roleFilter !== "ALL"
              ? "Tidak ada pengguna yang sesuai filter"
              : "Belum ada data pengguna"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#5d5b54]">
            {searchTerm
              ? `Tidak ada pengguna aktif yang cocok dengan “${searchTerm}” pada filter yang dipilih.`
              : roleFilter !== "ALL"
              ? "Tidak ditemukan data pengguna yang cocok dengan kombinasi filter peran ini."
              : "Belum ada akun pengguna terdaftar pada direktori sistem."}
          </p>
          {(searchTerm || roleFilter !== "ALL") && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-xs font-semibold text-[#5645d4] underline underline-offset-4 hover:text-[#4534b3] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] rounded"
                >
                  Hapus pencarian
                </button>
              )}
              {roleFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("ALL");
                  }}
                  className="text-xs font-semibold text-[#5645d4] underline underline-offset-4 hover:text-[#4534b3] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] rounded"
                >
                  Reset filter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
