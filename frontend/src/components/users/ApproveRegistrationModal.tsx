import React, { useState, useId, useMemo, useEffect } from "react";
import { User, Room, ApprovalPayload } from "../../types";
import {
  CheckCircle2,
  Calendar,
  Infinity as InfinityIcon,
  ShieldCheck,
  DoorOpen,
  Mail,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ApproveRegistrationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onApprove: (
    userId: string,
    payload: ApprovalPayload
  ) => Promise<{ success: boolean; message: string }>;
  onShowToast: (message: string, variant: "success" | "warning" | "error") => void;
}

export const ApproveRegistrationModal: React.FC<ApproveRegistrationModalProps> = ({
  user,
  isOpen,
  onClose,
  rooms,
  onApprove,
  onShowToast,
}) => {
  const validFromId = useId();
  const validUntilId = useId();

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isPermanent, setIsPermanent] = useState<boolean>(true);
  const [validFromDate, setValidFromDate] = useState<string>("");
  const [validUntilDate, setValidUntilDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when user changes or opens
  useEffect(() => {
    if (user && isOpen) {
      // Default to requested room IDs or all rooms if empty
      setSelectedRoomIds(
        user.requestedRoomIds && user.requestedRoomIds.length > 0
          ? user.requestedRoomIds
          : rooms.map((r) => r.id)
      );

      const now = new Date();
      setValidFromDate(now.toISOString().slice(0, 16));

      if (user.validUntil) {
        setIsPermanent(false);
        setValidUntilDate(new Date(user.validUntil).toISOString().slice(0, 16));
      } else {
        setIsPermanent(true);
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        setValidUntilDate(nextMonth.toISOString().slice(0, 16));
      }
    }
  }, [user, isOpen, rooms]);

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSelectAllRooms = () => {
    setSelectedRoomIds(rooms.map((r) => r.id));
  };

  const handleClearAllRooms = () => {
    setSelectedRoomIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedRoomIds.length === 0) {
      onShowToast("Pilih minimal satu ruangan untuk diberikan izin akses.", "warning");
      return;
    }

    if (!isPermanent && (!validFromDate || !validUntilDate)) {
      onShowToast("Tentukan tanggal mulai dan selesai akses.", "warning");
      return;
    }

    if (!isPermanent && new Date(validUntilDate) <= new Date(validFromDate)) {
      onShowToast("Tanggal selesai akses harus lebih besar dari tanggal mulai.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ApprovalPayload = {
        approvedRoomIds: selectedRoomIds,
        validFrom: !isPermanent && validFromDate ? new Date(validFromDate).toISOString() : new Date().toISOString(),
        validUntil: !isPermanent && validUntilDate ? new Date(validUntilDate).toISOString() : undefined,
      };

      const result = await onApprove(user.id, payload);

      if (result.success) {
        onShowToast(result.message, "success");
        onClose();
      } else {
        onShowToast(result.message, "error");
      }
    } catch {
      onShowToast("Gagal memproses persetujuan pendaftaran.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="max-w-xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#fafaf9]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#f6f5f4] border border-[#ede9e4] flex items-center justify-center text-[#1aae39] shrink-0">
              <ShieldCheck className="h-4 w-4 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                Persetujuan &amp; Otorisasi Akses
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5d5b54] truncate">
                Tinjau profil pemohon, tentukan ruangan yang diizinkan, dan atur masa aktif akses.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* ── Applicant Overview Card ── */}
            <div className="p-3.5 rounded-lg bg-white border border-[#e5e3df] shadow-[0_1px_2px_rgba(15,15,15,0.04)] space-y-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-md bg-[#f6f5f4] text-[#1a1a1a] border border-[#e5e3df] flex items-center justify-center font-bold text-sm font-mono shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-[#1a1a1a] truncate">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5d5b54] truncate mt-0.5">
                    <Mail className="h-3 w-3 text-[#787671] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df] uppercase tracking-wider shrink-0">
                  {user.role}
                </span>
              </div>
            </div>

            {/* ── Section: Room Permissions Selection ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                  <span>Izin Akses Ruangan ({selectedRoomIds.length}/{rooms.length})</span>
                </Label>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={handleSelectAllRooms}
                    className="text-[#5645d4] hover:underline cursor-pointer font-medium"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-[#e5e3df]">&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearAllRooms}
                    className="text-[#5d5b54] hover:underline cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  const isRequested = user.requestedRoomIds?.includes(room.id);

                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoom(room.id)}
                      className={cn(
                        "p-2.5 rounded-md border text-xs flex items-start gap-2.5 cursor-pointer transition-all select-none",
                        isSelected
                          ? "bg-[#fafaf9] border-[#c8c4be] text-[#1a1a1a] shadow-xs"
                          : "bg-white border-[#e5e3df] text-[#5d5b54] hover:border-[#c8c4be]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-[#5645d4] focus:ring-[#5645d4] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-[#1a1a1a] flex items-center gap-1">
                          <span className="truncate">{room.name}</span>
                          {isRequested && (
                            <span className="text-[10px] font-mono px-1 rounded bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df] shrink-0">
                              Diminta
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5d5b54] font-mono truncate mt-0.5">
                          {room.deviceId} {room.description ? `• ${room.description}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section: Access Validity Period ── */}
            <div className="space-y-2.5 pt-1 border-t border-[#ede9e4]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                  <span>Masa Berlaku Akses</span>
                </Label>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPermanent(true)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all",
                    isPermanent
                      ? "border-[#5645d4] bg-[#fafaf9] text-[#1a1a1a] ring-1 ring-[#5645d4]"
                      : "border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#fafaf9]"
                  )}
                >
                  <InfinityIcon className={cn("h-4 w-4 shrink-0", isPermanent ? "text-[#5645d4]" : "text-[#787671]")} />
                  <div>
                    <div className="text-xs font-bold">Permanen</div>
                    <div className="text-[10px] text-[#787671]">Tanpa batas waktu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPermanent(false)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-left cursor-pointer transition-all",
                    !isPermanent
                      ? "border-[#5645d4] bg-[#fafaf9] text-[#1a1a1a] ring-1 ring-[#5645d4]"
                      : "border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#fafaf9]"
                  )}
                >
                  <Calendar className={cn("h-4 w-4 shrink-0", !isPermanent ? "text-[#5645d4]" : "text-[#787671]")} />
                  <div>
                    <div className="text-xs font-bold">Batas Waktu</div>
                    <div className="text-[10px] text-[#787671]">Rentang tanggal aktif</div>
                  </div>
                </button>
              </div>

              {!isPermanent && (
                <div className="p-3 rounded-lg bg-[#fafaf9] border border-[#e5e3df] space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor={validFromId} className="text-xs font-semibold text-[#1a1a1a]">
                        Mulai Berlaku:
                      </Label>
                      <Input
                        id={validFromId}
                        type="datetime-local"
                        value={validFromDate}
                        onChange={(e) => setValidFromDate(e.target.value)}
                        className="h-8 text-xs font-mono bg-white border-[#e5e3df] focus:border-[#5645d4]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={validUntilId} className="text-xs font-semibold text-[#1a1a1a]">
                        Kedaluwarsa Pada:
                      </Label>
                      <Input
                        id={validUntilId}
                        type="datetime-local"
                        value={validUntilDate}
                        onChange={(e) => setValidUntilDate(e.target.value)}
                        className="h-8 text-xs font-mono bg-white border-[#e5e3df] focus:border-[#5645d4]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter className="p-3 sm:p-4 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              className="text-xs font-semibold bg-[#5645d4] hover:bg-[#4534b3] text-white"
            >
              Setujui &amp; Terbitkan Akses
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
