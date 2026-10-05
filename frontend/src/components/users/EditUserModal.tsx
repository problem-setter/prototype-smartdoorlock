import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { User, UserRole, UserStatus, Room, FingerprintSlot } from "../../types";
import {
  Edit3,
  Fingerprint,
  Trash2,
  Plus,
  Check,
  X,
  ShieldCheck,
  Radio,
  Sparkles,
  Lock,
  DoorClosed,
  AlertTriangle,
  User as UserIcon,
  ShieldAlert,
  KeyRound,
  Mail,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from "@/components/ui/dialog";
import { CustomSelect, SelectOption } from "@/components/ui/custom-select";
import { BiometricScanner } from "@/components/animations/biometric-scanner";
import { cn } from "@/lib/utils";

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  currentUser: User | null;
  initialTab?: "info" | "fingerprint" | "rooms";
  onUpdateUser: (userId: string, updatedData: Partial<User>) => void;
  onEnrollFingerprint: (userId: string, roomId: string, label?: string) => Promise<{ success: boolean; templateId: number; message?: string }>;
  onUpdateFingerprintLabel: (userId: string, templateId: number, label: string) => void;
  onRemoveFingerprint: (userId: string, templateId: number) => void;
  onShowToast: (message: string, variant?: "success" | "error" | "warning" | "info") => void;
}

interface EditUserFormProps {
  user: User;
  onClose: () => void;
  rooms: Room[];
  currentUser: User | null;
  initialTab?: "info" | "fingerprint" | "rooms";
  onUpdateUser: (userId: string, updatedData: Partial<User>) => void;
  onEnrollFingerprint: (userId: string, roomId: string, label?: string) => Promise<{ success: boolean; templateId: number; message?: string }>;
  onUpdateFingerprintLabel: (userId: string, templateId: number, label: string) => void;
  onRemoveFingerprint: (userId: string, templateId: number) => void;
  onShowToast: (message: string, variant?: "success" | "error" | "warning" | "info") => void;
}

type TabType = "info" | "fingerprint" | "rooms";

interface TabItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | number;
}

const SUGGESTED_FINGER_LABELS = [
  "Jempol Kanan",
  "Telunjuk Kanan",
  "Jempol Kiri",
  "Telunjuk Kiri",
];

