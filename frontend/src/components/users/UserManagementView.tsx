import React, { useState, useMemo, useCallback } from "react";
import { useApp } from "@/context";
import { User, UserRole, ApprovalPayload, getUserAccessValidity } from "../../types";
import {
  UserPlus,
  Clock,
  CheckCheck,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastNotification, ToastItem, ToastVariant } from "@/components/animations/toast-notification";

import { UserStatsOverview } from "./UserStatsOverview";
import { UserSubSectionNav, UserSubSection } from "./UserSubSectionNav";
import { UserDirectorySection } from "./UserDirectorySection";
import { UserRequestsSection } from "./UserRequestsSection";
import { UserBiometricsSection } from "./UserBiometricsSection";
import { UserLifecycleSection } from "./UserLifecycleSection";

import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserConfirmDialog } from "./DeleteUserConfirmDialog";
import { ApproveRegistrationModal } from "./ApproveRegistrationModal";
import { RejectRegistrationModal } from "./RejectRegistrationModal";
import { BatchApprovalModal } from "./BatchApprovalModal";
import { BatchRejectModal } from "./BatchRejectModal";

export const UserManagementView: React.FC = () => {
  const {
    users,
    rooms,
    addUser,
    updateUser,
    deleteUser,
    removeFingerprint,
    enrollFingerprint,
    updateFingerprintLabel,
    approveUserRegistration,
    rejectUserRegistration,
    extendUserAccess,
    currentUser,
  } = useApp();

  // Active Sub-Section Tab (Default to Directory)
  const [activeSection, setActiveSection] = useState<UserSubSection>("directory");

  // Multi-select batch state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBatchApprovalOpen, setIsBatchApprovalOpen] = useState(false);
  const [isBatchRejectOpen, setIsBatchRejectOpen] = useState(false);

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [editModalInitialTab, setEditModalInitialTab] = useState<"info" | "fingerprint" | "rooms">("info");
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Approval & Rejection Modal State (Single User)
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "success",
      action?: { label: string; onClick: () => void },
      duration: number = 3800
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      setToasts((prev) => [...prev, { id, message, variant, duration, action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismissToast = useCallback((id: string | number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute Sub-Section Counts
  const sectionCounts = useMemo(() => {
    const activeVerified = users.filter(
      (u) => u.status !== "PENDING_APPROVAL" && u.status !== "REJECTED"
    ).length;
    const pendingReqs = users.filter((u) => u.status === "PENDING_APPROVAL").length;

    const totalFp = users.reduce((acc, u) => {
      const slots = u.fingerprints
        ? u.fingerprints.length
        : u.fingerprintTemplateIds?.length || (u.fingerprintTemplateId ? 1 : 0);
      return acc + slots;
    }, 0);

    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const lifecycleAlertCount = users.filter((u) => {
      if (u.status === "PENDING_APPROVAL" || u.status === "REJECTED") return false;
      const validity = getUserAccessValidity(u);
      if (validity.isExpired || u.status === "EXPIRED") return true;
      if (u.validUntil) {
        const diff = new Date(u.validUntil).getTime() - now;
        if (diff > 0 && diff <= sevenDaysMs) return true;
      }
      return false;
    }).length;

    return {
      directory: activeVerified,
      requests: pendingReqs,
      biometrics: totalFp,
      lifecycle: lifecycleAlertCount,
    };
  }, [users]);

  // Selected User objects for batch processing
  const selectedUsers = useMemo(() => {
    return users.filter((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  // Batch toggle handlers
  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllPending = (pendingIds: string[]) => {
    const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  // Add user submit handler
  const handleAddUserSubmit = (userData: {
    name: string;
    email: string;
    role: UserRole;
    accessibleRooms: string[];
  }) => {
    const newUser = addUser({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      accessibleRoomIds: userData.accessibleRooms,
      status: "ACTIVE",
      fingerprints: [],
      fingerprintTemplateIds: [],
    });

    showToast(
      `Pengguna "${userData.name}" berhasil didaftarkan.`,
      "success",
      {
        label: "Daftarkan Sidik Jari",
        onClick: () => {
          setEditModalInitialTab("fingerprint");
          setEditModalUser(newUser);
        },
      },
      7000
    );
  };

  // Delete user handler
  const handleDeleteConfirm = (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
      showToast("Anda tidak dapat menghapus akun Anda sendiri.", "error");
      return;
    }
    deleteUser(userToDelete.id);
    setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
    showToast(`Pengguna "${userToDelete.name}" telah dihapus.`, "warning");
  };

  // Single user approve / extend handler
  const handleApproveSubmit = async (userId: string, payload: ApprovalPayload) => {
    const target = users.find((u) => u.id === userId);
    if (target?.status === "EXPIRED" || target?.status === "ACTIVE") {
      return extendUserAccess(userId, payload);
    }
    return approveUserRegistration(userId, payload);
  };

  // Batch approve async handler
  const handleBatchApprove = async (
    userIds: string[],
    payload: ApprovalPayload
  ): Promise<{ successCount: number; failCount: number }> => {
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        const res = await approveUserRegistration(userId, payload);
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSelectedUserIds([]);
    return { successCount, failCount };
  };

  // Batch reject async handler
  const handleBatchReject = async (
    userIds: string[],
    reason: string
  ): Promise<{ successCount: number; failCount: number }> => {
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        const res = await rejectUserRegistration(userId, reason);
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSelectedUserIds([]);
    return { successCount, failCount };
  };

  const handleEditUser = (user: User, initialTab: "info" | "fingerprint" | "rooms") => {
    setEditModalInitialTab(initialTab);
    setEditModalUser(user);
  };

  return (
    <div className="space-y-4 pb-20 font-sans text-[#1a1a1a]">
      {/* ── Top Header & Primary Action ── */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#e5e3df]">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#1a1a1a]">
            Manajemen Pengguna
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-[#787671] mt-0.5 truncate">
            Direktori sivitas FT UNTAN, otorisasi template DY50 &amp; antrean persetujuan akses
          </p>
        </div>

        {currentUser?.role === "superadmin" && (
          <Button
            onClick={() => setIsAddUserModalOpen(true)}
            variant="default"
            size="sm"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            className="cursor-pointer shrink-0 h-8 sm:h-9 px-3 sm:px-3.5 font-medium rounded-md text-xs sm:text-sm bg-[#5645d4] hover:bg-[#4534b3] text-white shadow-xs transition-all"
          >
            Tambah Manual
          </Button>
        )}
      </div>

      {/* ── Telemetry & Metrics Summary Bar ── */}
      <UserStatsOverview users={users} rooms={rooms} />

      {/* ── Pending Approval Alert Banner (When on another section) ── */}
      {sectionCounts.requests > 0 && activeSection !== "requests" && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#fafaf9] border border-[#e5e3df] flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#fdf3eb] border border-[#dd5b00]/20 text-[#dd5b00] flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 shrink-0 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs sm:text-sm text-[#1a1a1a] truncate">
                {sectionCounts.requests} Permohonan Pendaftaran Menunggu Persetujuan
              </div>
              <div className="text-[11px] sm:text-xs text-[#787671] truncate mt-0.5">
                Tinjau identitas sivitas akademika dan tentukan otorisasi durasi akses laboratorium.
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveSection("requests")}
            className="text-xs sm:text-sm shrink-0 h-8 px-3 sm:px-3.5 bg-white text-[#5645d4] border-[#e5e3df] hover:bg-[#fafaf9] hover:border-[#c8c4be] font-medium rounded-md shadow-xs cursor-pointer transition-all"
          >
            Tinjau Antrean
          </Button>
        </div>
      )}

      {/* ── Modular Sub-Section Navigation Tabs ── */}
      <UserSubSectionNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        counts={sectionCounts}
      />

      {/* ── Sub-Section Content Areas ── */}
      {activeSection === "directory" && (
        <UserDirectorySection
          users={users}
          rooms={rooms}
          currentUser={currentUser}
          onEditUser={handleEditUser}
          onDeleteUser={setDeleteConfirmUser}
        />
      )}

      {activeSection === "requests" && (
        <UserRequestsSection
          users={users}
          rooms={rooms}
          selectedUserIds={selectedUserIds}
          onToggleSelectUser={handleToggleSelectUser}
          onSelectAllPending={handleSelectAllPending}
          onApproveUser={(user) => setApprovingUser(user)}
          onRejectUser={(user) => setRejectingUser(user)}
          onOpenBatchApproval={() => setIsBatchApprovalOpen(true)}
          onOpenBatchReject={() => setIsBatchRejectOpen(true)}
        />
      )}

      {activeSection === "biometrics" && (
        <UserBiometricsSection
          users={users}
          rooms={rooms}
          onEnrollUser={(user) => handleEditUser(user, "fingerprint")}
        />
      )}

      {activeSection === "lifecycle" && (
        <UserLifecycleSection
          users={users}
          rooms={rooms}
          onExtendAccess={(user) => setApprovingUser(user)}
        />
      )}

      {/* ── FLOATING BULK ACTION TOOLBAR (When Users Selected) ── */}
      {selectedUserIds.length > 0 && activeSection === "requests" && (
        <div
          role="toolbar"
          aria-label="Aksi Massal Pengguna"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-white/95 backdrop-blur-md border border-[#e5e3df] shadow-xl text-[#1a1a1a] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 font-sans"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#f7f0fd] border border-[#ecd5fb] flex items-center justify-center text-[#5645d4] font-mono text-xs font-bold shadow-2xs shrink-0">
              {selectedUserIds.length}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1a1a1a] truncate leading-tight">
                {selectedUserIds.length} Permohonan Dipilih
              </div>
              <div className="text-[11px] text-[#787671] truncate hidden xs:block leading-tight">
                Aksi serentak pendaftaran sivitas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBatchRejectOpen(true)}
              className="h-8 px-3 text-xs bg-white text-[#e03131] border-[#e5e3df] hover:bg-[#fdf2f2] hover:border-[#fdf2f2] hover:text-[#c92a2a] cursor-pointer font-semibold rounded-lg transition-colors shadow-2xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsBatchApprovalOpen(true)}
              className="h-8 px-3.5 text-xs bg-[#5645d4] hover:bg-[#4534b3] text-white cursor-pointer font-semibold shadow-xs rounded-lg transition-all"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Setujui Massal
            </Button>

            <button
              type="button"
              onClick={handleClearSelection}
              aria-label="Batalkan pilihan"
              title="Batalkan pilihan"
              className="p-1.5 text-[#787671] hover:text-[#1a1a1a] hover:bg-[#f6f5f4] rounded-lg transition-colors cursor-pointer ml-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add User Modal (Manual Entry) ── */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        rooms={rooms}
        onSubmit={handleAddUserSubmit}
      />

      {/* ── Edit User Modal ── */}
      <EditUserModal
        user={editModalUser ? users.find((u) => u.id === editModalUser.id) || editModalUser : null}
        isOpen={Boolean(editModalUser)}
        initialTab={editModalInitialTab}
        onClose={() => {
          setEditModalUser(null);
          setEditModalInitialTab("info");
        }}
        rooms={rooms}
        currentUser={currentUser}
        onUpdateUser={updateUser}
        onEnrollFingerprint={enrollFingerprint}
        onUpdateFingerprintLabel={updateFingerprintLabel}
        onRemoveFingerprint={removeFingerprint}
        onShowToast={showToast}
      />

      {/* ── Single User: Approve Registration & Set Duration Modal ── */}
      <ApproveRegistrationModal
        user={approvingUser}
        isOpen={Boolean(approvingUser)}
        onClose={() => setApprovingUser(null)}
        rooms={rooms}
        onApprove={handleApproveSubmit}
        onShowToast={showToast}
      />

      {/* ── Single User: Reject Registration Modal ── */}
      <RejectRegistrationModal
        user={rejectingUser}
        isOpen={Boolean(rejectingUser)}
        onClose={() => setRejectingUser(null)}
        onReject={rejectUserRegistration}
        onShowToast={showToast}
      />

      {/* ── Batch Approval Modal ── */}
      <BatchApprovalModal
        selectedUsers={selectedUsers}
        isOpen={isBatchApprovalOpen}
        onClose={() => setIsBatchApprovalOpen(false)}
        rooms={rooms}
        onBatchApprove={handleBatchApprove}
        onShowToast={showToast}
      />

      {/* ── Batch Reject Modal ── */}
      <BatchRejectModal
        selectedUsers={selectedUsers}
        isOpen={isBatchRejectOpen}
        onClose={() => setIsBatchRejectOpen(false)}
        onBatchReject={handleBatchReject}
        onShowToast={showToast}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteUserConfirmDialog
        user={deleteConfirmUser}
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Toast Notifications ── */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
