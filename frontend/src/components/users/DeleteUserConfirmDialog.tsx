import React from "react";
import { User } from "../../types";
import {
  AlertTriangle,
  Trash2,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";

interface DeleteUserConfirmDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (user: User) => void;
}

export const DeleteUserConfirmDialog: React.FC<DeleteUserConfirmDialogProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  const fpCount = user.fingerprints
    ? user.fingerprints.length
    : (user.fingerprintTemplateIds?.length || (user.fingerprintTemplateId ? 1 : 0));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-user-dialog-title"
        aria-describedby="delete-user-dialog-desc"
        size="md"
        onClose={onClose}
        className="w-full max-w-sm sm:max-w-[420px] bg-white border border-[#e5e3df] text-[#1a1a1a] shadow-[0_4px_12px_rgba(15,15,15,0.08)]"
      >
        <DialogHeader className="border-b border-[#e5e3df] bg-white pr-12 sm:pr-14">
          <DialogTitle id="delete-user-dialog-title" className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-[-0.25px] text-[#1a1a1a]">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e03131]/20 bg-[#fdf2f2] text-[#e03131] shrink-0">
              <AlertTriangle className="h-4 w-4 shrink-0" />
            </span>
            <span className="truncate">Konfirmasi Hapus Pengguna</span>
          </DialogTitle>
          <DialogDescription id="delete-user-dialog-desc" className="pl-[42px] text-xs text-[#5d5b54]">
            Tindakan ini akan mencabut seluruh hak akses solenoid dan membebaskan slot biometrik DY50.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3.5 py-3.5">
          {/* User Preview Card */}
          <div className="p-3.5 rounded-md bg-[#f6f5f4] border border-[#e5e3df] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1a1a1a] truncate min-w-0 flex-1">{user.name}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#e5e3df] text-[#37352f] shrink-0">
                {user.role}
              </span>
            </div>
            <div className="text-[11px] text-[#5d5b54] font-mono flex items-center justify-between gap-2">
              <span className="truncate min-w-0 flex-1">{user.email}</span>
              <span className="text-[#1a1a1a] uppercase font-mono font-semibold shrink-0">{user.status}</span>
            </div>
          </div>

          {/* Biometric Warning Banner */}
          {fpCount > 0 && (
            <div className="p-3 rounded-md bg-[#fafaf9] border border-[#e5e3df] text-xs flex items-start gap-2.5">
              <Fingerprint className="h-4 w-4 text-[#dd5b00] shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px] min-w-0 flex-1 text-[#5d5b54]">
                <strong className="font-semibold text-[#1a1a1a]">{fpCount} Template Sidik Jari DY50</strong> yang tersimpan pada flash sensor fisik akan di-invalidasi dan slot memori akan dibebaskan.
              </div>
            </div>
          )}

          <p className="text-xs text-[#5d5b54] leading-relaxed">
            Apakah Anda yakin ingin menghapus akun <span className="font-semibold text-[#1a1a1a]">{user.name}</span> secara permanen dari direktori sistem?
          </p>
        </DialogBody>

        <DialogFooter className="pt-3 border-t border-[#e5e3df] bg-[#fafaf9]">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer rounded-md font-medium"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4 shrink-0" />}
              onClick={() => {
                onConfirm(user);
                onClose();
              }}
              className="min-h-[40px] sm:min-h-[36px] px-4 shadow-xs cursor-pointer font-medium rounded-md"
            >
              Hapus Pengguna
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
