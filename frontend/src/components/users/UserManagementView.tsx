import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context';
import { User, UserRole, FingerprintSlot, ROLE_LABELS } from '../../types';
import { 
  UserPlus, 
  Search, 
  Fingerprint, 
  Trash2, 
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Radio,
  User as UserIcon,
  DoorOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { FadeIn } from '@/components/animations/fade-in';
import { AnimatedCounter } from '@/components/animations/animated-counter';
import { BiometricScanner } from '@/components/animations/biometric-scanner';
import { ToastNotification, ToastItem, ToastVariant } from '@/components/animations/toast-notification';
import { cn } from '@/lib/utils';


export const UserManagementView: React.FC = () => {
  const { users, rooms, addUser, updateUser, deleteUser, removeFingerprint, enrollFingerprint, updateFingerprintLabel, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);

  // Edit modal active category tab
  const [editCategory, setEditCategory] = useState<'info' | 'fingerprint' | 'rooms'>('info');

  // Form states for new user
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNipNim, setNewNipNim] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newDepartment, setNewDepartment] = useState('Prodi Informatika FT UNTAN');
  const [newAccessibleRooms, setNewAccessibleRooms] = useState<string[]>(['room-kk-netsec']);

  // Form states for editing user
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNipNim, setEditNipNim] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAccessibleRooms, setEditAccessibleRooms] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');

  // Fingerprint management states (inside edit modal)
  const [fpIsAdding, setFpIsAdding] = useState(false);
  const [fpEnrollStep, setFpEnrollStep] = useState<1 | 2 | 3 | 4>(1);
  const [fpAssignedTemplateId, setFpAssignedTemplateId] = useState<number | null>(null);
  const [fpNewLabel, setFpNewLabel] = useState('');
  const [fpEditingTemplateId, setFpEditingTemplateId] = useState<number | null>(null);
  const [fpEditingLabelValue, setFpEditingLabelValue] = useState('');

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

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() * 1000 + (toastIdCounterRef.current++);
    setToasts((prev) => [...prev, { id, message, variant }]);

    // Each toast gets its own independent auto-dismiss timer
    const timer = setTimeout(() => {
      dismissToast(id);
    }, 3000);
    toastTimersRef.current.set(id, timer);
  }, [dismissToast]);


  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nipNim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenEdit = (user: User) => {
    setEditModalUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditNipNim(user.nipNim);
    setEditRole(user.role);
    setEditDepartment(user.department);
    setEditAccessibleRooms([...user.accessibleRoomIds]);
    setEditStatus(user.status);
    setEditCategory('info');
    // Reset fingerprint states
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);
    setFpNewLabel('');
    setFpEditingTemplateId(null);
    setFpEditingLabelValue('');
  };

  const handleCloseEdit = () => {
    setEditModalUser(null);
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);
    setFpNewLabel('');
    setFpEditingTemplateId(null);
    setFpEditingLabelValue('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser || !editName || !editNipNim) return;

    updateUser(editModalUser.id, {
      name: editName,
      email: editEmail || `${editNipNim.toLowerCase()}@untan.ac.id`,
      nipNim: editNipNim,
      role: editRole,
      roleLabel: ROLE_LABELS[editRole],
      department: editDepartment,
      accessibleRoomIds: editAccessibleRooms,
      status: editStatus,
    });

    showToast(`Data pengguna "${editName}" berhasil diperbarui.`, 'success');
    handleCloseEdit();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newNipNim) return;

    addUser({
      name: newName,
      email: newEmail || `${newNipNim.toLowerCase()}@untan.ac.id`,
      nipNim: newNipNim,
      role: newRole,
      roleLabel: ROLE_LABELS[newRole],
      department: newDepartment,
      accessibleRoomIds: newAccessibleRooms,
      status: 'ACTIVE',
      avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
    });

    showToast(`Pengguna baru "${newName}" berhasil ditambahkan.`, 'success');
    setNewName('');
    setNewEmail('');
    setNewNipNim('');
    setIsAddUserModalOpen(false);
  };

  const toggleRoomSelection = (roomId: string) => {
    if (newAccessibleRooms.includes(roomId)) {
      setNewAccessibleRooms(newAccessibleRooms.filter((id) => id !== roomId));
    } else {
      setNewAccessibleRooms([...newAccessibleRooms, roomId]);
    }
  };

  const toggleEditRoomSelection = (roomId: string) => {
    if (editAccessibleRooms.includes(roomId)) {
      setEditAccessibleRooms(editAccessibleRooms.filter((id) => id !== roomId));
    } else {
      setEditAccessibleRooms([...editAccessibleRooms, roomId]);
    }
  };

  // --- Fingerprint helper functions for inline edit modal ---
  const getEditUserFps = (): FingerprintSlot[] => {
    if (!editModalUser) return [];
    // Always get the latest from users array (live state)
    const liveUser = users.find((u) => u.id === editModalUser.id);
    const source = liveUser || editModalUser;
    return source.fingerprints || (
      source.fingerprintTemplateIds
        ? source.fingerprintTemplateIds.map((id, idx) => ({
            templateId: id,
            label: idx === 0 ? 'Jempol Kanan' : idx === 1 ? 'Telunjuk Kanan' : 'Jempol Kiri',
            registeredAt: source.createdAt || new Date().toISOString()
          }))
        : source.fingerprintTemplateId
          ? [{ templateId: source.fingerprintTemplateId, label: 'Jempol Kanan', registeredAt: source.createdAt || new Date().toISOString() }]
          : []
    );
  };

  const defaultSuggestedLabels = [
    'Jempol Kanan',
    'Telunjuk Kanan',
    'Jempol Kiri',
    'Telunjuk Kiri',
    'Jari Tengah Kanan'
  ];

  const getNextSuggestedLabel = () => {
    const fps = getEditUserFps();
    return defaultSuggestedLabels.find(
      (l) => !fps.some((f) => f.label.toLowerCase() === l.toLowerCase())
    ) || `Sidik Jari #${fps.length + 1}`;
  };

  const handleFpStartAddFlow = () => {
    setFpIsAdding(true);
    setFpNewLabel(getNextSuggestedLabel());
    setFpEnrollStep(1);
  };

  const handleFpCancelAddFlow = () => {
    setFpIsAdding(false);
    setFpEnrollStep(1);
    setFpAssignedTemplateId(null);
    setFpNewLabel('');
  };

  const handleFpStartEnrollment = async () => {
    if (!editModalUser) return;
    setFpEnrollStep(2);

    setTimeout(() => {
      setFpEnrollStep(3);

      setTimeout(async () => {
        const labelToSave = fpNewLabel.trim() !== '' ? fpNewLabel.trim() : getNextSuggestedLabel();
        const targetRoom = rooms[0];
        const result = await enrollFingerprint(editModalUser.id, targetRoom.id, labelToSave);
        if (result.success) {
          setFpAssignedTemplateId(result.templateId);
          setFpEnrollStep(4);
          showToast(`Sidik jari "${labelToSave}" (#${result.templateId}) berhasil didaftarkan.`, 'success');
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.6 },
          });
        }
      }, 2000);
    }, 2000);
  };

  const handleFpSaveLabelEdit = (templateId: number) => {
    if (!editModalUser) return;
    if (fpEditingLabelValue.trim() !== '') {
      updateFingerprintLabel(editModalUser.id, templateId, fpEditingLabelValue.trim());
      showToast(`Label sidik jari #${templateId} diubah menjadi "${fpEditingLabelValue.trim()}".`, 'success');
    }
    setFpEditingTemplateId(null);
    setFpEditingLabelValue('');
  };

  const handleFpRemove = (templateId: number) => {
    if (!editModalUser) return;
    removeFingerprint(editModalUser.id, templateId);
    showToast(`Sidik jari #${templateId} berhasil dihapus dari ${editModalUser.name}.`, 'warning');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header & Actions */}
      <FadeIn direction="up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-400 shrink-0" />
              Manajemen Pengguna & Biometrik
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Kelola hak akses fisik dan pendaftaran sidik jari AS608 (&bull; <strong className="text-slate-200 font-mono"><AnimatedCounter value={users.length} /></strong> pengguna terdaftar)
            </p>
          </div>

          <Button
            variant="purple"
            size="sm"
            onClick={() => setIsAddUserModalOpen(true)}
            leftIcon={<UserPlus className="h-4 w-4 shrink-0" />}
            className="w-full sm:w-auto"
          >
            Tambah Pengguna Baru
          </Button>
        </div>
      </FadeIn>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Cari nama, NIP/NIM, email, atau jurusan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Mobile Card View (Visible on smartphone < sm) — compact layout */}
      <div className="block sm:hidden space-y-2">
        {filteredUsers.map((user) => {
          const fps = user.fingerprints || (
            user.fingerprintTemplateIds
              ? user.fingerprintTemplateIds.map((id, i) => ({
                  templateId: id,
                  label: i === 0 ? 'Jempol Kanan' : i === 1 ? 'Telunjuk Kanan' : 'Jempol Kiri',
                  registeredAt: ''
                }))
              : user.fingerprintTemplateId
                ? [{ templateId: user.fingerprintTemplateId, label: 'Jempol Kanan', registeredAt: '' }]
                : []
          );
          return (
            <div
              key={user.id}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 active:bg-slate-800/80 transition-colors touch-manipulation"
              onClick={() => handleOpenEdit(user)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenEdit(user); }}
            >
              {/* Single-row: Avatar + Info + Actions */}
              <div className="flex items-center gap-2.5">
                {/* Avatar with status indicator */}
                <div className="relative shrink-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover border border-slate-700"
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                    user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                </div>

                {/* Name + compact meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white truncate">{user.name}</span>
                    <span className={`px-1.5 py-px rounded text-[9px] font-bold uppercase shrink-0 leading-tight ${
                      user.role === 'superadmin'
                        ? 'bg-purple-950/70 text-purple-300 border border-purple-800/50'
                        : user.role === 'admin'
                        ? 'bg-sky-950/70 text-sky-300 border border-sky-800/50'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                    }`}>
                      {user.role === 'superadmin' ? 'SA' : user.role === 'admin' ? 'ADM' : 'USR'}
                    </span>
                  </div>

                  {/* Compact stats row */}
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span className="font-mono truncate">{user.nipNim}</span>
                    <span className="text-slate-700">•</span>
                    <span className="inline-flex items-center gap-0.5 shrink-0">
                      <Fingerprint className="h-2.5 w-2.5 text-purple-400" />
                      <span className="font-mono text-purple-300">{fps.length}</span>
                    </span>
                    <span className="text-slate-700">•</span>
                    <span className="inline-flex items-center gap-0.5 shrink-0">
                      <DoorOpen className="h-2.5 w-2.5 text-sky-400" />
                      <span className="font-mono text-sky-300">{user.accessibleRoomIds.length}</span>
                    </span>
                  </div>
                </div>

                {/* Inline actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {user.role === 'superadmin' ? (
                    <button
                      disabled
                      className="p-1.5 text-slate-600 opacity-30 cursor-not-allowed"
                      title="Akun Superadmin tidak dapat dihapus"
                      aria-label="Hapus Pengguna (Disabled)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const userName = user.name;
                        deleteUser(user.id);
                        showToast(`Pengguna "${userName}" berhasil dihapus.`, 'warning');
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors touch-manipulation"
                      title="Hapus Pengguna"
                      aria-label="Hapus Pengguna"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="py-8 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
            <UserCheck className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">Tidak ada pengguna yang sesuai.</p>
          </div>
        )}
      </div>
      {/* Desktop & Tablet Table View */}
      <div className="hidden sm:block rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Role & Hak</th>
                <th className="py-3.5 px-4">Otorisasi Ruangan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* User Profile */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.nipNim}</div>
                        <div className="text-[10px] text-slate-500">{user.department}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      user.role === 'superadmin'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                        : user.role === 'admin'
                        ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                    }`}>
                      {user.roleLabel}
                    </span>
                  </td>

                  {/* Accessible Rooms */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {user.accessibleRoomIds.map((rId) => {
                        const r = rooms.find((room) => room.id === rId);
                        return (
                          <span
                            key={rId}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                          >
                            {r?.code || rId}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    }`}>
                      {user.status === 'ACTIVE' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {user.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit User Button */}
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Edit Data, Sidik Jari & Akses Pengguna"
                      >
                        <Edit3 className="h-3 w-3 text-purple-400" />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      {user.role === 'superadmin' ? (
                        <button
                          disabled
                          className="p-1 text-slate-600 opacity-40 cursor-not-allowed"
                          title="Akun Superadmin tidak dapat dihapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const userName = user.name;
                            deleteUser(user.id);
                            showToast(`Pengguna "${userName}" berhasil dihapus.`, 'warning');
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal using standard Dialog */}
      {isAddUserModalOpen && (
        <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
          <DialogContent onClose={() => setIsAddUserModalOpen(false)}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-400" />
                <DialogTitle>Tambah Pengguna Sistem Baru</DialogTitle>
              </div>
              <DialogDescription>
                Daftarkan pengguna untuk otorisasi akses fisik ruangan laboratorium FT UNTAN.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <DialogBody>
              <div className="space-y-1">
                <Label htmlFor="new-user-name" required>Nama Lengkap & Gelar</Label>
                <Input
                  id="new-user-name"
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Kom."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="new-user-nip" required>NIP / NIM</Label>
                  <Input
                    id="new-user-nip"
                    type="text"
                    placeholder="19800101..."
                    value={newNipNim}
                    onChange={(e) => setNewNipNim(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="new-user-role" required>Role Pengguna</Label>
                  <select
                    id="new-user-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="user">User Biasa (Log Pribadi)</option>
                    <option value="admin">Admin Ruangan (Hanya Ruang Tertentu)</option>
                    <option value="superadmin">Superadmin (Global Access)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-user-dept">Jurusan / Unit Kerja</Label>
                <Input
                  id="new-user-dept"
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                />
              </div>

              {/* Accessible Room Checkboxes */}
              <div className="space-y-1.5 pt-1">
                <Label>Otorisasi Akses Ruangan (Pilih Ruangan yang Diizinkan):</Label>
                <div className="space-y-1.5">
                  {rooms.map((room) => (
                    <label
                      key={room.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        newAccessibleRooms.includes(room.id)
                          ? 'bg-purple-950/30 border-purple-800/50 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newAccessibleRooms.includes(room.id)}
                        onChange={() => toggleRoomSelection(room.id)}
                        className="rounded text-purple-600 focus:ring-0"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-white">{room.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">({room.code})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="purple"
                  size="sm"
                >
                  Simpan Pengguna
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Modal with Category Tabs & Integrated Fingerprint Management */}
      {editModalUser && (
        <Dialog open={!!editModalUser} onOpenChange={(open) => !open && handleCloseEdit()}>
          <DialogContent className="max-w-xl" onClose={handleCloseEdit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-400" />
                <DialogTitle>Edit Pengguna: {editName}</DialogTitle>
              </div>
              <DialogDescription>
                Kelola informasi akun, sidik jari biometrik (AS608), dan hak akses ruangan.
              </DialogDescription>
            </DialogHeader>

            {/* Category Navigation Tabs — sticky under header with layoutId spring indicator */}
            <div className="px-4 pt-2 sm:px-6 shrink-0">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium relative">
                {(['info', 'fingerprint', 'rooms'] as const).map((cat) => {
                  const isSelected = editCategory === cat;
                  const labelMap = {
                    info: { icon: <UserIcon className="h-3.5 w-3.5 shrink-0" />, text: 'Informasi' },
                    fingerprint: { icon: <Fingerprint className="h-3.5 w-3.5 shrink-0" />, text: `Sidik Jari (${getEditUserFps().length}/3)` },
                    rooms: { icon: <DoorOpen className="h-3.5 w-3.5 shrink-0" />, text: `Akses (${editAccessibleRooms.length})` },
                  }[cat];

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={cn(
                        'relative flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10',
                        isSelected ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeEditCategoryTab"
                          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                          className="absolute inset-0 bg-purple-600 rounded-lg shadow-sm z-[-1]"
                        />
                      )}
                      {labelMap.icon}
                      <span>{labelMap.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>


            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <DialogBody>
              {/* ═══ Category 1: Informasi Pengguna ═══ */}
              {editCategory === 'info' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label htmlFor="edit-user-name" required>Nama Lengkap & Gelar</Label>
                    <Input id="edit-user-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-user-nip" required>NIP / NIM</Label>
                      <Input id="edit-user-nip" type="text" value={editNipNim} onChange={(e) => setEditNipNim(e.target.value)} className="font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-user-role" required>Role Pengguna</Label>
                      <select id="edit-user-role" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500">
                        <option value="user">User Biasa (Log Pribadi)</option>
                        <option value="admin">Admin Ruangan (Hanya Ruang Tertentu)</option>
                        <option value="superadmin">Superadmin (Global Access)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-user-dept">Jurusan / Unit Kerja</Label>
                      <Input id="edit-user-dept" type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-user-status">Status Akun</Label>
                      <select id="edit-user-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')} className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500">
                        <option value="ACTIVE">ACTIVE (Aktif)</option>
                        <option value="SUSPENDED">SUSPENDED (Dinonaktifkan)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Category 2: Manajemen Sidik Jari ═══ */}
              {editCategory === 'fingerprint' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><Fingerprint className="h-4 w-4 text-purple-400" />Daftar Sidik Jari ({getEditUserFps().length}/3)</h4>
                      <p className="text-[11px] text-slate-400">Maks. 3 template biometrik per pengguna di sensor AS608.</p>
                    </div>
                    {!fpIsAdding && getEditUserFps().length < 3 && currentUser?.role === 'superadmin' && (
                      <Button type="button" variant="purple" size="sm" onClick={handleFpStartAddFlow} leftIcon={<Plus className="h-3.5 w-3.5" />}>Tambah</Button>
                    )}
                  </div>
                  {!fpIsAdding ? (
                    <div className="space-y-2">
                      {getEditUserFps().length === 0 ? (
                        <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <Fingerprint className="h-8 w-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">Belum ada sidik jari terdaftar.</p>
                          {currentUser?.role === 'superadmin' && (
                            <Button type="button" variant="purple" size="sm" onClick={handleFpStartAddFlow} leftIcon={<Plus className="h-3.5 w-3.5" />} className="mt-1">Daftarkan Pertama</Button>
                          )}
                        </div>
                      ) : (
                        getEditUserFps().map((fp, idx) => (
                          <div key={fp.templateId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-purple-800/50 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">#{fp.templateId}</div>
                              <div className="min-w-0">
                                {fpEditingTemplateId === fp.templateId ? (
                                  <div className="flex items-center gap-1.5">
                                    <Input type="text" value={fpEditingLabelValue} onChange={(e) => setFpEditingLabelValue(e.target.value)} className="h-7 text-xs py-0 px-2 w-36" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFpSaveLabelEdit(fp.templateId); } else if (e.key === 'Escape') setFpEditingTemplateId(null); }} />
                                    <button type="button" onClick={() => handleFpSaveLabelEdit(fp.templateId)} className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="h-3.5 w-3.5" /></button>
                                    <button type="button" onClick={() => setFpEditingTemplateId(null)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white truncate">{fp.label}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">Slot {idx + 1}</span>
                                    {currentUser?.role === 'superadmin' && (
                                      <button type="button" onClick={() => { setFpEditingTemplateId(fp.templateId); setFpEditingLabelValue(fp.label); }} className="text-slate-500 hover:text-purple-400 p-0.5"><Edit3 className="h-3 w-3" /></button>
                                    )}
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-500">Terdaftar: {new Date(fp.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                            {currentUser?.role === 'superadmin' && (
                              <button type="button" onClick={() => handleFpRemove(fp.templateId)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                  ) : (
                    <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-4">
                      <div className="flex items-center justify-between text-xs border-b border-purple-900/30 pb-3">
                        <span className="font-semibold text-purple-300">Pendaftaran Sidik Jari Baru</span>
                        <span className="font-mono text-[11px] text-purple-400">Langkah {fpEnrollStep}/4</span>
                      </div>
                      {fpEnrollStep === 1 && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="fp-label-input">Label / Nama Jari:</Label>
                            <Input id="fp-label-input" type="text" placeholder="Misal: Jempol Kanan" value={fpNewLabel} onChange={(e) => setFpNewLabel(e.target.value)} />
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                            <h5 className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-purple-400 animate-pulse" />Instruksi Sensor AS608</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">Sistem mengirim sinyal enrollment via MQTT. Pengguna menempelkan jari 2x.</p>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button type="button" variant="secondary" size="sm" onClick={handleFpCancelAddFlow}>Batal</Button>
                            <Button type="button" variant="purple" size="sm" onClick={handleFpStartEnrollment} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Mulai Perekaman</Button>
                          </div>
                        </div>
                      )}
                      {fpEnrollStep > 1 && (
                        <div className="py-2 text-center space-y-3">
                          <BiometricScanner
                            status={
                              fpEnrollStep === 2
                                ? 'scanning'
                                : fpEnrollStep === 3
                                ? 'scanning'
                                : 'success'
                            }
                            size="md"
                            label={
                              fpEnrollStep === 2
                                ? 'Tempelkan Jari Pertama Kali'
                                : fpEnrollStep === 3
                                ? 'Angkat & Tempelkan Sekali Lagi'
                                : 'Sidik Jari Berhasil Terdaftar!'
                            }
                            sublabel={
                              fpEnrollStep === 2
                                ? `Minta ${editName} menempelkan jari pada sensor AS608...`
                                : fpEnrollStep === 3
                                ? 'Sensor memverifikasi pola biometrik...'
                                : `Label "${fpNewLabel || getNextSuggestedLabel()}" (Template #${fpAssignedTemplateId})`
                            }
                          />
                          {fpEnrollStep === 4 && (
                            <Button type="button" variant="success" size="sm" className="w-full mt-2" onClick={handleFpCancelAddFlow}>Selesai & Kembali</Button>
                          )}
                        </div>
                      )}
                    </div>

                  )}
                </div>
              )}

              {/* ═══ Category 3: Otorisasi Akses Ruangan ═══ */}
              {editCategory === 'rooms' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-purple-400" />Hak Akses Ruangan</h4>
                    <p className="text-[11px] text-slate-400">Tentukan ruangan mana saja yang diizinkan untuk diakses pengguna ini.</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    {rooms.map((room) => (
                      <label key={room.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editAccessibleRooms.includes(room.id) ? 'bg-purple-950/30 border-purple-800/50 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                        <input type="checkbox" checked={editAccessibleRooms.includes(room.id)} onChange={() => toggleEditRoomSelection(room.id)} className="rounded text-purple-600 focus:ring-0 h-4 w-4" />
                        <div className="text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{room.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">{room.code}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{room.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              </DialogBody>

              <DialogFooter className="pt-2 border-t border-slate-800">
                <Button type="button" variant="secondary" size="sm" onClick={handleCloseEdit}>Batal</Button>
                <Button type="submit" variant="purple" size="sm">Simpan Perubahan</Button>
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


