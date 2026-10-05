import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Room } from "@/types";
import {
  Search,
  X,
  CheckCircle2,
  XCircle,
  CheckCheck,
  CheckSquare,
  Square,
  DoorClosed,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserRequestsSectionProps {
  users: User[];
  rooms: Room[];
  selectedUserIds: string[];
  onToggleSelectUser: (userId: string) => void;
  onSelectAllPending: (pendingIds: string[]) => void;
  onApproveUser: (user: User) => void;
  onRejectUser: (user: User) => void;
  onOpenBatchApproval: () => void;
  onOpenBatchReject: () => void;
}

type RequestTab = "PENDING" | "REJECTED" | "ALL";

export const UserRequestsSection: React.FC<UserRequestsSectionProps> = ({
  users,
  rooms,
  selectedUserIds,
  onToggleSelectUser,
  onSelectAllPending,
  onApproveUser,
  onRejectUser,
  onOpenBatchApproval,
  onOpenBatchReject,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<RequestTab>("PENDING");
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

  // Filter requests (users that are pending approval or rejected)
  const requestUsers = useMemo(() => {
    return users.filter(
      (u) => u.status === "PENDING_APPROVAL" || u.status === "REJECTED"
    );
  }, [users]);

  const filteredRequests = useMemo(() => {
    return requestUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === "PENDING") {
        matchesTab = user.status === "PENDING_APPROVAL";
      } else if (activeTab === "REJECTED") {
        matchesTab = user.status === "REJECTED";
      }

      return matchesSearch && matchesTab;
    });
  }, [requestUsers, searchTerm, activeTab]);

  const tabCounts = useMemo(() => ({
    PENDING: requestUsers.filter((u) => u.status === "PENDING_APPROVAL").length,
    REJECTED: requestUsers.filter((u) => u.status === "REJECTED").length,
    ALL: requestUsers.length,
  }), [requestUsers]);

  const pendingRequestsInView = useMemo(() => {
    return filteredRequests.filter((u) => u.status === "PENDING_APPROVAL");
  }, [filteredRequests]);

  const isAllPendingSelected =
    pendingRequestsInView.length > 0 &&
    pendingRequestsInView.every((u) => selectedUserIds.includes(u.id));

  return (
    <div className="space-y-3.5 font-sans">
      {/* ── Search & Tab Bar ── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#e5e3df] shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Input
            ref={searchInputRef}
            type="text"
            aria-label="Cari permohonan pendaftaran"
            placeholder="Cari permohonan berdasarkan nama atau email..."
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
            { id: "PENDING", label: "Menunggu Review", count: tabCounts.PENDING, isPending: true },
            { id: "REJECTED", label: "Riwayat Ditolak", count: tabCounts.REJECTED },
            { id: "ALL", label: "Semua Riwayat", count: tabCounts.ALL },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const hasPendingBadge = tab.isPending && tab.count > 0;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as RequestTab)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 border shrink-0",
                  isActive
                    ? "bg-[#5645d4] text-white border-[#5645d4] shadow-xs"
                    : "bg-[#fafaf9] hover:bg-[#f6f5f4] text-[#787671] hover:text-[#1a1a1a] border-[#e5e3df]"
                )}
              >
                {!isActive && hasPendingBadge && (
                  <span className="relative flex h-2 w-2 mr-0.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e03131] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e03131]" />
                  </span>
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded-full tabular-nums",
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : hasPendingBadge
                      ? "bg-[#fdf2f2] text-[#e03131] border border-[#e03131]/30 font-bold"
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

      {/* ── Batch Operation Bar for Pending Requests ── */}
      {pendingRequestsInView.length > 0 && activeTab === "PENDING" && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-[#fafaf9] border border-[#e5e3df] flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSelectAllPending(pendingRequestsInView.map((u) => u.id))}
              className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] hover:text-[#5645d4] cursor-pointer transition-colors"
            >
              {isAllPendingSelected ? (
                <CheckSquare className="h-4 w-4 text-[#5645d4]" />
              ) : (
                <Square className="h-4 w-4 text-[#a4a097]" />
              )}
              <span>
                {isAllPendingSelected
                  ? "Batal Pilih Semua"
                  : `Pilih Semua Permohonan (${pendingRequestsInView.length})`}
              </span>
            </button>
            {selectedUserIds.length > 0 && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#f6f5f4] text-[#5645d4] border border-[#e5e3df] font-semibold">
                {selectedUserIds.length} terpilih
              </span>
            )}
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenBatchReject}
                className="h-7 px-2.5 text-xs text-[#e03131] border-[#e5e3df] hover:bg-[#fafaf9] hover:border-[#c8c4be] cursor-pointer font-medium rounded-md"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak ({selectedUserIds.length})
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onOpenBatchApproval}
                className="h-7 px-2.5 text-xs bg-[#5645d4] hover:bg-[#4534b3] text-white cursor-pointer font-medium shadow-xs rounded-md transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Setujui Massal ({selectedUserIds.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Requests Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredRequests.map((user) => {
          const isPending = user.status === "PENDING_APPROVAL";
          const isRejected = user.status === "REJECTED";
          const isSelected = selectedUserIds.includes(user.id);

          // Find requested room objects
          const requestedRooms = (user.requestedRoomIds || user.accessibleRoomIds || [])
            .map((id) => rooms.find((r) => r.id === id))
            .filter((r): r is Room => Boolean(r));

          return (
            <div
              key={user.id}
              className={cn(
                "border rounded-xl bg-white p-4 space-y-3 transition-all shadow-2xs hover:shadow-xs",
                isSelected
                  ? "ring-2 ring-[#5645d4] border-[#5645d4] bg-[#fafaf9]"
                  : isPending
                  ? "border-[#e5e3df] hover:border-[#c8c4be]"
                  : "border-[#e5e3df] bg-[#fafaf9]/60"
              )}
            >
              {/* Top Row: Email & Status Pill */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#ede9e4]">
                <div className="flex items-center gap-2 min-w-0">
                  {isPending && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectUser(user.id)}
                      aria-label={`Pilih permohonan ${user.name}`}
                      className="h-4 w-4 rounded border-[#c8c4be] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer shrink-0"
                    />
                  )}
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#5d5b54] truncate">
                    <span>{user.email}</span>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded-full border shrink-0",
                    isPending
                      ? "bg-[#fdf3eb] text-[#dd5b00] border-[#dd5b00]/30"
                      : isRejected
                      ? "bg-[#fdf2f2] text-[#e03131] border-[#e03131]/30"
                      : "bg-[#ebfbee] text-[#1aae39] border-[#1aae39]/30"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isPending ? "bg-[#dd5b00] animate-pulse" : isRejected ? "bg-[#e03131]" : "bg-[#1aae39]"
                    )}
                  />
                  <span>
                    {isPending ? "Menunggu Review" : isRejected ? "Ditolak" : "Telah Disetujui"}
                  </span>
                </span>
              </div>

              {/* Applicant Profile */}
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs sm:text-sm text-[#1a1a1a] truncate">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-[#787671] font-mono truncate mt-0.5">
                    {user.email} &bull; <span className="uppercase">{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Requested Rooms */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[#787671] uppercase tracking-wider">
                  Permintaan Ruangan Laboratorium
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {requestedRooms.length > 0 ? (
                    requestedRooms.map((room) => (
                      <span
                        key={room.id}
                        className="inline-flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded-md bg-[#fafaf9] text-[#5d5b54] border border-[#e5e3df]"
                      >
                        <DoorClosed className="h-3 w-3 text-[#5d5b54]" />
                        <span>{room.name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#787671] italic">
                      Tidak ada ruangan spesifik yang diminta
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="pt-2 border-t border-[#ede9e4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onRejectUser(user)}
                    leftIcon={<XCircle className="h-3.5 w-3.5 shrink-0" />}
                    className="text-xs h-8 px-3 bg-white text-[#e03131] border border-[#e5e3df] hover:bg-[#fafaf9] hover:border-[#c8c4be] font-medium rounded-md shadow-xs cursor-pointer w-full sm:w-auto justify-center"
                  >
                    Tolak Permohonan
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onApproveUser(user)}
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                    className="text-xs h-8 px-3.5 font-medium bg-[#5645d4] hover:bg-[#4534b3] text-white rounded-md shadow-xs cursor-pointer transition-all w-full sm:w-auto justify-center"
                  >
                    Review &amp; Setujui Akses
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="p-10 text-center rounded-xl bg-white border border-[#e5e3df] text-[#787671] space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-lg bg-[#f6f5f4] border border-[#e5e3df] flex items-center justify-center mx-auto text-[#a4a097]">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1a1a]">
              {activeTab === "PENDING"
                ? "Tidak Ada Permohonan Menunggu"
                : "Tidak Ada Riwayat Permohonan"}
            </p>
            <p className="text-xs text-[#787671] max-w-sm mx-auto">
              {activeTab === "PENDING"
                ? "Semua permohonan pendaftaran telah ditinjau dan disetujui oleh Superadmin."
                : "Belum ada riwayat permohonan yang sesuai dengan filter pencarian."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
