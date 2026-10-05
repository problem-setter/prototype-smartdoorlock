import React, { useState, useRef, useEffect } from "react";
import { Room } from "../../types";
import { DoorClosed, DoorOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomBadgeListProps {
  accessibleRoomIds: string[];
  rooms: Room[];
  isSuperadmin?: boolean;
  maxVisible?: number;
  className?: string;
}

export const RoomBadgeList: React.FC<RoomBadgeListProps> = ({
  accessibleRoomIds = [],
  rooms = [],
  isSuperadmin = false,
  maxVisible = 3,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (isSuperadmin) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-md bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df] shrink-0",
          className
        )}
        title="Superadmin memiliki hak akses ke seluruh pintu laboratorium FT UNTAN"
      >
        <DoorOpen className="h-3 w-3 shrink-0 text-[#5d5b54]" />
        <span>Semua Ruangan (Superadmin)</span>
      </span>
    );
  }

  if (accessibleRoomIds.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-0.5 rounded-md bg-[#fafaf9] text-[#787671] border border-[#e5e3df] shrink-0",
          className
        )}
      >
        <DoorClosed className="h-3 w-3 shrink-0 text-[#a4a097]" />
        <span>Belum Ada Akses Ruangan</span>
      </span>
    );
  }

  // Match room IDs to room objects
  const userRooms = accessibleRoomIds
    .map((id) => rooms.find((r) => r.id === id))
    .filter((r): r is Room => Boolean(r));

  const visibleRooms = userRooms.slice(0, maxVisible);
  const overflowRooms = userRooms.slice(maxVisible);
  const overflowCount = overflowRooms.length;

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {visibleRooms.map((room) => (
        <span
          key={room.id}
          className="inline-flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded-md bg-[#fafaf9] text-[#5d5b54] border border-[#e5e3df] hover:border-[#c8c4be] transition-colors shrink-0"
          title={`${room.name} (${room.deviceId}) - ${room.description || 'Ruangan Laboratorium'}`}
        >
          <DoorClosed className="h-3 w-3 shrink-0 text-[#5d5b54]" />
          <span className="truncate max-w-[130px] font-medium">{room.name}</span>
        </span>
      ))}

      {overflowCount > 0 && (
        <div className="relative inline-block" ref={popoverRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-expanded={isOpen}
            aria-label={`Lihat ${overflowCount} ruangan lainnya`}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer select-none",
              isOpen
                ? "bg-[#5645d4] text-white border-[#5645d4] shadow-xs"
                : "bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df] hover:bg-[#ede9e4]"
            )}
          >
            <span>+{overflowCount} Ruangan</span>
            <ChevronDown
              className={cn(
                "h-2.5 w-2.5 shrink-0 transition-transform duration-150",
                isOpen && "rotate-180 text-white"
              )}
            />
          </button>

          {isOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 z-50 min-w-[220px] max-w-[280px] p-2 rounded-xl bg-white border border-[#e5e3df] shadow-[0_6px_20px_rgba(0,0,0,0.08)] space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider px-1 pb-1 border-b border-[#ede9e4] flex items-center justify-between">
                <span>Daftar Ruang Tambahan</span>
                <span className="font-mono text-[#1a1a1a] font-bold">
                  Total {userRooms.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                {overflowRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-1.5 rounded-lg bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#ede9e4] flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#1a1a1a] text-[11px] truncate">
                        {room.name}
                      </div>
                      <div className="text-[11px] text-[#787671] font-mono truncate">
                        {room.deviceId} &bull; {room.description || 'Ruangan Laboratorium'}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        room.deviceStatus === "ONLINE" ? "bg-[#1aae39]" : "bg-[#a4a097]"
                      )}
                      title={`Node ${room.deviceStatus === "ONLINE" ? "Online" : "Offline"}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
