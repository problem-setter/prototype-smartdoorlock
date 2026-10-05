import React, { useState, useMemo, useRef, useEffect } from "react";
import { User, Room } from "@/types";
import {
  Search,
  X,
  Fingerprint,
  Cpu,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserBiometricsSectionProps {
  users: User[];
  rooms: Room[];
  onEnrollUser: (user: User) => void;
}

type BiometricFilter = "ALL" | "ENROLLED" | "UNENROLLED" | "FULL";

export const UserBiometricsSection: React.FC<UserBiometricsSectionProps> = ({
  users,
  rooms,
  onEnrollUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<BiometricFilter>("ALL");
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

  // Only consider active/verified users for biometrics
  const activeUsers = useMemo(() => {
    return users.filter((u) => u.status !== "PENDING_APPROVAL" && u.status !== "REJECTED");
  }, [users]);

  // Telemetry metrics
  const { totalSlotsUsed, maxCapacity, usagePercentage, enrolledCount, unenrolledCount, fullCount } =
    useMemo(() => {
      let totalSlots = 0;
      let enrolled = 0;
      let unenrolled = 0;
      let full = 0;

      activeUsers.forEach((u) => {
        const count = u.fingerprints
          ? u.fingerprints.length
          : u.fingerprintTemplateIds?.length || (u.fingerprintTemplateId ? 1 : 0);

        totalSlots += count;
        if (count >= 3) {
          full++;
          enrolled++;
        } else if (count > 0) {
          enrolled++;
        } else {
          unenrolled++;
        }
      });

      const maxCap = 127;
      const pct = Math.min(100, Math.round((totalSlots / maxCap) * 100));

      return {
        totalSlotsUsed: totalSlots,
        maxCapacity: maxCap,
        usagePercentage: pct,
        enrolledCount: enrolled,
        unenrolledCount: unenrolled,
        fullCount: full,
      };
    }, [activeUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return activeUsers.filter((user) => {
      const count = user.fingerprints
        ? user.fingerprints.length
        : user.fingerprintTemplateIds?.length || (user.fingerprintTemplateId ? 1 : 0);

      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.fingerprints &&
          user.fingerprints.some((f) =>
            f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(f.templateId).includes(searchTerm)
          ));

      let matchesFilter = true;
      if (filterTab === "ENROLLED") matchesFilter = count > 0;
      else if (filterTab === "UNENROLLED") matchesFilter = count === 0;
      else if (filterTab === "FULL") matchesFilter = count >= 3;

      return matchesSearch && matchesFilter;
    });
  }, [activeUsers, searchTerm, filterTab]);

  return (
    <div className="space-y-3.5 font-sans">
      {/* ── Hardware Telemetry & Capacity Banner ── */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#e5e3df] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#f6f5f4] border border-[#e5e3df] text-[#5645d4] flex items-center justify-center shrink-0">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-[#1a1a1a]">
                Kapasitas Flash Memory Sensor DY50
              </h3>
              <p className="text-[11px] sm:text-xs text-[#787671] mt-0.5">
                Sensor optik DY50 mendukung hingga 127 slot sidik jari hardware
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 font-mono shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tabular-nums tracking-tight">
              {totalSlotsUsed}
            </span>
            <span className="text-xs text-[#787671] font-sans">/ {maxCapacity} Slot Terpakai</span>
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border tabular-nums",
                usagePercentage >= 90
                  ? "bg-[#fdf2f2] text-[#e03131] border-[#e03131]/30"
                  : usagePercentage >= 75
                  ? "bg-[#fdf3eb] text-[#dd5b00] border-[#dd5b00]/30"
                  : "bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]"
              )}
            >
              {usagePercentage}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#ede9e4] rounded-full h-1.5 sm:h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              usagePercentage >= 90
                ? "bg-[#e03131]"
                : usagePercentage >= 75
                ? "bg-[#dd5b00]"
                : "bg-[#5645d4]"
            )}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        {/* Informational guide */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#787671] pt-0.5 border-t border-[#ede9e4]">
          <Sparkles className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
          <span>
            Setiap sivitas dapat mendaftarkan <strong>maksimal 3 sidik jari</strong> (mis. Jempol Kanan, Telunjuk Kanan).
          </span>
        </div>
      </div>

      {/* ── Search & Biometric Status Filter ── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#e5e3df] shadow-2xs space-y-3">
        <div className="relative w-full">
          <Input
            ref={searchInputRef}
            type="text"
            aria-label="Cari nama, email, atau nomor slot template"
            placeholder="Cari sivitas, email, atau nomor slot template DY50 (mis. #12, Jempol Kanan)..."
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

        {/* Sub-filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-[#ede9e4]" role="tablist">
          {[
            { id: "ALL", label: "Semua Sivitas", count: activeUsers.length },
            { id: "ENROLLED", label: "Terdaftar (1-3 Slot)", count: enrolledCount },
            { id: "UNENROLLED", label: "Belum Terdaftar (0 Slot)", count: unenrolledCount, isWarning: unenrolledCount > 0 },
            { id: "FULL", label: "Kapasitas Penuh (3/3 Slot)", count: fullCount },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilterTab(tab.id as BiometricFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[32px] flex items-center gap-1.5 border shrink-0",
                  isActive
                    ? "bg-[#5645d4] text-white border-[#5645d4] shadow-xs"
                    : "bg-[#fafaf9] hover:bg-[#f6f5f4] text-[#787671] hover:text-[#1a1a1a] border-[#e5e3df]"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded-full tabular-nums",
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : tab.isWarning
                      ? "bg-[#fdf3eb] text-[#dd5b00] border border-[#dd5b00]/30 font-semibold"
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

      {/* ── Biometric Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredUsers.map((user) => {
          const fingerprints = user.fingerprints || [];
          const slotCount = fingerprints.length > 0
            ? fingerprints.length
            : user.fingerprintTemplateIds?.length || (user.fingerprintTemplateId ? 1 : 0);

          // Total 3 available physical slots per user
          const maxUserSlots = 3;
          const emptySlotsCount = Math.max(0, maxUserSlots - slotCount);

          return (
            <div
              key={user.id}
              className="border border-[#e5e3df] hover:border-[#c8c4be] rounded-xl bg-white p-4 space-y-3 transition-all shadow-2xs hover:shadow-xs"
            >
              {/* Header: User identity & DY50 Slot Usage Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-[#1a1a1a] truncate">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-[#787671] font-mono truncate mt-0.5">
                      {user.email}
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border shrink-0",
                    slotCount === 3
                      ? "bg-[#ebfbee] text-[#1aae39] border-[#1aae39]/30 font-semibold"
                      : slotCount > 0
                      ? "bg-[#fafaf9] text-[#5645d4] border-[#5645d4]/30 font-semibold"
                      : "bg-[#fdf3eb] text-[#dd5b00] border-[#dd5b00]/30 font-semibold"
                  )}
                >
                  <Fingerprint className="h-3 w-3 shrink-0" />
                  <span>{slotCount}/3 Slot</span>
                </span>
              </div>

              {/* Visual 3-Slot Grid */}
              <div className="space-y-1.5 pt-1 border-t border-[#ede9e4]">
                <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider">
                  Slot Template Biometrik Hardware
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {/* Render registered slots */}
                  {fingerprints.length > 0 ? (
                    fingerprints.map((fp, idx) => (
                      <div
                        key={fp.templateId || idx}
                        className="p-2 rounded-lg bg-[#fafaf9] border border-[#e5e3df] text-xs space-y-1 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-[11px] text-[#5645d4]">
                            Slot #{fp.templateId}
                          </span>
                          <CheckCircle2 className="h-3 w-3 text-[#1aae39] shrink-0" />
                        </div>
                        <div className="font-medium text-[11px] text-[#1a1a1a] truncate" title={fp.label}>
                          {fp.label || `Jari ${idx + 1}`}
                        </div>
                        <div className="text-[11px] text-[#787671] truncate">
                          Terverifikasi
                        </div>
                      </div>
                    ))
                  ) : slotCount > 0 ? (
                    <div className="col-span-3 p-2 rounded-lg bg-[#fafaf9] border border-[#e5e3df] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-[#5645d4]" />
                        <span className="font-mono text-xs text-[#1a1a1a]">
                          {user.fingerprintTemplateIds && user.fingerprintTemplateIds.length > 0
                            ? `Slot DY50: #${user.fingerprintTemplateIds.join(", #")}`
                            : `Slot DY50: #${user.fingerprintTemplateId}`}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#1aae39]">Tersinkronisasi</span>
                    </div>
                  ) : (
                    <div className="col-span-3 p-2.5 rounded-lg bg-[#fdf3eb]/40 border border-dashed border-[#dd5b00]/30 text-xs flex items-center justify-between text-[#dd5b00]">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="text-xs">Belum ada template sidik jari terdaftar</span>
                      </div>
                      <span className="text-[11px] font-semibold">Perlu Enrollment</span>
                    </div>
                  )}

                  {/* Render remaining empty slots */}
                  {fingerprints.length > 0 &&
                    Array.from({ length: emptySlotsCount }).map((_, i) => (
                      <button
                        key={`empty-${i}`}
                        type="button"
                        onClick={() => onEnrollUser(user)}
                        className="p-2 rounded-lg border border-dashed border-[#e5e3df] hover:border-[#5645d4] hover:bg-[#fafaf9] text-xs flex flex-col items-center justify-center gap-1 text-[#a4a097] hover:text-[#5645d4] transition-all cursor-pointer min-h-[58px]"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Slot {slotCount + i + 1} Kosong</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-[#ede9e4] flex items-center justify-between">
                <span className="text-[11px] text-[#787671] truncate">
                  Tersinkronisasi ke {user.accessibleRoomIds?.length || rooms.length} node pintu
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEnrollUser(user)}
                  leftIcon={<Fingerprint className="h-3.5 w-3.5 text-[#5645d4]" />}
                  className="text-xs h-8 px-3 border-[#e5e3df] text-[#5645d4] hover:bg-[#fafaf9] hover:border-[#c8c4be] font-medium rounded-md cursor-pointer transition-all shadow-xs"
                >
                  {slotCount === 0 ? "Mulai Enrollment DY50" : "Kelola Template Biometrik"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="p-10 text-center rounded-xl bg-white border border-[#e5e3df] text-[#787671] space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-lg bg-[#f6f5f4] border border-[#e5e3df] flex items-center justify-center mx-auto text-[#a4a097]">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1a1a]">Pengguna Tidak Ditemukan</p>
            <p className="text-xs text-[#787671] max-w-sm mx-auto">
              Tidak ada sivitas yang sesuai dengan filter biometrik yang dipilih.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
