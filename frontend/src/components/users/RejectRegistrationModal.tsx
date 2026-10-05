import React, { useState, useId, useEffect } from "react";
import { User } from "../../types";
import {
  XCircle,
  Sparkles,
  Mail,
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

interface RejectRegistrationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onReject: (userId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  onShowToast: (message: string, variant: "success" | "warning" | "error") => void;
}

const REJECTION_TEMPLATES = [
  "Identitas dan kredensial akun pengguna tidak terverifikasi.",
  "Permohonan akses ruangan tidak sesuai dengan peruntukan operasional.",
  "Data pendaftaran tidak lengkap atau tidak valid.",
  "Kuota kapasitas pengguna aktif ruangan telah mencapai batas maksimum.",
  "Permohonan akses belum mendapatkan persetujuan penanggung jawab.",
];

export const RejectRegistrationModal: React.FC<RejectRegistrationModalProps> = ({
  user,
  isOpen,
  onClose,
  onReject,
  onShowToast,
}) => {
  const reasonId = useId();
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!reason.trim()) {
      onShowToast("Mohon cantumkan alasan penolakan permohonan pendaftaran.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onReject(user.id, reason.trim());
      if (result.success) {
        onShowToast(result.message, "warning");
        onClose();
      } else {
        onShowToast(result.message, "error");
      }
    } catch {
      onShowToast("Gagal memproses penolakan pendaftaran.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="md"
        className="max-w-lg w-[calc(100vw-1rem)] sm:w-full p-0 flex flex-col max-h-[90vh] bg-white border border-[#e5e3df] shadow-2xl rounded-xl font-sans overflow-hidden"
      >
        <DialogHeader className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#fafaf9]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#fdf2f2] border border-[#fdf2f2] flex items-center justify-center text-[#e03131] shrink-0">
              <XCircle className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1a1a1a] truncate">
                Tolak Permohonan Akses
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5d5b54] truncate mt-0.5">
                Berikan penjelasan penolakan yang transparan untuk pemohon.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-white">
            {/* Applicant Summary Card */}
            <div className="p-3.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-[#1a1a1a] truncate">{user.name}</div>
                  <div className="text-[11px] text-[#5d5b54] flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="h-3 w-3 text-[#787671] shrink-0" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#5d5b54] border border-[#e5e3df] uppercase tracking-wider shrink-0">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Quick Template Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#5645d4]" />
                  <span>Template Alasan Penolakan</span>
                </Label>
                <span className="text-[11px] text-[#5d5b54]">Klik untuk memilih</span>
              </div>
              <div className="space-y-1.5">
                {REJECTION_TEMPLATES.map((tmpl, idx) => (
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

            {/* Detailed Reason Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor={reasonId} className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Alasan Penolakan Resmi <span className="text-[#e03131]">*</span>
              </Label>
              <textarea
                id={reasonId}
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tuliskan alasan mengapa permohonan akses ini ditolak secara jelas dan objektif..."
                className="w-full p-2.5 text-xs rounded-lg border border-[#e5e3df] bg-white focus:outline-none focus:ring-2 focus:ring-[#5645d4]/15 focus:border-[#5645d4] text-[#1a1a1a] placeholder:text-[#a4a097] resize-none"
              />
              <p className="text-[11px] text-[#5d5b54]">
                Alasan penolakan permohonan pendaftaran akun pengguna ke sistem.
              </p>
            </div>
          </DialogBody>

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
              disabled={isSubmitting || !reason.trim()}
              className="bg-[#e03131] hover:bg-[#c92a2a] text-white text-xs gap-1.5 font-semibold shadow-xs h-8 px-3.5 rounded-md cursor-pointer transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Memproses..." : "Tolak Permohonan"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
