import React, { useState, useId, useEffect } from "react";
import { User, Room, ApprovalPayload } from "../../types";
import {
  CheckCheck,
  Calendar,
  Infinity as InfinityIcon,
  DoorOpen,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
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

interface BatchApprovalModalProps {
  selectedUsers: User[];
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onBatchApprove: (
    userIds: string[],
    payload: ApprovalPayload
  ) => Promise<{ successCount: number; failCount: number }>;
  onShowToast: (message: string, variant: "success" | "warning" | "error") => void;
}

export const BatchApprovalModal: React.FC<BatchApprovalModalProps> = ({
  selectedUsers = [],
  isOpen,
  onClose,
  rooms = [],
  onBatchApprove,
  onShowToast,
}) => {
  const validFromId = useId();
  const validUntilId = useId();

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isPermanent, setIsPermanent] = useState<boolean>(true);
  const [validFromDate, setValidFromDate] = useState<string>("");
  const [validUntilDate, setValidUntilDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showUserList, setShowUserList] = useState<boolean>(false);

  // Initialize room selection when modal opens
  useEffect(() => {
    if (isOpen && selectedUsers.length > 0) {
      // Find union of requested rooms across selected users, or default to all rooms
      const requestedUnion = new Set<string>();
      selectedUsers.forEach((u) => {
        if (u.requestedRoomIds && u.requestedRoomIds.length > 0) {
          u.requestedRoomIds.forEach((rid) => requestedUnion.add(rid));
        }
      });

      if (requestedUnion.size > 0) {
        setSelectedRoomIds(Array.from(requestedUnion));
      } else {
        setSelectedRoomIds(rooms.map((r) => r.id));
      }

      const now = new Date();
      setValidFromDate(now.toISOString().slice(0, 16));
      const end = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 1 semester (180 days)
      setValidUntilDate(end.toISOString().slice(0, 16));
      setIsPermanent(true);
    }
  }, [isOpen, selectedUsers, rooms]);

  const handleRoomToggle = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
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
    if (selectedUsers.length === 0) return;

    if (selectedRoomIds.length === 0) {
      onShowToast("Pilih minimal satu ruangan laboratorium untuk diotorisasi.", "warning");
      return;
    }

    if (!isPermanent && (!validFromDate || !validUntilDate)) {
      onShowToast("Tentukan tanggal mulai dan selesai masa berlaku akses.", "warning");
      return;
    }

    if (!isPermanent && new Date(validUntilDate) <= new Date(validFromDate)) {
      onShowToast("Tanggal selesai akses harus lebih besar dari tanggal mulai.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      const payload: ApprovalPayload = {
        approvedRoomIds: selectedRoomIds,
        validFrom: !isPermanent && validFromDate ? new Date(validFromDate).toISOString() : new Date().toISOString(),
        validUntil: !isPermanent && validUntilDate ? new Date(validUntilDate).toISOString() : undefined,
      };

      const result = await onBatchApprove(userIds, payload);

      if (result.successCount > 0) {
        onShowToast(
          `Berhasil menyetujui ${result.successCount} pengguna (${result.failCount} gagal).`,
          "success"
        );
        onClose();
      } else {
        onShowToast("Gagal memproses persetujuan massal.", "error");
      }
    } catch {
      onShowToast("Terjadi kesalahan saat memproses persetujuan massal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || selectedUsers.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="lg"
        className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] sm:max-h-[90vh] p-0 flex flex-col overflow-hidden bg-white border border-[#e5e3df] shadow-2xl rounded-xl font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-approval-title"
        aria-describedby="batch-approval-desc"
      >
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#fafaf9]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#f6f5f4] border border-[#ede9e4] flex items-center justify-center text-[#1aae39] shrink-0">
              <ShieldCheck className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle id="batch-approval-title" className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                  Persetujuan Akses Massal
                </DialogTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#fafaf9] text-[#5645d4] border border-[#e5e3df] shrink-0">
                  {selectedUsers.length} Pengguna Terpilih
                </span>
              </div>
              <DialogDescription id="batch-approval-desc" className="text-xs text-[#5d5b54] truncate mt-0.5">
                Otorisasi permohonan pendaftaran serentak dengan hak akses dan masa berlaku seragam.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white">
            {/* 1. Selected Applicants Preview Accordion */}
            <div className="rounded-lg border border-[#e5e3df] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowUserList(!showUserList)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#fafaf9] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
                  <Users className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Daftar {selectedUsers.length} Pemohon yang Dipilih</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#5d5b54]">
                  <span>{showUserList ? "Sembunyikan" : "Tampilkan Rincian"}</span>
                  {showUserList ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[#5d5b54]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[#5d5b54]" />
                  )}
                </div>
              </button>

              {showUserList ? (
                <div className="px-3.5 pb-3 pt-1 border-t border-[#ede9e4] max-h-44 overflow-y-auto space-y-1.5 scrollbar-thin bg-[#fafaf9]">
                  {selectedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 rounded-md bg-white border border-[#e5e3df] flex items-center justify-between gap-2 text-xs shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#1a1a1a] truncate">{u.name}</div>
                        <div className="text-[11px] text-[#5d5b54] font-mono truncate">
                          {u.email} &bull; {u.role}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#5645d4] px-1.5 py-0.5 rounded bg-[#f6f5f4] border border-[#e5e3df] shrink-0 font-medium">
                        {u.requestedRoomIds?.length || 0} Ruang Diminta
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-2 border-t border-[#ede9e4] flex flex-wrap gap-1.5 text-[11px] text-[#5d5b54] bg-[#fafaf9]/50">
                  {selectedUsers.slice(0, 4).map((u) => (
                    <span
                      key={u.id}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#e5e3df] truncate max-w-[140px] text-[#1a1a1a] font-medium"
                    >
                      {u.name}
                    </span>
                  ))}
                  {selectedUsers.length > 4 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#f6f5f4] text-[#5645d4] border border-[#e5e3df] font-semibold">
                      +{selectedUsers.length - 4} lainnya
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Room Access Authorization Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Otorisasi Ruangan Laboratorium ({selectedRoomIds.length}/{rooms.length})</span>
                </Label>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={handleSelectAllRooms}
                    className="text-[#5645d4] hover:underline font-semibold cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-[#e5e3df]">&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearAllRooms}
                    className="text-[#5d5b54] hover:underline cursor-pointer"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-0.5 scrollbar-thin">
                {rooms.map((room) => {
                  const isChecked = selectedRoomIds.includes(room.id);
                  return (
                    <label
                      key={room.id}
                      className={cn(
                        "p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all select-none",
                        isChecked
                          ? "bg-[#fafaf9] border-[#c8c4be] shadow-xs text-[#1a1a1a]"
                          : "bg-white border-[#e5e3df] hover:border-[#c8c4be] text-[#5d5b54]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleRoomToggle(room.id)}
                          className="h-3.5 w-3.5 rounded border-[#c8c4be] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate text-[#1a1a1a]">{room.name}</div>
                          <div className="text-[11px] text-[#5d5b54] font-mono truncate">
                            {room.deviceId} {room.description ? `• ${room.description}` : ''}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          room.deviceStatus === "ONLINE" ? "bg-[#1aae39]" : "bg-[#c8c4be]"
                        )}
                        title={room.deviceStatus === "ONLINE" ? "Hardware Online" : "Hardware Offline"}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Validity Duration Selector */}
            <div className="space-y-2.5 pt-2 border-t border-[#ede9e4]">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Masa Berlaku Akses Pengguna</span>
                </Label>
              </div>

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
                <div className="p-3.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={validFromId} className="text-[11px] font-medium text-[#5d5b54]">
                        Mulai Akses
                      </Label>
                      <Input
                        id={validFromId}
                        type="datetime-local"
                        value={validFromDate}
                        onChange={(e) => setValidFromDate(e.target.value)}
                        className="text-xs font-mono h-8 bg-white border-[#e5e3df] focus:border-[#5645d4]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={validUntilId} className="text-[11px] font-medium text-[#5d5b54]">
                        Kedaluwarsa Pada
                      </Label>
                      <Input
                        id={validUntilId}
                        type="datetime-local"
                        value={validUntilDate}
                        onChange={(e) => setValidUntilDate(e.target.value)}
                        className="text-xs font-mono h-8 bg-white border-[#e5e3df] focus:border-[#5645d4]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogBody>

          {/* Footer */}
          <DialogFooter className="p-3.5 sm:p-4 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between">
            <div className="text-[11px] text-[#5d5b54] font-mono">
              Total: <strong className="text-[#1a1a1a]">{selectedUsers.length}</strong> pengguna
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-8 px-3 bg-white border-[#e5e3df] text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#fafaf9] rounded-md cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || selectedUsers.length === 0}
                className="bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs gap-1.5 font-semibold shadow-xs h-8 px-3.5 rounded-md cursor-pointer transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>
                  {isSubmitting
                    ? "Memproses..."
                    : `Setujui ${selectedUsers.length} Pengguna`}
                </span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
