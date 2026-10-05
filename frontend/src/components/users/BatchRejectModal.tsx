import React, { useState, useId, useEffect } from "react";
import { User } from "../../types";
import {
  XCircle,
  Users,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface BatchRejectModalProps {
  selectedUsers: User[];
  isOpen: boolean;
  onClose: () => void;
  onBatchReject: (userIds: string[], reason: string) => Promise<{ successCount: number; failCount: number }>;
  onShowToast: (message: string, variant: "success" | "warning" | "error") => void;
}

const BATCH_REJECTION_TEMPLATES = [
  "Identitas dan kredensial akun pengguna tidak terverifikasi.",
  "Permohonan akses ruangan tidak sesuai dengan peruntukan operasional.",
  "Data pendaftaran tidak lengkap atau tidak valid.",
  "Kuota kapasitas pengguna aktif ruangan telah mencapai batas maksimum.",
  "Permohonan akses belum mendapatkan persetujuan penanggung jawab.",
];

export const BatchRejectModal: React.FC<BatchRejectModalProps> = ({
  selectedUsers = [],
  isOpen,
  onClose,
  onBatchReject,
  onShowToast,
}) => {
  const reasonId = useId();
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showUserList, setShowUserList] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setShowUserList(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    if (!reason.trim()) {
      onShowToast("Mohon cantumkan alasan penolakan permohonan pendaftaran massal.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      const result = await onBatchReject(userIds, reason.trim());

      if (result.successCount > 0) {
        onShowToast(
          `Berhasil menolak ${result.successCount} permohonan (${result.failCount} gagal).`,
          "warning"
        );
        onClose();
      } else {
        onShowToast("Gagal memproses penolakan massal.", "error");
      }
    } catch {
      onShowToast("Terjadi kesalahan saat memproses penolakan massal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || selectedUsers.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="md"
        className="max-w-lg w-[calc(100vw-1rem)] sm:w-full p-0 flex flex-col max-h-[90vh] bg-white border border-[#e5e3df] shadow-2xl rounded-xl font-sans overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-reject-title"
        aria-describedby="batch-reject-desc"
      >
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#fafaf9]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#fdf2f2] border border-[#fdf2f2] flex items-center justify-center text-[#e03131] shrink-0">
              <XCircle className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle id="batch-reject-title" className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                  Tolak Permohonan Massal
                </DialogTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#fdf2f2] text-[#e03131] border border-[#fdf2f2] shrink-0">
                  {selectedUsers.length} Pengguna
                </span>
              </div>
              <DialogDescription id="batch-reject-desc" className="text-xs text-[#5d5b54] truncate mt-0.5">
                Berikan penjelasan penolakan yang transparan untuk seluruh pemohon terpilih.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white">
            {/* Warning banner */}
            <div className="p-3 rounded-lg bg-[#fafaf9] border border-[#e5e3df] flex items-start gap-2.5 text-xs text-[#5d5b54]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#dd5b00] mt-0.5" />
              <div className="leading-relaxed">
                Tindakan ini akan menolak <strong className="font-semibold text-[#1a1a1a]">{selectedUsers.length}</strong> permohonan pendaftaran. Notifikasi penolakan beserta alasan di bawah akan dikirimkan kepada masing-masing pemohon.
              </div>
            </div>

            {/* Selected Applicants Preview Accordion */}
            <div className="rounded-lg border border-[#e5e3df] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowUserList(!showUserList)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#fafaf9] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1a1a1a]">
                  <Users className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Daftar {selectedUsers.length} Pemohon Ditolak</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#5d5b54]">
                  <span>{showUserList ? "Sembunyikan" : "Tampilkan Rincian"}</span>
                  {showUserList ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </div>
              </button>

              {showUserList ? (
                <div className="px-3.5 pb-3 pt-1 border-t border-[#ede9e4] max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin bg-[#fafaf9]">
                  {selectedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 rounded-md bg-white border border-[#e5e3df] flex items-center justify-between text-xs shadow-2xs"
                    >
                      <span className="font-semibold text-[#1a1a1a] truncate">{u.name}</span>
                      <span className="text-[11px] text-[#5d5b54] font-mono shrink-0">
                        {u.email}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-2 border-t border-[#ede9e4] flex flex-wrap gap-1.5 text-[11px] text-[#5d5b54] bg-[#fafaf9]/50">
                  {selectedUsers.slice(0, 3).map((u) => (
                    <span
                      key={u.id}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#e5e3df] truncate max-w-[130px] font-medium text-[#1a1a1a]"
                    >
                      {u.name}
                    </span>
                  ))}
                  {selectedUsers.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#fdf2f2] text-[#e03131] border border-[#fdf2f2] font-semibold text-[11px]">
                      +{selectedUsers.length - 3} lainnya
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Template Alasan Penolakan</span>
                </Label>
                <span className="text-[11px] text-[#5d5b54]">Klik untuk memilih</span>
              </div>
              <div className="space-y-1.5">
                {BATCH_REJECTION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(tmpl)}
                    className="w-full text-left p-2 rounded-lg border border-[#e5e3df] bg-white hover:bg-[#fafaf9] hover:border-[#c8c4be] text-xs text-[#5d5b54] hover:text-[#1a1a1a] transition-colors line-clamp-1 cursor-pointer"
                  >
                    &bull; {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div className="space-y-1.5">
              <Label htmlFor={reasonId} className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Alasan Penolakan Resmi <span className="text-[#e03131]">*</span>
              </Label>
              <textarea
                id={reasonId}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan secara jelas dan objektif..."
                className="w-full p-2.5 text-xs rounded-lg border border-[#e5e3df] bg-white focus:outline-none focus:ring-2 focus:ring-[#5645d4]/15 focus:border-[#5645d4] text-[#1a1a1a] placeholder:text-[#a4a097] resize-none"
                required
              />
            </div>
          </DialogBody>

          {/* Footer */}
          <DialogFooter className="p-3.5 sm:p-4 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between">
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
              disabled={isSubmitting || !reason.trim() || selectedUsers.length === 0}
              className="bg-[#e03131] hover:bg-[#c92a2a] text-white text-xs gap-1.5 font-semibold shadow-xs h-8 px-3.5 rounded-md cursor-pointer transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>
                {isSubmitting ? "Memproses..." : `Tolak ${selectedUsers.length} Permohonan`}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