const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  onClose,
  rooms,
  currentUser,
  initialTab,
  onUpdateUser,
  onEnrollFingerprint,
  onUpdateFingerprintLabel,
  onRemoveFingerprint,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || "info");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Form states initialized directly from user prop
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [accessibleRooms, setAccessibleRooms] = useState<string[]>(user.accessibleRoomIds || []);
  const [status, setStatus] = useState<UserStatus>(user.status || "ACTIVE");

  // Fingerprint states
  const [fpIsAdding, setFpIsAdding] = useState(
    initialTab === "fingerprint" && (!user.fingerprints || user.fingerprints.length === 0)
  );
  const [fpEnrollStep, setFpEnrollStep] = useState<1 | 2 | 3 | 4>(1);
  const [fpAssignedTemplateId, setFpAssignedTemplateId] = useState<number | null>(null);
  const [fpNewLabel, setFpNewLabel] = useState("");
  const [fpSelectedRoom, setFpSelectedRoom] = useState<string>(rooms[0]?.id || "room-kk-netsec");
  const [fpEditingTemplateId, setFpEditingTemplateId] = useState<number | null>(null);
  const [fpEditingLabelValue, setFpEditingLabelValue] = useState("");
  const [fpDeletingTemplateId, setFpDeletingTemplateId] = useState<number | null>(null);

  const shouldReduceMotion = useReducedMotion();

  // Dirty state checking
  const hasUnsavedChanges = useMemo(() => (
    name.trim() !== user.name.trim() ||
    email.trim() !== user.email.trim() ||
    role !== user.role ||
    status !== (user.status || "ACTIVE") ||
    accessibleRooms.length !== user.accessibleRoomIds.length ||
    accessibleRooms.some((roomId) => !user.accessibleRoomIds.includes(roomId))
  ), [accessibleRooms, email, name, role, status, user]);

  // Timers ref for biometric enrollment
  const enrollmentTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearEnrollmentTimers = useCallback(() => {
    enrollmentTimersRef.current.forEach((timer) => clearTimeout(timer));
    enrollmentTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearEnrollmentTimers();
    };
  }, [clearEnrollmentTimers]);

  const isSelfSuperadmin = currentUser?.id === user.id && user.role === "superadmin";

  const roomSelectOptions: SelectOption<string>[] = useMemo(() => {
    return rooms.map((r) => ({
      value: r.id,
      label: r.name,
      description: `Node ${r.id}`,
      icon: (
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            r.deviceStatus === "ONLINE" ? "bg-[#0f7b6c]" : "bg-[#e03131]"
          )}
        />
      ),
    }));
  }, [rooms]);

  const existingFps: FingerprintSlot[] = useMemo(() => {
    return user.fingerprints || (
      user.fingerprintTemplateIds?.map((id) => ({
        templateId: id,
        label: `Sidik Jari #${id}`,
        registeredAt: new Date().toISOString(),
      })) || (user.fingerprintTemplateId ? [{
        templateId: user.fingerprintTemplateId,
        label: `Sidik Jari #${user.fingerprintTemplateId}`,
        registeredAt: new Date().toISOString(),
      }] : [])
    );
  }, [user]);

  const canAddMore = existingFps.length < 3;

  const tabs: TabItem[] = useMemo(() => [
    { id: "info", label: "Profil", shortLabel: "Profil", icon: UserIcon },
    {
      id: "fingerprint",
      label: "Biometrik",
      shortLabel: "Biometrik",
      icon: Fingerprint,
      badge: `${existingFps.length}/3`
    },
    {
      id: "rooms",
      label: "Hak Akses",
      shortLabel: "Akses",
      icon: ShieldCheck,
      badge: accessibleRooms.length
    },
  ], [existingFps.length, accessibleRooms.length]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onUpdateUser(user.id, {
      name: name.trim(),
      email: email.trim(),
      role: isSelfSuperadmin ? "superadmin" : role,
      accessibleRoomIds: accessibleRooms,
      status,
    });

    onShowToast(`Data pengguna "${name.trim()}" berhasil diperbarui.`, "success");
    onClose();
  };

  const handleStartEnrollment = () => {
    if (!canAddMore) {
      onShowToast("Batas maksimal 3 sidik jari per pengguna telah tercapai.", "warning");
      return;
    }

    const targetRoomObj = rooms.find((r) => r.id === fpSelectedRoom);
    if (targetRoomObj?.deviceStatus === "OFFLINE") {
      onShowToast(`Node ${targetRoomObj.name} sedang OFFLINE. Pendaftaran tidak dapat diproses.`, "error");
      return;
    }

    clearEnrollmentTimers();
    setFpIsAdding(true);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);

    // Step 1 to 2 transition (Place finger)
    const t1 = setTimeout(() => {
      setFpEnrollStep(2);
    }, 1200);

    // Step 2 to 3 transition (Lift & place again)
    const t2 = setTimeout(() => {
      setFpEnrollStep(3);
    }, 2800);

    // Step 3 to 4 transition (Execute enrollment)
    const t3 = setTimeout(async () => {
      try {
        const finalLabel = fpNewLabel.trim() || `Sidik Jari #${existingFps.length + 1}`;
        const result = await onEnrollFingerprint(user.id, fpSelectedRoom, finalLabel);
        if (result.success) {
          setFpAssignedTemplateId(result.templateId);
          setFpEnrollStep(4);
          import('canvas-confetti').then((m) => {
            m.default({
              particleCount: 45,
              spread: 55,
              origin: { y: 0.6 },
            });
          });
          onShowToast(`Biometrik berhasil didaftarkan pada Slot #${result.templateId}.`, "success");
        } else {
          setFpIsAdding(false);
          setFpEnrollStep(1);
          onShowToast(result.message || "Gagal mendaftarkan sidik jari.", "error");
        }
      } catch {
        setFpIsAdding(false);
        setFpEnrollStep(1);
        onShowToast("Terjadi kesalahan saat pendaftaran biometrik.", "error");
      }
    }, 4500);

    enrollmentTimersRef.current.push(t1, t2, t3);
  };

  const handleCancelEnrollment = () => {
    clearEnrollmentTimers();
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);
    setFpNewLabel("");
  };

  const handleSaveFpLabel = (templateId: number) => {
    if (!fpEditingLabelValue.trim()) return;
    onUpdateFingerprintLabel(user.id, templateId, fpEditingLabelValue.trim());
    setFpEditingTemplateId(null);
    onShowToast(`Label sidik jari #${templateId} berhasil diubah.`, "success");
  };

  const handleConfirmRemoveFp = (templateId: number, label: string) => {
    onRemoveFingerprint(user.id, templateId);
    setFpDeletingTemplateId(null);
    onShowToast(`Slot biometrik #${templateId} (${label}) berhasil dihapus.`, "warning");
  };

  const toggleRoom = (roomId: string) => {
    setAccessibleRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSelectAllRooms = () => {
    setAccessibleRooms(rooms.map((r) => r.id));
  };

  const handleClearAllRooms = () => {
    setAccessibleRooms([]);
  };

  // Keyboard navigation for accessible tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      tabRefs.current[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab(tabs[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab(tabs[tabs.length - 1].id);
      tabRefs.current[tabs.length - 1]?.focus();
    }
  };

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={handleSaveProfile} className="flex flex-1 min-h-0 flex-col overflow-hidden">

      {/* ── User Context Summary Card ── */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-[#fafaf9] border-b border-[#e5e3df] shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Avatar size="md" className="h-10 w-10 border border-[#e5e3df] bg-white text-[#1a1a1a] font-bold text-xs shrink-0 shadow-xs rounded-lg">
              <AvatarFallback className="bg-[#f6f5f4] text-[#1a1a1a] rounded-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#1a1a1a] truncate">{user.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#5d5b54] truncate mt-0.5">
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border bg-white text-[#5d5b54] border-[#e5e3df] shrink-0 shadow-2xs">
              {user.role === "superadmin" ? (
                <ShieldAlert className="h-3 w-3 text-[#5645d4] shrink-0" />
              ) : user.role === "admin" ? (
                <KeyRound className="h-3 w-3 text-[#787671] shrink-0" />
              ) : (
                <UserIcon className="h-3 w-3 text-[#787671] shrink-0" />
              )}
              <span>
                {user.role === "superadmin" ? "Superadmin" : user.role === "admin" ? "Admin Lab" : "Pengguna"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Segmented Tab Navigation ── */}
      <div className="px-5 py-3 sm:px-6 sm:py-3.5 shrink-0 bg-white border-b border-[#e5e3df]">
        <div
          className="grid grid-cols-3 rounded-lg border border-[#e5e3df] bg-[#f6f5f4] p-1 gap-1"
          role="tablist"
          aria-label="Kategori Pengaturan Pengguna"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[idx] = el; }}
                type="button"
                role="tab"
                id={`tab-edit-${tab.id}`}
                aria-controls={`panel-edit-${tab.id}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "fingerprint") handleCancelEnrollment();
                }}
                className={cn(
                  "relative flex min-h-[36px] items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 cursor-pointer",
                  isSelected
                    ? "text-[#1a1a1a] bg-white border border-[#e5e3df] shadow-xs"
                    : "text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white/60"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-[#5645d4]" : "text-[#787671]")} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    "text-[11px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0",
                    isSelected ? "bg-[#fafaf9] text-[#5645d4] border border-[#e5e3df]" : "bg-[#ede9e4] text-[#5d5b54]"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Tab Panels Body ── */}
      <DialogBody className="space-y-4 px-5 py-4 sm:px-6 sm:py-4.5 flex-1 overflow-y-auto">

        {/* ═══ TAB 1: PROFIL & PERAN ═══ */}
        {activeTab === "info" && (
          <motion.div
            role="tabpanel"
            id="panel-edit-info"
            aria-labelledby="tab-edit-info"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-[#1a1a1a]"
          >
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                <span>Nama Lengkap</span>
                <span className="text-[#e03131]">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama sivitas akademika"
                className="h-9 text-xs rounded-md border-[#e5e3df] bg-white text-[#1a1a1a] placeholder:text-[#787671] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] shadow-xs"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                <span>Email</span>
                <span className="text-[#e03131]">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.untan.ac.id / nama@gmail.com"
                className="h-9 text-xs rounded-md border-[#e5e3df] bg-white text-[#1a1a1a] placeholder:text-[#787671] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] shadow-xs"
                required
              />
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#1a1a1a]">
                  Tingkat Akses (Role) <span className="text-[#e03131]">*</span>
                </Label>
                {isSelfSuperadmin && (
                  <span className="text-[11px] text-[#dd5b00] font-mono flex items-center gap-1 font-semibold shrink-0">
                    <Lock className="h-3 w-3 shrink-0" /> Akun Utama Anda (Terkunci)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tingkat Akses">
                {/* Superadmin Card */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "superadmin"}
                  disabled={isSelfSuperadmin}
                  onClick={() => setRole("superadmin")}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                    role === "superadmin"
                      ? "bg-[#fafaf9] border-[#5645d4] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#5645d4]"
                      : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]",
                    isSelfSuperadmin && role !== "superadmin" && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {role === "superadmin" && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#5645d4] text-white shrink-0 shadow-xs">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  )}
                  <div className={cn(
                    "p-1.5 rounded-md mb-1.5 transition-colors shrink-0",
                    role === "superadmin" ? "bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6]" : "bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df]"
                  )}>
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Superadmin</span>
                  <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Akses Penuh</span>
                </button>

                {/* Admin Lab Card */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "admin"}
                  disabled={isSelfSuperadmin}
                  onClick={() => setRole("admin")}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                    role === "admin"
                      ? "bg-[#fafaf9] border-[#0075de] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#0075de]"
                      : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]",
                    isSelfSuperadmin && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {role === "admin" && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0075de] text-white shrink-0 shadow-xs">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  )}
                  <div className={cn(
                    "p-1.5 rounded-md mb-1.5 transition-colors shrink-0",
                    role === "admin" ? "bg-[#dcecfa] text-[#0075de] border border-[#bde0fe]" : "bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df]"
                  )}>
                    <KeyRound className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Admin Lab</span>
                  <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Kontrol Node</span>
                </button>

                {/* Pengguna Card */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "user"}
                  disabled={isSelfSuperadmin}
                  onClick={() => setRole("user")}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg border text-center transition-all cursor-pointer",
                    role === "user"
                      ? "bg-[#fafaf9] border-[#1aae39] text-[#1a1a1a] shadow-xs ring-1.5 ring-[#1aae39]"
                      : "bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9] hover:text-[#1a1a1a] hover:border-[#c8c4be]",
                    isSelfSuperadmin && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {role === "user" && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1aae39] text-white shrink-0 shadow-xs">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  )}
                  <div className={cn(
                    "p-1.5 rounded-md mb-1.5 transition-colors shrink-0",
                    role === "user" ? "bg-[#d9f3e1] text-[#1aae39] border border-[#d2f4d9]" : "bg-[#f6f5f4] text-[#5d5b54] border border-[#e5e3df]"
                  )}>
                    <UserIcon className="h-4 w-4 shrink-0" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Pengguna</span>
                  <span className="text-[11px] text-[#787671] leading-tight mt-0.5">Akses Terdaftar</span>
                </button>
              </div>
            </div>

            {/* Status Switcher */}
            <div className="space-y-2 border-t border-[#ede9e4] pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs font-semibold text-[#1a1a1a]">Status Otorisasi Akun</Label>
                <span className="text-[11px] text-[#5d5b54]">Efektif langsung setelah disimpan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Status Akun">
                <button
                  type="button"
                  role="radio"
                  aria-checked={status === "ACTIVE"}
                  onClick={() => setStatus("ACTIVE")}
                  className={cn(
                    "min-h-12 rounded-lg border p-3 text-left text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1aae39]/30 cursor-pointer relative",
                    status === "ACTIVE"
                      ? "border-[#1aae39] bg-[#fafaf9] text-[#1a1a1a] shadow-xs ring-1 ring-[#1aae39]/20"
                      : "border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#fafaf9] hover:border-[#c8c4be]"
                  )}
                >
                  {status === "ACTIVE" && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#1aae39] text-white shrink-0">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  )}
                  <span className="flex items-center gap-2 font-bold text-xs text-[#1a1a1a]">
                    <span className="h-2 w-2 rounded-full bg-[#1aae39] shrink-0" />
                    Aktif (Diizinkan)
                  </span>
                  <span className="ml-4 block pt-0.5 text-[11px] font-normal text-[#5d5b54] leading-tight">
                    Kredensial biometrik &amp; PIN dapat digunakan untuk membuka pintu lab
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={status === "SUSPENDED"}
                  onClick={() => setStatus("SUSPENDED")}
                  disabled={isSelfSuperadmin}
                  className={cn(
                    "min-h-12 rounded-lg border p-3 text-left text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e03131]/30 cursor-pointer relative",
                    status === "SUSPENDED"
                      ? "border-[#e03131] bg-[#fafaf9] text-[#1a1a1a] shadow-xs ring-1 ring-[#e03131]/20"
                      : "border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#fafaf9] hover:border-[#c8c4be]",
                    isSelfSuperadmin && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {status === "SUSPENDED" && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e03131] text-white shrink-0">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  )}
                  <span className="flex items-center gap-2 font-bold text-xs text-[#1a1a1a]">
                    <span className="h-2 w-2 rounded-full bg-[#e03131] shrink-0" />
                    Ditangguhkan (Blokir)
                  </span>
                  <span className="ml-4 block pt-0.5 text-[11px] font-normal text-[#5d5b54] leading-tight">
                    Semua akses solenoid ditolak sementara oleh firmware ESP32
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ TAB 2: BIOMETRIK DY50 ═══ */}
        {activeTab === "fingerprint" && (
          <motion.div
            role="tabpanel"
            id="panel-edit-fingerprint"
            aria-labelledby="tab-edit-fingerprint"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-[#1a1a1a]"
          >
            {/* Slot Capacity Meter */}
            <div className="p-3.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-white border border-[#e5e3df] flex items-center justify-center text-[#5645d4] shrink-0 shadow-xs">
                    <Fingerprint className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1a1a1a] block leading-tight">Alokasi Slot Sensor DY50</span>
                    <span className="text-[11px] text-[#787671] block leading-tight">Maksimal 3 template sidik jari per sivitas</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#5645d4] bg-white border border-[#e5e3df] px-2 py-0.5 rounded-md shrink-0 shadow-xs">
                  {existingFps.length} / 3 Slot
                </span>
              </div>

              {/* 3-Slot Visual Allocation Cards */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => {
                  const fpAtSlot = existingFps[idx];
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all",
                        fpAtSlot
                          ? "bg-white border-[#e5e3df] shadow-xs"
                          : "bg-[#fafaf9]/80 border-[#e5e3df] border-dashed"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-mono font-bold text-[#1a1a1a]">Slot #{idx + 1}</span>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          fpAtSlot ? "bg-[#1aae39]" : "bg-[#a4a097]"
                        )} />
                      </div>
                      <div className="text-[11px] font-medium truncate text-[#5d5b54]">
                        {fpAtSlot ? fpAtSlot.label : "Tersedia"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header info & Add Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div>
                <h4 className="text-xs font-bold text-[#1a1a1a]">Daftar Sidik Jari Terdaftar</h4>
                <p className="text-[11px] text-[#5d5b54]">
                  Tersimpan di modul memori optik DY50 500 DPI.
                </p>
              </div>

              {!fpIsAdding && canAddMore && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5 shrink-0" />}
                  onClick={() => {
                    setFpIsAdding(true);
                    setFpEnrollStep(1);
                    setFpNewLabel("");
                  }}
                  className="rounded-md text-xs font-semibold self-start sm:self-auto shrink-0 bg-[#5645d4] hover:bg-[#4534b3] text-white shadow-xs cursor-pointer min-h-[32px] px-3"
                >
                  Daftar Sidik Jari Baru
                </Button>
              )}
            </div>

            {/* List of Registered Fingerprints */}
            {!fpIsAdding && (
              <div className="space-y-2">
                {existingFps.map((fp) => (
                  <div
                    key={fp.templateId}
                    className="p-3 rounded-lg border border-[#e5e3df] bg-white hover:border-[#c8c4be] transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-md bg-[#fafaf9] border border-[#e5e3df] text-[#5645d4] flex items-center justify-center shrink-0">
                          <Fingerprint className="h-4 w-4 shrink-0" />
                        </div>

                        {fpEditingTemplateId === fp.templateId ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Input
                              value={fpEditingLabelValue}
                              onChange={(e) => setFpEditingLabelValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveFpLabel(fp.templateId);
                                } else if (e.key === "Escape") {
                                  setFpEditingTemplateId(null);
                                }
                              }}
                              className="h-7 text-xs bg-white rounded-md border-[#5645d4] focus:ring-1 focus:ring-[#5645d4]"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveFpLabel(fp.templateId)}
                              className="p-1 text-[#1aae39] hover:bg-[#fafaf9] rounded-md min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                              aria-label="Simpan Label"
                              title="Simpan"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFpEditingTemplateId(null)}
                              className="p-1 text-[#5d5b54] hover:bg-[#f6f5f4] rounded-md min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                              aria-label="Batal Ubah Label"
                              title="Batal"
                            >
                              <X className="h-3.5 w-3.5 shrink-0" />
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-[#1a1a1a] truncate">{fp.label}</span>
                              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-[#fafaf9] text-[#5645d4] border border-[#e5e3df] shrink-0">
                                Slot #{fp.templateId}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#5d5b54] font-mono block mt-0.5 truncate">
                              Terdaftar: {new Date(fp.registeredAt).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>

                      {fpEditingTemplateId !== fp.templateId && (
                        <div className="flex items-center gap-1 shrink-0">
                          {fpDeletingTemplateId === fp.templateId ? (
                            <div className="flex items-center gap-1 bg-[#fdf2f2] border border-[#fbd5d5] p-1 rounded-md shrink-0">
                              <span className="text-[11px] text-[#e03131] font-semibold px-1 shrink-0">Hapus slot?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmRemoveFp(fp.templateId, fp.label)}
                                className="px-2 py-0.5 text-[11px] bg-[#e03131] text-white rounded-md font-medium hover:bg-[#c92a2a] cursor-pointer shrink-0"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setFpDeletingTemplateId(null)}
                                className="px-1.5 py-0.5 text-[11px] text-[#5d5b54] hover:bg-white rounded-md cursor-pointer shrink-0"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFpEditingTemplateId(fp.templateId);
                                  setFpEditingLabelValue(fp.label);
                                  setFpDeletingTemplateId(null);
                                }}
                                className="p-1.5 text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#f6f5f4] rounded-md transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer shrink-0"
                                title="Ubah Label"
                                aria-label={`Ubah label slot #${fp.templateId}`}
                              >
                                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFpDeletingTemplateId(fp.templateId)}
                                className="p-1.5 text-[#5d5b54] hover:text-[#e03131] hover:bg-[#fdf2f2] rounded-md transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer shrink-0"
                                title="Hapus Sidik Jari"
                                aria-label={`Hapus sidik jari slot #${fp.templateId}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {existingFps.length === 0 && (
                  <div className="p-6 text-center rounded-lg bg-[#f6f5f4] border border-[#e5e3df] text-[#5d5b54] space-y-2.5">
                    <div className="h-10 w-10 mx-auto rounded-full bg-white border border-[#e5e3df] flex items-center justify-center text-[#787671]">
                      <Fingerprint className="h-5 w-5 shrink-0" />
                    </div>
                    <div>
                      <p className="text-xs text-[#1a1a1a] font-semibold">Belum Ada Sidik Jari Terdaftar</p>
                      <p className="text-[11px] text-[#5d5b54] mt-0.5">
                        Daftarkan sidik jari optik DY50 untuk autentikasi fisik di pintu lab.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5 shrink-0" />}
                      onClick={() => {
                        setFpIsAdding(true);
                        setFpEnrollStep(1);
                        setFpNewLabel("");
                      }}
                      className="rounded-md text-xs cursor-pointer mt-1 font-medium text-[#37352f] hover:bg-[#ede9e4]"
                    >
                      Mulai Pendaftaran
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Guided Biometric Enrollment Wizard */}
            {fpIsAdding && (
              <div className="p-4 rounded-lg bg-[#fafaf9] border border-[#e5e3df] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#e5e3df] pb-2.5">
                  <span className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <Radio className="h-3.5 w-3.5 text-[#5645d4] animate-pulse shrink-0" />
                    <span className="truncate">Panduan Pendaftaran Biometrik DY50</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEnrollment}
                    className="text-[11px] text-[#5d5b54] hover:text-[#1a1a1a] p-1 cursor-pointer transition-colors font-medium shrink-0"
                  >
                    Batal
                  </button>
                </div>

                {/* Step 1: Configuration */}
                {fpEnrollStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="fp-label" className="text-xs font-semibold text-[#1a1a1a]">
                            Label Jari (Opsional)
                          </Label>
                          {fpNewLabel && (
                            <button
                              type="button"
                              onClick={() => setFpNewLabel("")}
                              className="text-[10px] text-[#787671] hover:text-[#e03131] cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <Input
                          id="fp-label"
                          placeholder="Misal: Jempol Kanan"
                          value={fpNewLabel}
                          onChange={(e) => setFpNewLabel(e.target.value)}
                          className="h-8 text-xs bg-white rounded-md border-[#e5e3df] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4]"
                        />
                        <div className="grid grid-cols-2 gap-1 pt-0.5">
                          {SUGGESTED_FINGER_LABELS.map((tag) => {
                            const isSelected = fpNewLabel === tag;
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setFpNewLabel(tag)}
                                className={cn(
                                  "text-[11px] font-medium py-1 px-1.5 rounded-md border text-center transition-all cursor-pointer truncate",
                                  isSelected
                                    ? "bg-[#e6e0f5] text-[#5645d4] border-[#5645d4]/40 font-semibold shadow-2xs"
                                    : "bg-white hover:bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df] hover:border-[#c8c4be]"
                                )}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="fp-room" className="text-xs font-semibold text-[#1a1a1a]">
                          Pilih Node Sensor DY50
                        </Label>
                        <CustomSelect
                          value={fpSelectedRoom}
                          onChange={(val) => setFpSelectedRoom(val)}
                          options={roomSelectOptions}
                          placeholder="Pilih Node Sensor..."
                          ariaLabel="Pilih Node Sensor DY50 Ruangan"
                          size="sm"
                          variant="form"
                          className="w-full"
                          menuClassName="w-full min-w-[240px]"
                        />
                      </div>
                    </div>

                    {/* Node Status Alert if OFFLINE */}
                    {rooms.find((r) => r.id === fpSelectedRoom)?.deviceStatus === "OFFLINE" ? (
                      <div className="p-3 rounded-md bg-[#fdf2f2] border border-[#fbd5d5] text-xs text-[#e03131] flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#e03131]" />
                        <div className="text-[11px] leading-relaxed">
                          Node sensor pada ruangan ini berstatus <strong>OFFLINE</strong>. Harap pilih ruangan lain yang terhubung ke broker MQTT.
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-md bg-white border border-[#e5e3df] text-xs text-[#5d5b54] flex items-start gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[#5645d4]" />
                        <div className="text-[11px] leading-relaxed">
                          Proses ini membutuhkan 2 kali penempelan jari pada sensor optik DY50 untuk kalkulasi template biometrik.
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelEnrollment}
                        className="rounded-md text-xs cursor-pointer font-medium text-[#37352f] hover:bg-[#ede9e4]"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={rooms.find((r) => r.id === fpSelectedRoom)?.deviceStatus === "OFFLINE"}
                        onClick={handleStartEnrollment}
                        className="rounded-md text-xs bg-[#5645d4] hover:bg-[#4534b3] text-white cursor-pointer font-medium shadow-xs"
                      >
                        Mulai Registrasi
                      </Button>
                    </div>
                  </div>
                )}

                {/* Steps 2-4: Interactive Scan Process */}
                {fpEnrollStep > 1 && (
                  <div className="text-center py-4 space-y-4">
                    <BiometricScanner
                      status={
                        fpEnrollStep === 2 || fpEnrollStep === 3 ? "scanning" :
                        fpEnrollStep === 4 ? "success" : "idle"
                      }
                      step={fpEnrollStep === 2 ? 1 : 2}
                      maxSteps={2}
                      size="md"
                    />

                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-[#1a1a1a]">
                        {fpEnrollStep === 2 && "Langkah 1/2: Letakkan Jari pada Sensor"}
                        {fpEnrollStep === 3 && "Langkah 2/2: Angkat & Letakkan Sekali Lagi"}
                        {fpEnrollStep === 4 && "Pendaftaran Biometrik Berhasil!"}
                      </h5>
                      <p className="text-[11px] text-[#5d5b54]">
                        {fpEnrollStep === 2 && "Tahan jari Anda hingga lampu sensor berkedip..."}
                        {fpEnrollStep === 3 && "Sedang memverifikasi kecocokan pola karakteristik minutiae..."}
                        {fpEnrollStep === 4 && `Data sidik jari tersimpan aman di Slot #${fpAssignedTemplateId}.`}
                      </p>
                    </div>

                    {fpEnrollStep === 4 && (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleCancelEnrollment}
                        className="rounded-md text-xs px-5 cursor-pointer bg-[#5645d4] hover:bg-[#4534b3] text-white font-semibold"
                      >
                        Selesai
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB 3: OTORISASI RUANGAN ═══ */}
        {activeTab === "rooms" && (
          <motion.div
            role="tabpanel"
            id="panel-edit-rooms"
            aria-labelledby="tab-edit-rooms"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5 text-[#1a1a1a]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ede9e4] pb-2">
              <div>
                <h4 className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#5645d4] shrink-0" />
                  <span>Hak Otorisasi Kunci Solenoid 12V</span>
                </h4>
                <p className="text-[11px] text-[#5d5b54]">
                  Tentukan laboratorium yang dapat dibuka oleh kredensial pengguna ini.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllRooms}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-[#e5e3df] text-[#37352f] hover:bg-[#f6f5f4] cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleClearAllRooms}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-[#e5e3df] text-[#5d5b54] hover:bg-[#fdf2f2] hover:text-[#e03131] cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>

            {role === "superadmin" && (
              <div className="p-3 rounded-lg bg-[#fafaf9] border border-[#e5e3df] text-xs text-[#5d5b54] flex items-center gap-2.5 shadow-xs">
                <DoorClosed className="h-4 w-4 text-[#5645d4] shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong className="text-[#1a1a1a]">Super Administrator:</strong> Memiliki izin bypass otomatis ke seluruh ruangan lab dan node relay.
                </span>
              </div>
            )}

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {rooms.map((room) => {
                const isChecked = accessibleRooms.includes(room.id);
                const isOnline = room.deviceStatus === "ONLINE";

                return (
                  <label
                    key={room.id}
                    htmlFor={`edit-room-${room.id}`}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-all cursor-pointer shadow-xs select-none",
                      isChecked
                        ? "border-[#5645d4] bg-[#fafaf9] text-[#1a1a1a]"
                        : "border-[#e5e3df] bg-white text-[#5d5b54] hover:bg-[#fafaf9]"
                    )}
                  >
                    <input
                      id={`edit-room-${room.id}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRoom(room.id)}
                      className="mt-0.5 rounded text-[#5645d4] focus:ring-[#5645d4] h-4 w-4 bg-white border-[#e5e3df] accent-[#5645d4] cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[#1a1a1a] leading-snug truncate">{room.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn("h-2 w-2 rounded-full shrink-0", isOnline ? "bg-[#1aae39] shadow-xs" : "bg-[#e03131]")}
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
                        <p className="text-[11px] text-[#5d5b54] truncate mt-0.5 leading-tight">{room.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}

      </DialogBody>

      {/* ── Dialog Footer with Unsaved Status Tracker ── */}
      <DialogFooter className="flex-col items-stretch gap-3 border-t border-[#e5e3df] bg-[#fafaf9] px-5 py-3 sm:px-6 sm:py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <div
            className={cn(
              "flex items-center gap-2 text-xs font-medium",
              hasUnsavedChanges ? "text-[#dd5b00]" : "text-[#5d5b54]"
            )}
          >
            <span className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              hasUnsavedChanges ? "bg-[#dd5b00] animate-pulse" : "bg-[#a4a097]"
            )} />
            <span>{hasUnsavedChanges ? "Ada perubahan belum disimpan" : "Semua data tersinkronisasi"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="min-h-[36px] w-full px-4 text-xs font-medium sm:w-auto cursor-pointer rounded-md text-[#37352f] hover:bg-[#ede9e4]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!hasUnsavedChanges}
            leftIcon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
            className="min-h-[36px] w-full px-5 text-xs font-semibold shadow-xs sm:w-auto cursor-pointer rounded-md bg-[#5645d4] hover:bg-[#4534b3] text-white disabled:opacity-50"
          >
            Simpan Perubahan
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
};

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  rooms,
  currentUser,
  initialTab,
  onUpdateUser,
  onEnrollFingerprint,
  onUpdateFingerprintLabel,
  onRemoveFingerprint,
  onShowToast,
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="lg"
        aria-labelledby="edit-user-dialog-title"
        aria-describedby="edit-user-dialog-description"
        onClose={onClose}
        className="w-full max-w-md sm:max-w-[560px] border-[#e5e3df] bg-white text-[#1a1a1a] shadow-[0_4px_16px_rgba(15,15,15,0.08)] rounded-xl"
      >
        <DialogHeader className="border-b border-[#e5e3df] bg-[#fafaf9] px-5 py-4 sm:px-6 sm:py-4.5 pr-12 sm:pr-14">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e3df] bg-white text-[#5645d4] shrink-0 shadow-xs mt-0.5">
              <Edit3 className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle id="edit-user-dialog-title" className="text-base sm:text-lg font-bold tracking-tight text-[#1a1a1a]">
                Kelola Profil &amp; Kredensial Pengguna
              </DialogTitle>
              <DialogDescription id="edit-user-dialog-description" className="text-xs text-[#5d5b54] mt-0.5 leading-normal">
                Perbarui identitas, biometrik DY50, dan otorisasi solenoid dengan aman.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <EditUserForm
          key={`${user.id}-${initialTab || "info"}`}
          user={user}
          initialTab={initialTab}
          onClose={onClose}
          rooms={rooms}
          currentUser={currentUser}
          onUpdateUser={onUpdateUser}
          onEnrollFingerprint={onEnrollFingerprint}
          onUpdateFingerprintLabel={onUpdateFingerprintLabel}
          onRemoveFingerprint={onRemoveFingerprint}
          onShowToast={onShowToast}
        />
      </DialogContent>
    </Dialog>
  );
};

