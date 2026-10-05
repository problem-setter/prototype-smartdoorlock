import React, { useState, useId } from "react";
import { UserRole, Room } from "../../types";
import {
  UserPlus,
  ShieldAlert,
  KeyRound,
  User as UserIcon,
  Check,
  Sparkles,
  Mail,
  CheckCircle2,
  AtSign,
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

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onSubmit: (userData: {
    name: string;
    email: string;
    role: UserRole;
    accessibleRooms: string[];
  }) => void;
}

const EMAIL_DOMAINS = [
  { label: "@student.untan.ac.id", desc: "Mahasiswa" },
  { label: "@untan.ac.id", desc: "Dosen / Tendik" },
  { label: "@gmail.com", desc: "Google / Umum" },
];

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onSubmit,
}) => {
  const nameId = useId();
  const emailId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [accessibleRooms, setAccessibleRooms] = useState<string[]>(
    rooms.length > 0 ? [rooms[0].id] : []
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("user");
    setAccessibleRooms(rooms.length > 0 ? [rooms[0].id] : []);
  };

  const handleApplyDomain = (domain: string) => {
    const currentPrefix = email.includes("@") ? email.split("@")[0] : email;
    if (!currentPrefix.trim()) {
      setEmail(`pengguna${domain}`);
    } else {
      setEmail(`${currentPrefix.trim()}${domain}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role,
      accessibleRooms: role === "superadmin" ? rooms.map((r) => r.id) : accessibleRooms,
    });

    resetForm();
    onClose();
  };

  const toggleRoom = (roomId: string) => {
    setAccessibleRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAllRooms = () => {
    setAccessibleRooms(rooms.map((r) => r.id));
  };

  const handleResetRooms = () => {
    setAccessibleRooms([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="lg"
        onClose={onClose}
        aria-labelledby="add-user-dialog-title"
        aria-describedby="add-user-dialog-description"
        className="w-full max-w-md sm:max-w-[490px] bg-white border border-[#e5e3df] text-[#1a1a1a] shadow-[0_4px_12px_rgba(15,15,15,0.08)] rounded-xl"
      >
        {/* ── Dialog Header ── */}
        <DialogHeader className="border-b border-[#e5e3df] bg-[#fafaf9] px-5 py-4 sm:px-6 sm:py-4.5 pr-12 sm:pr-14">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e3df] bg-[#f6f5f4] text-[#5d5b54] shrink-0 shadow-xs mt-0.5">
              <UserPlus className="h-4.5 w-4.5 shrink-0" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle id="add-user-dialog-title" className="text-base sm:text-lg font-bold tracking-tight text-[#1a1a1a]">
                Tambah Pengguna Baru
              </DialogTitle>
              <DialogDescription id="add-user-dialog-description" className="text-xs text-[#5d5b54] mt-0.5 leading-normal">
                Registrasi pengguna ke sistem smart door lock.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <DialogBody className="space-y-4.5 px-5 py-4 sm:px-6 sm:py-4.5 overflow-y-auto">

            {/* ── Section 1: Identitas Pengguna ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#ede9e4] pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#787671] font-mono">
                  Identitas Pengguna
                </span>
                <span className="text-[11px] text-[#787671]">
                  <span className="text-[#e03131] font-semibold">*</span> Wajib diisi
                </span>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <Label htmlFor={nameId} className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                  <span>Nama Lengkap</span>
                  <span className="text-[#e03131]">*</span>
                </Label>
                <Input
                  id={nameId}
                  type="text"
                  placeholder="Misal: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs rounded-md border-[#e5e3df] bg-white text-[#1a1a1a] placeholder:text-[#787671] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] shadow-xs"
                  required
                  autoFocus
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={emailId} className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                    <span>Email</span>
                    <span className="text-[#e03131]">*</span>
                  </Label>
                </div>
                <Input
                  id={emailId}
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-md border-[#e5e3df] bg-white text-[#1a1a1a] placeholder:text-[#787671] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] shadow-xs"
                  required
                />

                {/* Email Domain Suggestion Helper Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-[#5d5b54] font-medium flex items-center gap-1 shrink-0">
                    <AtSign className="h-3 w-3 text-[#787671] shrink-0" />
                    Domain:
                  </span>
                  {EMAIL_DOMAINS.map((domain) => (
                    <button
                      key={domain.label}
                      type="button"
                      onClick={() => handleApplyDomain(domain.label)}
                      className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 bg-[#fafaf9] hover:bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]"
                      title={`Terapkan ${domain.label} (${domain.desc})`}
                    >
                      {domain.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Section 2: Otorisasi & Role ── */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-[#ede9e4] pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#787671] font-mono">
                  Otorisasi Akses
                </span>
              </div>

              {/* Role Radio Group Cards */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1a1a1a]">
                  Tingkat Akses (Role) <span className="text-[#e03131]">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Peran Pengguna">
                  {/* Superadmin Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={role === "superadmin"}
                    onClick={() => setRole("superadmin")}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                      role === "superadmin"
                        ? "bg-[#fafaf9] border-[#5645d4] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#5645d4]"
                        : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]"
                    )}
                  >
                    {role === "superadmin" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5645d4] text-white shrink-0">
                        <Check className="h-2.5 w-2.5 shrink-0" />
                      </span>
                    )}
                    <ShieldAlert className={cn("h-4.5 w-4.5 mb-1 shrink-0", role === "superadmin" ? "text-[#5645d4]" : "text-[#5d5b54]")} />
                    <span className="text-xs font-bold leading-tight">Superadmin</span>
                    <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Akses Penuh</span>
                  </button>

                  {/* Admin Lab Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={role === "admin"}
                    onClick={() => setRole("admin")}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                      role === "admin"
                        ? "bg-[#fafaf9] border-[#5645d4] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#5645d4]"
                        : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]"
                    )}
                  >
                    {role === "admin" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5645d4] text-white shrink-0">
                        <Check className="h-2.5 w-2.5 shrink-0" />
                      </span>
                    )}
                    <KeyRound className={cn("h-4.5 w-4.5 mb-1 shrink-0", role === "admin" ? "text-[#5645d4]" : "text-[#5d5b54]")} />
                    <span className="text-xs font-bold leading-tight">Admin Lab</span>
                    <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Kontrol Node</span>
                  </button>

                  {/* Pengguna Option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={role === "user"}
                    onClick={() => setRole("user")}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                      role === "user"
                        ? "bg-[#fafaf9] border-[#5645d4] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#5645d4]"
                        : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]"
                    )}
                  >
                    {role === "user" && (
                      <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5645d4] text-white shrink-0">
                        <Check className="h-2.5 w-2.5 shrink-0" />
                      </span>
                    )}
                    <UserIcon className={cn("h-4.5 w-4.5 mb-1 shrink-0", role === "user" ? "text-[#5645d4]" : "text-[#5d5b54]")} />
                    <span className="text-xs font-bold leading-tight">Pengguna</span>
                    <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Akses Terdaftar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section 3: Room Access Matrix ── */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ede9e4] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#787671] font-mono">
                    Otorisasi Akses Ruangan
                  </span>
                  <span className="inline-flex items-center font-mono text-[#5d5b54] text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#f6f5f4] border border-[#e5e3df] shrink-0">
                    {role === "superadmin" ? rooms.length : accessibleRooms.length} / {rooms.length} Terpilih
                  </span>
                </div>
                {role !== "superadmin" && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllRooms}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white hover:bg-[#f6f5f4] text-[#37352f] border border-[#e5e3df] transition-colors cursor-pointer shadow-xs active:scale-95 shrink-0"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleResetRooms}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white hover:bg-[#fdf2f2] hover:text-[#e03131] text-[#5d5b54] border border-[#e5e3df] transition-colors cursor-pointer shadow-xs active:scale-95 shrink-0"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {role === "superadmin" ? (
                <div className="p-3 rounded-md bg-[#fafaf9] border border-[#e5e3df] text-xs text-[#5d5b54] flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-[#5645d4] shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="text-[#1a1a1a]">Akses Penuh Global:</strong> Akun bertipe Superadmin secara otomatis memiliki hak bypass otorisasi untuk seluruh node pintu &amp; solenoid lab.
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {rooms.map((room) => {
                    const isChecked = accessibleRooms.includes(room.id);
                    const isOnline = room.deviceStatus === "ONLINE";

                    return (
                      <label
                        key={room.id}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-all select-none",
                          isChecked
                            ? "bg-[#fafaf9] border-[#c8c4be] text-[#1a1a1a] shadow-xs"
                            : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9]"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRoom(room.id)}
                          className="mt-0.5 rounded text-[#5645d4] focus:ring-[#5645d4] h-4 w-4 bg-white border-[#e5e3df] accent-[#5645d4] cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-[#1a1a1a] leading-snug truncate">
                              {room.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  isOnline ? "bg-[#1aae39] shadow-xs" : "bg-[#e03131]"
                                )}
                                role="img"
                                aria-label={isOnline ? "Node Online" : "Node Offline"}
                                title={isOnline ? "Node Online" : "Node Offline"}
                              />
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#e5e3df] text-[#37352f] shrink-0">
                                {room.deviceId}
                              </span>
                            </div>
                          </div>
                          {room.description && (
                            <p className="text-[11px] text-[#5d5b54] mt-0.5 leading-tight line-clamp-1">
                              {room.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

          </DialogBody>

          {/* ── Dialog Footer ── */}
          <DialogFooter className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-[#e5e3df] bg-[#fafaf9] flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="min-h-[36px] px-4 cursor-pointer rounded-md font-medium text-xs text-[#37352f] hover:bg-[#ede9e4] shrink-0"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              leftIcon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
              className="min-h-[36px] px-5 font-semibold cursor-pointer shadow-xs rounded-md text-xs bg-[#5645d4] hover:bg-[#4534b3] text-white shrink-0"
            >
              Simpan &amp; Daftarkan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
