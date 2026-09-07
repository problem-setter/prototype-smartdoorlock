import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useApp } from "@/context";
import { User, UserRole, FingerprintSlot } from "../../types";
import { 
  UserPlus, 
  Search, 
  Fingerprint, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Radio, 
  User as UserIcon, 
  DoorOpen, 
  KeyRound, 
  ShieldAlert, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { BiometricScanner } from "@/components/animations/biometric-scanner";
import { ToastNotification, ToastItem, ToastVariant } from "@/components/animations/toast-notification";
import { cn } from "@/lib/utils";

export const UserManagementView: React.FC = () => {
  const { users, rooms, addUser, updateUser, deleteUser, removeFingerprint, enrollFingerprint, updateFingerprintLabel, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "superadmin" | "admin" | "user">("ALL");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);

  // Edit modal active category tab
  const [editCategory, setEditCategory] = useState<"info" | "fingerprint" | "rooms">("info");

  // Form states for new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNipNim, setNewNipNim] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newDepartment, setNewDepartment] = useState("Prodi Informatika FT UNTAN");
  const [newAccessibleRooms, setNewAccessibleRooms] = useState<string[]>(["room-kk-netsec"]);

  // Form states for editing user
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNipNim, setEditNipNim] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editDepartment, setEditDepartment] = useState("");
  const [editAccessibleRooms, setEditAccessibleRooms] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");

  // Fingerprint management states (inside edit modal)
  const [fpIsAdding, setFpIsAdding] = useState(false);
  const [fpEnrollStep, setFpEnrollStep] = useState<1 | 2 | 3 | 4>(1);
  const [fpAssignedTemplateId, setFpAssignedTemplateId] = useState<number | null>(null);
  const [fpNewLabel, setFpNewLabel] = useState("");
  const [fpEditingTemplateId, setFpEditingTemplateId] = useState<number | null>(null);
  const [fpEditingLabelValue, setFpEditingLabelValue] = useState("");

  // Toast notification state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdCounterRef = useRef(0);
  const toastTimersRef = useRef<Map<string | number, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all toast timers on unmount
  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string | number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "info", duration = 3500) => {
    const id = ++toastIdCounterRef.current;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    toastTimersRef.current.set(id, timer);
  }, [dismissToast]);

  // Helper to extract normalized fingerprints for a user
  const getUserFps = useCallback((user: User): FingerprintSlot[] => {
    if (user.fingerprints && user.fingerprints.length > 0) {
      return user.fingerprints;
    }
    if (user.fingerprintTemplateIds && user.fingerprintTemplateIds.length > 0) {
      return user.fingerprintTemplateIds.map((id, idx) => ({
        templateId: id,
        label: idx === 0 ? "Jempol Kanan" : idx === 1 ? "Telunjuk Kanan" : "Sidik Jari #" + id,
        registeredAt: user.createdAt || new Date().toISOString(),
      }));
    }
    if (user.fingerprintTemplateId) {
      return [{
        templateId: user.fingerprintTemplateId,
        label: "Jempol Kanan",
        registeredAt: user.createdAt || new Date().toISOString(),
      }];
    }
    return [];
  }, []);

  // Compute metrics
  const totalFpCount = useMemo(() => {
    return users.reduce((acc, u) => acc + getUserFps(u).length, 0);
  }, [users, getUserFps]);

  const activeUsersCount = useMemo(() => {
    return users.filter(u => u.status === "ACTIVE").length;
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nipNim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Format room names text
  const getRoomSummary = (user: User) => {
    if (!user.accessibleRoomIds || user.accessibleRoomIds.length === 0) {
      return { text: "Tidak ada akses", fullText: "Belum ada ruangan" };
    }
    if (user.accessibleRoomIds.length === rooms.length && rooms.length > 0) {
      return { 
        text: "Semua Ruangan (" + rooms.length + ")", 
        fullText: rooms.map(r => r.name).join(", ") 
      };
    }
    const userRooms = rooms.filter(r => user.accessibleRoomIds.includes(r.id));
    const names = userRooms.map(r => r.name);
    if (names.length === 0) return { text: user.accessibleRoomIds.length + " Ruangan", fullText: "" };
    if (names.length === 1) return { text: names[0], fullText: names[0] };
    return {
      text: names[0] + " +" + (names.length - 1),
      fullText: names.join(", ")
    };
  };

  const handleOpenAddUser = () => {
    setNewName("");
    setNewEmail("");
    setNewNipNim("");
    setNewRole("user");
    setNewDepartment("Prodi Informatika FT UNTAN");
    setNewAccessibleRooms(["room-kk-netsec"]);
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newNipNim.trim()) {
      showToast("Mohon lengkapi seluruh field yang wajib diisi.", "error");
      return;
    }

    addUser({
      name: newName.trim(),
      email: newEmail.trim(),
      nipNim: newNipNim.trim(),
      role: newRole,
      roleLabel: newRole === "superadmin" ? "Super Administrator" : newRole === "admin" ? "Administrator" : "Pengguna",
      department: newDepartment.trim(),
      accessibleRoomIds: newAccessibleRooms,
      status: "ACTIVE",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    });

    setIsAddUserModalOpen(false);
    showToast("Pengguna baru \"" + newName.trim() + "\" berhasil didaftarkan.", "success");
  };

  const handleOpenEdit = (user: User) => {
    setEditModalUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditNipNim(user.nipNim);
    setEditRole(user.role);
    setEditDepartment(user.department);
    setEditAccessibleRooms(user.accessibleRoomIds || []);
    setEditStatus(user.status);
    setEditCategory("info");
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpEditingTemplateId(null);
  };

  const handleCloseEdit = () => {
    setEditModalUser(null);
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpEditingTemplateId(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    if (!editName.trim() || !editEmail.trim() || !editNipNim.trim()) {
      showToast("Nama, Email, dan NIP/NIM tidak boleh kosong.", "error");
      return;
    }

    updateUser(editModalUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      nipNim: editNipNim.trim(),
      role: editRole,
      roleLabel: editRole === "superadmin" ? "Super Administrator" : editRole === "admin" ? "Administrator" : "Pengguna",
      department: editDepartment.trim(),
      accessibleRoomIds: editAccessibleRooms,
      status: editStatus,
    });

    showToast("Data \"" + editName.trim() + "\" berhasil diperbarui.", "success");
    handleCloseEdit();
  };

  const toggleNewRoomSelection = (roomId: string) => {
    setNewAccessibleRooms(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const toggleEditRoomSelection = (roomId: string) => {
    setEditAccessibleRooms(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  // Get edit user current fingerprints
  const getEditUserFps = (): FingerprintSlot[] => {
    if (!editModalUser) return [];
    const freshUser = users.find(u => u.id === editModalUser.id);
    return freshUser ? getUserFps(freshUser) : getUserFps(editModalUser);
  };

  const getNextSuggestedLabel = (): string => {
    const currentFps = getEditUserFps();
    if (currentFps.length === 0) return "Jempol Kanan";
    if (currentFps.length === 1) return "Telunjuk Kanan";
    if (currentFps.length === 2) return "Jempol Kiri";
    return "Jari #" + (currentFps.length + 1);
  };

  const handleFpStartAddFlow = () => {
    const currentFps = getEditUserFps();
    if (currentFps.length >= 3) {
      showToast("Kapasitas maksimal 3 sidik jari per pengguna telah tercapai.", "warning");
      return;
    }
    setFpNewLabel(getNextSuggestedLabel());
    setFpEnrollStep(1);
    setFpIsAdding(true);
  };

  const handleFpCancelAddFlow = () => {
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);
    setFpNewLabel("");
  };

  const handleFpStartEnrollment = async () => {
    if (!editModalUser) return;
    setFpEnrollStep(2);

    setTimeout(() => {
      setFpEnrollStep(3);
    }, 1800);

    setTimeout(async () => {
      try {
        const finalLabel = fpNewLabel.trim() || getNextSuggestedLabel();
        const primaryRoom = editAccessibleRooms[0] || "room-kk-netsec";
        const result = await enrollFingerprint(editModalUser.id, primaryRoom, finalLabel);

        if (result.success) {
          setFpAssignedTemplateId(result.templateId);
          setFpEnrollStep(4);
          showToast("Sidik jari #" + result.templateId + " (" + finalLabel + ") berhasil didaftarkan.", "success");
        } else {
          setFpEnrollStep(1);
          setFpIsAdding(false);
          showToast("Perekaman sidik jari gagal. Pastikan jari ditempel dengan benar pada sensor AS608.", "error");
        }
      } catch (err) {
        setFpEnrollStep(1);
        setFpIsAdding(false);
        showToast("Terjadi kesalahan saat sinkronisasi hardware AS608.", "error");
      }
    }, 3600);
  };

  const handleFpDelete = (templateId: number, label: string) => {
    if (!editModalUser) return;
    removeFingerprint(editModalUser.id, templateId);
    showToast("Sidik jari #" + templateId + " (" + label + ") berhasil dihapus dari sensor AS608.", "warning");
  };

  const handleFpStartEditLabel = (templateId: number, currentLabel: string) => {
    setFpEditingTemplateId(templateId);
    setFpEditingLabelValue(currentLabel);
  };

  const handleFpSaveLabel = (templateId: number) => {
    if (!editModalUser || !fpEditingLabelValue.trim()) return;
    updateFingerprintLabel(editModalUser.id, templateId, fpEditingLabelValue.trim());
    setFpEditingTemplateId(null);
    showToast("Label sidik jari #" + templateId + " diubah menjadi \"" + fpEditingLabelValue.trim() + "\".", "success");
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── Top Header & Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-purple-400" />
            Manajemen Pengguna & Kredensial
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Direktori otorisasi hak akses solenoid dan pendaftaran biometrik AS608 FT UNTAN
          </p>
        </div>

        {currentUser?.role === "superadmin" && (
          <Button
            onClick={handleOpenAddUser}
            variant="purple"
            size="default"
            leftIcon={<UserPlus className="h-4 w-4" />}
            className="shadow-lg shadow-purple-950/40 cursor-pointer self-start sm:self-auto shrink-0"
          >
            Tambah Pengguna
          </Button>
        )}
      </div>

      {/* ── Metrics Summary Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0b111e]/80 border border-white/[0.06] backdrop-blur-md flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Pengguna</span>
            <div className="text-2xl font-bold text-white font-mono">
              <AnimatedCounter value={users.length} />
            </div>
            <p className="text-[10px] text-slate-400">Terdaftar di direktori</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <UserIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b111e]/80 border border-white/[0.06] backdrop-blur-md flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sidik Jari Terdaftar</span>
            <div className="text-2xl font-bold text-purple-300 font-mono">
              <AnimatedCounter value={totalFpCount} />
            </div>
            <p className="text-[10px] text-slate-400">Template sensor AS608</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Fingerprint className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b111e]/80 border border-white/[0.06] backdrop-blur-md flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pengguna Aktif</span>
            <div className="text-2xl font-bold text-emerald-300 font-mono">
              <AnimatedCounter value={activeUsersCount} />
            </div>
            <p className="text-[10px] text-slate-400">Hak akses solenoid aktif</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0b111e]/90 border border-white/[0.06] backdrop-blur-md shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIP/NIM, email, atau jurusan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Role Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "Semua" },
            { id: "superadmin", label: "Superadmin" },
            { id: "admin", label: "Admin" },
            { id: "user", label: "Pengguna" },
          ].map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer select-none",
                  isActive
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop & Tablet Table (Clean, Modern, Simple, Minimalist) ── */}
      <div className="hidden sm:block rounded-2xl border border-white/[0.04] bg-[#0b111e]/90 overflow-hidden shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Peran & Akses
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Biometrik & Ruangan
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.025] text-xs">
              {filteredUsers.map((user) => {
                const fps = getUserFps(user);
                const roomSummary = getRoomSummary(user);

                return (
                  <tr 
                    key={user.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Column 1: User Identity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover border border-white/10 group-hover:border-purple-500/40 transition-colors"
                          />
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b111e]",
                              user.status === "ACTIVE" ? "bg-emerald-400" : "bg-rose-400"
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white group-hover:text-purple-200 transition-colors">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {user.nipNim} &bull; <span className="text-slate-400 font-sans">{user.department}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Role (Clean Typography without heavy badge boxes) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.role === "superadmin" ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0" />
                            <div>
                              <div className="font-medium text-purple-300">Super Administrator</div>
                              <div className="text-[10px] text-slate-400">Akses Penuh & Sensor AS608</div>
                            </div>
                          </>
                        ) : user.role === "admin" ? (
                          <>
                            <KeyRound className="h-4 w-4 text-sky-400 shrink-0" />
                            <div>
                              <div className="font-medium text-sky-300">Administrator</div>
                              <div className="text-[10px] text-slate-400">Override Solenoid & Lab</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            <div>
                              <div className="font-medium text-slate-300">Pengguna</div>
                              <div className="text-[10px] text-slate-400">Akses Terjadwal</div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Column 3: Biometrics & Room summary (Clean text, no pill spam) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Fingerprint className={cn("h-3.5 w-3.5 shrink-0", fps.length > 0 ? "text-purple-400" : "text-slate-600")} />
                          <span className="font-mono text-xs font-semibold text-slate-200">{fps.length}</span>
                          <span className="text-slate-400 text-[11px]">sidik jari</span>
                          {fps.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                              (ID: {fps.map(f => "#" + f.templateId).join(", ")})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <DoorOpen className="h-3.5 w-3.5 text-sky-400/70 shrink-0" />
                          <span className="truncate max-w-[200px]" title={roomSummary.fullText}>
                            {roomSummary.text}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Status (Modern dot indicator without heavy badge borders) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {user.status === "ACTIVE" ? (
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </span>
                          <span>Aktif</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-400">
                          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                          <span>Nonaktif</span>
                        </div>
                      )}
                    </td>

                    {/* Column 5: Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/[0.08] text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 group/btn"
                          title="Kelola Data & Sidik Jari"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-purple-400 group-hover/btn:text-purple-300 transition-colors" />
                          <span>Kelola</span>
                        </button>

                        {user.role === "superadmin" ? (
                          <span
                            className="h-8 w-8 flex items-center justify-center text-slate-600 opacity-30 cursor-not-allowed"
                            title="Superadmin tidak dapat dihapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const userName = user.name;
                              deleteUser(user.id);
                              showToast("Pengguna \"" + userName + "\" berhasil dihapus.", "warning");
                            }}
                            className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                            title={"Hapus Pengguna " + user.name}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="text-xs font-medium text-slate-300">Tidak ada data pengguna yang sesuai.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci pencarian atau filter lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Card List (Clean & Modern) ── */}
      <div className="block sm:hidden space-y-3">
        {filteredUsers.map((user) => {
          const fps = getUserFps(user);
          const roomSummary = getRoomSummary(user);

          return (
            <div
              key={user.id}
              className="p-4 rounded-2xl bg-[#0b111e]/90 border border-white/[0.06] shadow-lg shadow-black/40 space-y-3"
            >
              {/* Header: Avatar, Name, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                    />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b111e]",
                        user.status === "ACTIVE" ? "bg-emerald-400" : "bg-rose-400"
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-white truncate">{user.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.nipNim}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {user.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      Nonaktif
                    </span>
                  )}
                </div>
              </div>

              {/* Grid info: Role, Department, Biometrics & Rooms */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.025] text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Peran</span>
                  <div className="font-medium text-slate-200 mt-0.5 flex items-center gap-1.5">
                    {user.role === "superadmin" ? (
                      <span className="text-purple-300 font-medium">Superadmin</span>
                    ) : user.role === "admin" ? (
                      <span className="text-sky-300 font-medium">Admin Lab</span>
                    ) : (
                      <span className="text-slate-300 font-medium">Pengguna</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Biometrik & Akses</span>
                  <div className="text-slate-300 mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Fingerprint className="h-3 w-3 text-purple-400" />
                      <span className="font-mono text-purple-300 text-[11px]">{fps.length} FP</span>
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <DoorOpen className="h-3 w-3 text-sky-400" />
                      <span className="text-slate-400 text-[11px] truncate max-w-[80px]">{roomSummary.text}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-white/[0.025]">
                <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                  {user.department}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors border border-white/[0.08]"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-purple-400" />
                    <span>Kelola</span>
                  </button>

                  {user.role !== "superadmin" && (
                    <button
                      onClick={() => {
                        const userName = user.name;
                        deleteUser(user.id);
                        showToast("Pengguna \"" + userName + "\" berhasil dihapus.", "warning");
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-[#0b111e]/90 border border-white/[0.06] text-slate-400">
            <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-xs font-medium text-slate-300">Tidak ada pengguna yang sesuai.</p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          ADD USER MODAL (Clean, Refined)
         ════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-md bg-[#0c111e] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserPlus className="h-5 w-5 text-purple-400" />
              Tambah Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Registrasi pengguna ke dalam database sistem kendali kunci pintar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser}>
            <DialogBody className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-name" className="text-slate-300">Nama Lengkap *</Label>
                <Input
                  id="new-name"
                  type="text"
                  placeholder="Misal: Dr. Eng. Ir. Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-black/40 border-white/[0.08]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-email" className="text-slate-300">Alamat Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="budi@untan.ac.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-black/40 border-white/[0.08]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-nip" className="text-slate-300">NIP / NIM *</Label>
                  <Input
                    id="new-nip"
                    type="text"
                    placeholder="198504122010121002"
                    value={newNipNim}
                    onChange={(e) => setNewNipNim(e.target.value)}
                    className="bg-black/40 border-white/[0.08]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-role" className="text-slate-300">Tingkat Hak Akses</Label>
                  <select
                    id="new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="user">User Biasa</option>
                    <option value="admin">Admin Ruangan</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-dept" className="text-slate-300">Jurusan / Unit Kerja</Label>
                  <Input
                    id="new-dept"
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="bg-black/40 border-white/[0.08]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <Label className="text-slate-300">Otorisasi Akses Ruangan Awal:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {rooms.map((room) => (
                    <label
                      key={room.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all",
                        newAccessibleRooms.includes(room.id)
                          ? "bg-purple-950/30 border-purple-800/50 text-purple-200"
                          : "bg-black/30 border-white/[0.06] text-slate-400 hover:border-white/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={newAccessibleRooms.includes(room.id)}
                        onChange={() => toggleNewRoomSelection(room.id)}
                        className="rounded text-purple-600 focus:ring-0 h-4 w-4"
                      />
                      <div className="text-xs flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{room.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{room.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="pt-3 border-t border-white/[0.06]">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddUserModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="purple" size="sm">
                Simpan & Daftarkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          EDIT USER MODAL (Refined Tabs & Biometric Enrollment)
         ════════════════════════════════════════════════════════════ */}
      {editModalUser && (
        <Dialog open={Boolean(editModalUser)} onOpenChange={(open) => !open && handleCloseEdit()}>
          <DialogContent className="max-w-lg bg-[#0c111e] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Edit3 className="h-5 w-5 text-purple-400" />
                Kelola Profil & Kredensial Pengguna
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Pembaruan data personal, slot biometrik AS608, dan hak akses pintu.
              </DialogDescription>
            </DialogHeader>

            {/* Category Tab Switcher */}
            <div className="flex border-b border-white/[0.08] gap-1 px-1">
              <button
                type="button"
                onClick={() => { setEditCategory("info"); setFpIsAdding(false); }}
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer select-none",
                  editCategory === "info"
                    ? "border-purple-400 text-purple-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                Informasi Akun
              </button>
              <button
                type="button"
                onClick={() => setEditCategory("fingerprint")}
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer select-none flex items-center gap-1.5",
                  editCategory === "fingerprint"
                    ? "border-purple-400 text-purple-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Sidik Jari AS608</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300">
                  {getEditUserFps().length}/3
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setEditCategory("rooms"); setFpIsAdding(false); }}
                className={cn(
                  "px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer select-none flex items-center gap-1.5",
                  editCategory === "rooms"
                    ? "border-purple-400 text-purple-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Akses Ruangan</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300">
                  {editAccessibleRooms.length}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <DialogBody className="py-4">
                {/* Tab 1: Info Akun */}
                {editCategory === "info" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-user-name" className="text-slate-300">Nama Lengkap</Label>
                      <Input
                        id="edit-user-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-black/40 border-white/[0.08]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-user-email" className="text-slate-300">Alamat Email</Label>
                        <Input
                          id="edit-user-email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="bg-black/40 border-white/[0.08]"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-user-nip" className="text-slate-300">NIP / NIM</Label>
                        <Input
                          id="edit-user-nip"
                          type="text"
                          value={editNipNim}
                          onChange={(e) => setEditNipNim(e.target.value)}
                          className="bg-black/40 border-white/[0.08]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-user-role" className="text-slate-300">Peran & Wewenang</Label>
                        <select
                          id="edit-user-role"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="user">User Biasa</option>
                          <option value="admin">Admin Ruangan</option>
                          <option value="superadmin">Super Administrator</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="edit-user-status" className="text-slate-300">Status Akun</Label>
                        <select
                          id="edit-user-status"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "SUSPENDED")}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="ACTIVE">ACTIVE (Aktif)</option>
                          <option value="SUSPENDED">SUSPENDED (Dinonaktifkan)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-user-dept" className="text-slate-300">Jurusan / Unit Kerja</Label>
                      <Input
                        id="edit-user-dept"
                        type="text"
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="bg-black/40 border-white/[0.08]"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Sidik Jari AS608 */}
                {editCategory === "fingerprint" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Fingerprint className="h-4 w-4 text-purple-400" />
                          Slot Biometrik ({getEditUserFps().length}/3)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Maksimal 3 template sidik jari terdaftar per akun di sensor AS608.
                        </p>
                      </div>
                      {!fpIsAdding && getEditUserFps().length < 3 && currentUser?.role === "superadmin" && (
                        <Button
                          type="button"
                          variant="purple"
                          size="sm"
                          onClick={handleFpStartAddFlow}
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Daftar Baru
                        </Button>
                      )}
                    </div>

                    {!fpIsAdding ? (
                      <div className="space-y-2">
                        {getEditUserFps().length === 0 ? (
                          <div className="p-6 text-center rounded-2xl bg-black/30 border border-white/[0.06] space-y-2">
                            <Fingerprint className="h-8 w-8 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400">Belum ada sidik jari yang terdaftar.</p>
                            {currentUser?.role === "superadmin" && (
                              <Button
                                type="button"
                                variant="purple"
                                size="sm"
                                onClick={handleFpStartAddFlow}
                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                                className="mt-1"
                              >
                                Daftarkan Sekarang
                              </Button>
                            )}
                          </div>
                        ) : (
                          getEditUserFps().map((fp) => (
                            <div
                              key={fp.templateId}
                              className="p-3 rounded-xl bg-black/30 border border-white/[0.06] flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                  #{fp.templateId}
                                </div>
                                <div className="min-w-0">
                                  {fpEditingTemplateId === fp.templateId ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={fpEditingLabelValue}
                                        onChange={(e) => setFpEditingLabelValue(e.target.value)}
                                        className="px-2 py-0.5 rounded bg-slate-900 border border-purple-500 text-xs text-white"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleFpSaveLabel(fp.templateId)}
                                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFpEditingTemplateId(null)}
                                        className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-semibold text-xs text-white flex items-center gap-2">
                                        <span>{fp.label}</span>
                                        {currentUser?.role === "superadmin" && (
                                          <button
                                            type="button"
                                            onClick={() => handleFpStartEditLabel(fp.templateId, fp.label)}
                                            className="text-slate-500 hover:text-purple-300 transition-colors"
                                            title="Ubah Label"
                                          >
                                            <Edit3 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        Terdaftar: {new Date(fp.registeredAt).toLocaleDateString("id-ID")}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {currentUser?.role === "superadmin" && (
                                <button
                                  type="button"
                                  onClick={() => handleFpDelete(fp.templateId, fp.label)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Hapus sidik jari ini"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      /* AS608 Enrollment Wizard */
                      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-4">
                        <div className="flex items-center justify-between text-xs border-b border-purple-900/30 pb-3">
                          <span className="font-semibold text-purple-300">Pendaftaran Sidik Jari Baru</span>
                          <span className="font-mono text-[11px] text-purple-400">Langkah {fpEnrollStep}/4</span>
                        </div>

                        {fpEnrollStep === 1 && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor="fp-label-input" className="text-slate-300">Label Jari:</Label>
                              <Input
                                id="fp-label-input"
                                type="text"
                                placeholder="Misal: Jempol Kanan"
                                value={fpNewLabel}
                                onChange={(e) => setFpNewLabel(e.target.value)}
                                className="bg-black/40 border-white/[0.08]"
                              />
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
                              <h5 className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                                <Radio className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                                Prosedur Sensor Biometrik AS608
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Sistem akan mengirimkan sinyal MQTT pendaftaran. Pengguna diminta menempelkan jari 2 kali pada modul optik AS608.
                              </p>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button type="button" variant="secondary" size="sm" onClick={handleFpCancelAddFlow}>
                                Batal
                              </Button>
                              <Button
                                type="button"
                                variant="purple"
                                size="sm"
                                onClick={handleFpStartEnrollment}
                                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                              >
                                Mulai Perekaman
                              </Button>
                            </div>
                          </div>
                        )}

                        {fpEnrollStep > 1 && (
                          <div className="py-2 text-center space-y-3">
                            <BiometricScanner
                              status={
                                fpEnrollStep === 2
                                  ? "scanning"
                                  : fpEnrollStep === 3
                                  ? "scanning"
                                  : "success"
                              }
                              size="md"
                              label={
                                fpEnrollStep === 2
                                  ? "Tempelkan Jari Pertama Kali"
                                  : fpEnrollStep === 3
                                  ? "Angkat & Tempelkan Sekali Lagi"
                                  : "Sidik Jari Berhasil Terdaftar!"
                              }
                              sublabel={
                                fpEnrollStep === 2
                                  ? "Minta " + editName + " menempelkan jari pada sensor AS608..."
                                  : fpEnrollStep === 3
                                  ? "Sensor memverifikasi pola biometrik..."
                                  : "Label \"" + (fpNewLabel || getNextSuggestedLabel()) + "\" (Template #" + fpAssignedTemplateId + ")"
                              }
                            />
                            {fpEnrollStep === 4 && (
                              <Button
                                type="button"
                                variant="success"
                                size="sm"
                                className="w-full mt-2"
                                onClick={handleFpCancelAddFlow}
                              >
                                Selesai & Kembali
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Otorisasi Akses Ruangan */}
                {editCategory === "rooms" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                        Hak Akses Ruangan Terpilih
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Pilih ruangan lab yang diizinkan untuk dibuka oleh pengguna ini.
                      </p>
                    </div>
                    <div className="space-y-2 pt-1 max-h-64 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <label
                          key={room.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                            editAccessibleRooms.includes(room.id)
                              ? "bg-purple-950/30 border-purple-800/50 text-purple-200"
                              : "bg-black/30 border-white/[0.06] text-slate-400 hover:border-white/20"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={editAccessibleRooms.includes(room.id)}
                            onChange={() => toggleEditRoomSelection(room.id)}
                            className="rounded text-purple-600 focus:ring-0 h-4 w-4"
                          />
                          <div className="text-xs flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white truncate">{room.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 font-mono">
                                {room.code}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{room.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter className="pt-3 border-t border-white/[0.06]">
                <Button type="button" variant="secondary" size="sm" onClick={handleCloseEdit}>
                  Batal
                </Button>
                <Button type="submit" variant="purple" size="sm">
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Toast Notification Container ── */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
};
