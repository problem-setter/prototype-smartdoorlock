import React, { useState } from 'react';
import { useApp } from '@/context';
import { User, Room, FingerprintSlot } from '../../types';
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { BiometricScanner } from '@/components/animations/biometric-scanner';




interface FingerprintEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  targetRoom: Room;
}

export const FingerprintEnrollModal: React.FC<FingerprintEnrollModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  targetRoom,
}) => {
  const { enrollFingerprint, updateFingerprintLabel, removeFingerprint, currentUser } = useApp();
  
  const [isAdding, setIsAdding] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [assignedTemplateId, setAssignedTemplateId] = useState<number | null>(null);
  const [newLabelInput, setNewLabelInput] = useState('');

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');

  if (!isOpen || !targetUser) return null;

  const existingFps: FingerprintSlot[] = targetUser.fingerprints || (
    targetUser.fingerprintTemplateIds
      ? targetUser.fingerprintTemplateIds.map((id, idx) => ({
          templateId: id,
          label: idx === 0 ? 'Jempol Kanan' : idx === 1 ? 'Telunjuk Kanan' : 'Jempol Kiri',
          registeredAt: targetUser.createdAt || new Date().toISOString()
        }))
      : targetUser.fingerprintTemplateId
        ? [{ templateId: targetUser.fingerprintTemplateId, label: 'Jempol Kanan', registeredAt: targetUser.createdAt || new Date().toISOString() }]
        : []
  );

  const canAddMore = existingFps.length < 3;
  const isSuperadmin = currentUser?.role === 'superadmin';

  const defaultSuggestedLabels = [
    'Jempol Kanan',
    'Telunjuk Kanan',
    'Jempol Kiri',
    'Telunjuk Kiri',
    'Jari Tengah Kanan'
  ];

  const nextSuggestedLabel = defaultSuggestedLabels.find(
    (l) => !existingFps.some((f) => f.label.toLowerCase() === l.toLowerCase())
  ) || `Sidik Jari #${existingFps.length + 1}`;

  const handleStartEnrollment = async () => {
    setCurrentStep(2);

    setTimeout(() => {
      setCurrentStep(3);

      setTimeout(async () => {
        const labelToSave = newLabelInput.trim() !== '' ? newLabelInput.trim() : nextSuggestedLabel;
        const result = await enrollFingerprint(targetUser.id, targetRoom.id, labelToSave);
        if (result.success) {
          setAssignedTemplateId(result.templateId);
          setCurrentStep(4);
          import('canvas-confetti').then((m) => {
            m.default({
              particleCount: 50,
              spread: 50,
              origin: { y: 0.6 },
            });
          });
        }
      }, 2000);
    }, 2000);
  };

  const handleStartAddFlow = () => {
    setIsAdding(true);
    setNewLabelInput(nextSuggestedLabel);
    setCurrentStep(1);
  };

  const handleCancelAddFlow = () => {
    setIsAdding(false);
    setCurrentStep(1);
    setAssignedTemplateId(null);
    setNewLabelInput('');
  };

  const handleResetAndClose = () => {
    setIsAdding(false);
    setCurrentStep(1);
    setAssignedTemplateId(null);
    setEditingTemplateId(null);
    setNewLabelInput('');
    onClose();
  };

  const handleSaveLabelEdit = (templateId: number) => {
    if (editingLabelValue.trim() !== '') {
      updateFingerprintLabel(targetUser.id, templateId, editingLabelValue.trim());
    }
    setEditingTemplateId(null);
    setEditingLabelValue('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleResetAndClose(); }}>
      <DialogContent className="max-w-md w-full bg-[#0c1220]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl" onClose={handleResetAndClose}>
        
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.2)] shrink-0">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Kelola Sidik Jari (Biometrik)</DialogTitle>
              <DialogDescription>Superadmin Portal &bull; Sensor AS608 {targetRoom.name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* User Info Capsule */}
        <div className="p-3 rounded-xl bg-slate-950/90 border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar size="sm" className="border-white/10">
              <AvatarImage src={targetUser.avatarUrl} alt={targetUser.name} />
              <AvatarFallback>{targetUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{targetUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{targetUser.nipNim} &bull; {targetUser.department}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-purple-300 border border-purple-800/40">
              {targetUser.role.toUpperCase()}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
              existingFps.length >= 3
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
            }`}>
              {existingFps.length}/3 Slot Terisi
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        {!isAdding ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                Daftar Biometrik Terdaftar ({existingFps.length}/3)
              </span>
              {isSuperadmin && canAddMore && (
                <Button variant="purple" size="sm" onClick={handleStartAddFlow} className="h-7 text-xs px-2.5 gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah FP</span>
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {existingFps.length === 0 ? (
                <div className="p-5 text-center rounded-xl bg-slate-950/60 border border-dashed border-white/10 space-y-2">
                  <Fingerprint className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Belum ada sidik jari terdaftar.</p>
                  {isSuperadmin && (
                    <Button variant="purple" size="sm" onClick={handleStartAddFlow} className="mt-1 cursor-pointer">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Sidik Jari Pertama
                    </Button>
                  )}
                </div>
              ) : (
                existingFps.map((fp, index) => (
                  <div key={fp.templateId} className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-mono text-xs font-bold shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        #{fp.templateId}
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingTemplateId === fp.templateId ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              className="h-7 text-xs py-1 px-2 bg-slate-900 border-purple-500"
                              placeholder="Nama jari"
                              autoFocus
                            />
                            <button onClick={() => handleSaveLabelEdit(fp.templateId)} className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-pointer" title="Simpan">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingTemplateId(null)} className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-700 cursor-pointer" title="Batal">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">{fp.label}</span>
                              <span className="text-[10px] font-mono px-1.5 rounded bg-slate-900 text-slate-400 border border-white/5">
                                Slot {index + 1}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">AS608-#{fp.templateId}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {isSuperadmin && editingTemplateId !== fp.templateId && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditingTemplateId(fp.templateId); setEditingLabelValue(fp.label); }} className="p-1.5 text-slate-400 hover:text-purple-300 cursor-pointer" title="Edit Label">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeFingerprint(targetUser.id, fp.templateId)} className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer" title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {existingFps.length >= 3 && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 flex items-start gap-2">
                <span className="font-bold shrink-0">&bull;</span>
                <span>Batas maksimal 3 sidik jari per user telah tercapai. Hapus salah satu sidik jari jika ingin mendaftarkan baru.</span>
              </div>
            )}
          </div>
        ) : (

          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Tahap {currentStep} dari 4</span>
                <span className="font-mono text-purple-300 font-semibold">Slot {existingFps.length + 1} / 3</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/10">
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-purple-500 w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-purple-500 w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-purple-500 w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-emerald-500 w-1/4' : ''}`}></div>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] shadow-inner">
                <label className="text-xs font-semibold text-slate-200 block">Label / Posisi Jari:</label>
                <Input
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  placeholder="Misal: Jempol Kanan..."
                  className="text-xs bg-slate-900/90"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {defaultSuggestedLabels.map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewLabelInput(lbl)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        newLabelInput === lbl
                          ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)] font-semibold'
                          : 'bg-slate-900/90 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] text-center space-y-3 shadow-inner">
              <BiometricScanner
                status={
                  currentStep === 1
                    ? 'idle'
                    : currentStep === 2
                    ? 'scanning'
                    : currentStep === 3
                    ? 'scanning'
                    : 'success'
                }
                size="md"
                label={
                  currentStep === 1
                    ? `Siap Mendaftarkan Sidik Jari #${existingFps.length + 1}`
                    : currentStep === 2
                    ? 'Tempelkan Jari ke Sensor AS608'
                    : currentStep === 3
                    ? 'Angkat & Tempelkan Sekali Lagi'
                    : 'Pendaftaran Biometrik Berhasil'
                }
                sublabel={
                  currentStep === 1
                    ? `Sinkronisasi Node: ${targetRoom.name}`
                    : currentStep === 2
                    ? `Minta ${targetUser.name} menempelkan jari pada sensor...`
                    : currentStep === 3
                    ? 'Memverifikasi template ID internal AS608...'
                    : `Template ID #${assignedTemplateId} tersimpan di Flash memory AS608`
                }
              />
            </div>
          </div>
        )}
        </DialogBody>

        {/* Footer Actions */}
        <DialogFooter>
          {!isAdding ? (
            <Button variant="secondary" size="sm" className="w-full sm:w-auto cursor-pointer" onClick={handleResetAndClose}>
              Tutup
            </Button>
          ) : (
            <>
              {currentStep === 1 && (
                <>
                  <Button variant="secondary" size="sm" onClick={handleCancelAddFlow} className="cursor-pointer">
                    Batal
                  </Button>
                  <Button
                    variant="purple"
                    size="sm"
                    onClick={handleStartEnrollment}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="cursor-pointer"
                  >
                    Mulai Enrollment
                  </Button>
                </>
              )}

              {currentStep === 4 && (
                <Button variant="success" size="sm" className="w-full cursor-pointer" onClick={handleCancelAddFlow}>
                  Selesai & Kembali ke Daftar
                </Button>
              )}
            </>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
