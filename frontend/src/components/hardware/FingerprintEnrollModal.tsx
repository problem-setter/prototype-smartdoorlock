import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context';
import { User, Room, FingerprintSlot } from '../../types';
import { hardwareService, EnrollStatusPayload } from '@/services/hardwareService';
import {
  Fingerprint,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const { enrollFingerprint, cancelEnrollFingerprint, updateFingerprintLabel, removeFingerprint, currentUser, connectionState } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [assignedTemplateId, setAssignedTemplateId] = useState<number | null>(null);
  const [enrollingSlot, setEnrollingSlot] = useState<number>(1);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [hardwareStatusMsg, setHardwareStatusMsg] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  const enrollmentTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isEnrollingRef = useRef(false);

  const existingFps: FingerprintSlot[] = targetUser ? (targetUser.fingerprints || (
    targetUser.fingerprintTemplateIds
      ? targetUser.fingerprintTemplateIds.map((id, idx) => ({
          templateId: id,
          label: idx === 0 ? 'Jempol Kanan' : idx === 1 ? 'Telunjuk Kanan' : 'Jempol Kiri',
          registeredAt: targetUser.createdAt || new Date().toISOString()
        }))
      : targetUser.fingerprintTemplateId
        ? [{ templateId: targetUser.fingerprintTemplateId, label: 'Jempol Kanan', registeredAt: targetUser.createdAt || new Date().toISOString() }]
        : []
  )) : [];

  const canAddMore = existingFps.length < 3;
  const isSuperadmin = currentUser?.role === 'superadmin';

  const defaultSuggestedLabels = [
    'Jempol Kanan',
    'Telunjuk Kanan',
    'Jempol Kiri',
    'Telunjuk Kiri',
  ];

  const nextSuggestedLabel = defaultSuggestedLabels.find(
    (l) => !existingFps.some((f) => f.label.toLowerCase() === l.toLowerCase())
  ) || `Sidik Jari #${existingFps.length + 1}`;

  // Find next free template ID (1..127)
  const calculateNextTemplateId = (): number => {
    const takenIds = existingFps.map((f) => f.templateId);
    for (let id = 1; id <= 127; id++) {
      if (!takenIds.includes(id)) {
        return id;
      }
    }
    return Math.floor(Math.random() * 100) + 1;
  };

  const clearEnrollmentTimers = () => {
    isEnrollingRef.current = false;
    enrollmentTimers.current.forEach(clearTimeout);
    enrollmentTimers.current = [];
  };

  useEffect(() => {
    return () => {
      clearEnrollmentTimers();
    };
  }, []);

  // Listen to live hardware DY50 enrollment events via hardwareService
  useEffect(() => {
    if (!isAdding || !isOpen || !targetUser) return;

    const unsub = hardwareService.onEnrollStatus((payload: EnrollStatusPayload) => {
      const isMatchingDevice =
        !payload.deviceId ||
        payload.deviceId === targetRoom.deviceId ||
        payload.deviceId === 'ESP32-USB' ||
        payload.deviceId.includes('ESP32') ||
        payload.deviceId.includes('doorlock');

      if (!isMatchingDevice) return;

      switch (payload.status) {
        case 'WAIT_FINGER_1':
          setCurrentStep(2);
          setHardwareStatusMsg(payload.message || 'Sensor DY50 aktif: Tempelkan jari pertama pada sensor...');
          setEnrollError(null);
          break;

        case 'IMAGE_1_OK':
        case 'LIFT_FINGER':
          setCurrentStep(3);
          setHardwareStatusMsg(payload.message || 'Gambar 1 berhasil! Angkat jari...');
          break;

        case 'WAIT_FINGER_2':
          setCurrentStep(3);
          setHardwareStatusMsg(payload.message || 'Tempelkan jari yang sama sekali lagi untuk konfirmasi...');
          break;

        case 'IMAGE_2_OK':
        case 'CREATE_MODEL_OK':
          setCurrentStep(3);
          setHardwareStatusMsg(payload.message || 'Mengekstrak fitur dan membuat model biometrik...');
          break;

        case 'STORE_OK':
          clearEnrollmentTimers();
          setCurrentStep(4);
          const templateIdToSet = payload.templateId || assignedTemplateId || 1;
          setAssignedTemplateId(templateIdToSet);
          setHardwareStatusMsg(payload.message || `Sidik jari sukses disimpan pada slot flash sensor #${templateIdToSet}`);

          const labelToSave = newLabelInput.trim() !== '' ? newLabelInput.trim() : nextSuggestedLabel;
          enrollFingerprint(targetUser.id, targetRoom.id, labelToSave);

          import('canvas-confetti').then((m) => {
            m.default({
              particleCount: 50,
              spread: 50,
              origin: { y: 0.6 },
            });
          });
          break;

        case 'TIMEOUT':
        case 'ERROR':
        case 'CANCELLED':
          clearEnrollmentTimers();
          setEnrollError(payload.message || (payload.status === 'TIMEOUT' ? 'Waktu pendaftaran habis (Timeout 15 detik).' : 'Proses pendaftaran dibatalkan atau gagal.'));
          setHardwareStatusMsg(null);
          break;
      }
    });

    return () => {
      unsub();
    };
  }, [isAdding, isOpen, targetUser, targetRoom.deviceId, targetRoom.id, assignedTemplateId, newLabelInput, nextSuggestedLabel, enrollFingerprint]);

  const handleStartEnrollment = () => {
    if (!targetUser) return;
    clearEnrollmentTimers();
    setEnrollError(null);
    const targetId = calculateNextTemplateId();
    setAssignedTemplateId(targetId);
    isEnrollingRef.current = true;
    setCurrentStep(2);
    setHardwareStatusMsg('Mengirim sinyal pendaftaran ke ESP32 DY50...');

    // Send real hardware command via hardwareService (MQTT & Web Serial)
    hardwareService.startEnroll(targetRoom.deviceId, targetId, targetUser.id);

    // Fallback simulation timer if testing without physical hardware connected
    const isHardwareOnline = connectionState.mqttConnected || connectionState.serialConnected;
    if (!isHardwareOnline) {
      const firstScanTimer = setTimeout(() => {
        if (!isEnrollingRef.current) return;
        setCurrentStep(3);
        setHardwareStatusMsg('Simulasi Hardware: Angkat jari lalu tempelkan sekali lagi...');

        const secondScanTimer = setTimeout(async () => {
          if (!isEnrollingRef.current) return;
          const labelToSave = newLabelInput.trim() !== '' ? newLabelInput.trim() : nextSuggestedLabel;
          const result = await enrollFingerprint(targetUser.id, targetRoom.id, labelToSave);
          if (result.success && isEnrollingRef.current) {
            setAssignedTemplateId(result.templateId);
            setCurrentStep(4);
            setHardwareStatusMsg(`Simulasi Selesai: Template ID #${result.templateId} terdaftar.`);
            import('canvas-confetti').then((m) => {
              m.default({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.6 },
              });
            });
          }
        }, 2500);
        enrollmentTimers.current.push(secondScanTimer);
      }, 2500);
      enrollmentTimers.current.push(firstScanTimer);
    }
  };

  const handleTriggerSimulatedSuccess = async () => {
    if (!targetUser) return;
    clearEnrollmentTimers();
    setEnrollError(null);
    const labelToSave = newLabelInput.trim() !== '' ? newLabelInput.trim() : nextSuggestedLabel;
    const result = await enrollFingerprint(targetUser.id, targetRoom.id, labelToSave);
    if (result.success) {
      setAssignedTemplateId(result.templateId);
      setCurrentStep(4);
      setHardwareStatusMsg(`Biometrik berhasil didaftarkan: Slot #${result.templateId}`);
      import('canvas-confetti').then((m) => {
        m.default({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
        });
      });
    }
  };

  const handleStartAddFlow = () => {
    setIsAdding(true);
    setEnrollingSlot(Math.min(existingFps.length + 1, 3));
    setNewLabelInput(nextSuggestedLabel);
    setHardwareStatusMsg(null);
    setEnrollError(null);
    setCurrentStep(1);
  };

  const handleCancelAddFlow = () => {
    clearEnrollmentTimers();
    cancelEnrollFingerprint(targetRoom.id);
    hardwareService.cancelEnroll(targetRoom.deviceId);
    setIsAdding(false);
    setCurrentStep(1);
    setAssignedTemplateId(null);
    setNewLabelInput('');
    setHardwareStatusMsg(null);
    setEnrollError(null);
  };

  const handleResetAndClose = () => {
    clearEnrollmentTimers();
    if (isAdding && currentStep > 1 && currentStep < 4) {
      cancelEnrollFingerprint(targetRoom.id);
      hardwareService.cancelEnroll(targetRoom.deviceId);
    }
    setIsAdding(false);
    setCurrentStep(1);
    setAssignedTemplateId(null);
    setEditingTemplateId(null);
    setNewLabelInput('');
    setHardwareStatusMsg(null);
    setEnrollError(null);
    onClose();
  };

  const handleSaveLabelEdit = (templateId: number) => {
    if (!targetUser) return;
    if (editingLabelValue.trim() !== '') {
      updateFingerprintLabel(targetUser.id, templateId, editingLabelValue.trim());
    }
    setEditingTemplateId(null);
    setEditingLabelValue('');
  };

  if (!isOpen || !targetUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleResetAndClose(); }}>
      <DialogContent size="md" className="w-full max-w-md sm:max-w-[440px] bg-white border border-[#e5e3df] shadow-notion-2 text-[#1a1a1a]" onClose={handleResetAndClose}>

        {/* Header */}
        <DialogHeader className="pr-12 sm:pr-14">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-md bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6] shrink-0">
              <Fingerprint className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">Kelola Sidik Jari (Biometrik)</DialogTitle>
              <DialogDescription className="truncate">Superadmin Portal &bull; Sensor DY50 {targetRoom.name}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* User Info Capsule */}
        <div className="p-3 rounded-md bg-[#f6f5f4] border border-[#e5e3df] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar size="sm" className="border-[#e5e3df] shrink-0">
              <AvatarFallback>{targetUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#1a1a1a] truncate">{targetUser.name}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-white border border-[#e5e3df] text-[#37352f] shrink-0">
                  {targetUser.role.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-[#5d5b54] font-mono truncate">{targetUser.email}</div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border bg-white border-[#e5e3df] text-[#37352f] shrink-0">
              {Math.min(existingFps.length, 3)}/3 Slot
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        {!isAdding ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5 min-w-0 flex-1 truncate">
                <ShieldCheck className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                <span className="truncate">Daftar Biometrik Terdaftar ({existingFps.length}/3)</span>
              </span>
              {isSuperadmin && canAddMore && (
                <Button variant="default" size="sm" onClick={handleStartAddFlow} className="h-7 text-xs px-2.5 gap-1 cursor-pointer shadow-xs shrink-0">
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>Tambah FP</span>
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {existingFps.length === 0 ? (
                <div className="p-5 text-center rounded-md bg-[#f6f5f4] border border-[#e5e3df] space-y-2">
                  <Fingerprint className="h-8 w-8 text-[#a4a097] mx-auto opacity-50 shrink-0" />
                  <p className="text-xs text-[#5d5b54]">Belum ada sidik jari terdaftar.</p>
                  {isSuperadmin && (
                    <Button variant="default" size="sm" onClick={handleStartAddFlow} className="mt-1 cursor-pointer shadow-xs">
                      <Plus className="h-3.5 w-3.5 mr-1 shrink-0" /> Tambah Sidik Jari Pertama
                    </Button>
                  )}
                </div>
              ) : (
                existingFps.map((fp, index) => (
                  <div key={fp.templateId} className="p-3 rounded-md bg-white border border-[#e5e3df] shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-md bg-[#e6e0f5] border border-[#d6b6f6] flex items-center justify-center text-[#5645d4] font-mono text-xs font-bold shrink-0">
                        #{fp.templateId}
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingTemplateId === fp.templateId ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              className="h-8 text-xs py-1 px-2.5 bg-white border-[#5645d4] focus:ring-1 focus:ring-[#5645d4] min-w-0 flex-1"
                              placeholder="Nama jari"
                              aria-label="Nama label sidik jari"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveLabelEdit(fp.templateId)}
                              className="min-h-[32px] min-w-[32px] p-1.5 rounded-md bg-[#eefbf1] text-[#1aae39] border border-[#d2f4d9] cursor-pointer hover:bg-[#d2f4d9] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1aae39] shrink-0"
                              aria-label="Simpan perubahan nama sidik jari"
                              title="Simpan"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTemplateId(null)}
                              className="min-h-[32px] min-w-[32px] p-1.5 rounded-md bg-[#f6f5f4] text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#eceae8] border border-[#e5e3df] cursor-pointer transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] shrink-0"
                              aria-label="Batal edit label"
                              title="Batal"
                            >
                              <X className="h-3.5 w-3.5 shrink-0" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#1a1a1a] truncate min-w-0 flex-1">{fp.label}</span>
                              <span className="text-[11px] font-mono text-[#5d5b54] shrink-0">
                                &bull; Slot {index + 1}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#5d5b54] font-mono truncate">DY50-#{fp.templateId}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {isSuperadmin && editingTemplateId !== fp.templateId && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => { setEditingTemplateId(fp.templateId); setEditingLabelValue(fp.label); }}
                          className="min-h-[32px] min-w-[32px] p-1.5 rounded-md text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#f6f5f4] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4] shrink-0"
                          aria-label={`Ubah label sidik jari ${fp.label}`}
                          title="Edit Label"
                        >
                          <Edit3 className="h-3.5 w-3.5 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFingerprint(targetUser.id, fp.templateId)}
                          className="min-h-[32px] min-w-[32px] p-1.5 rounded-md text-[#5d5b54] hover:text-[#eb5757] hover:bg-[#fadad9]/40 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb5757] shrink-0"
                          aria-label={`Hapus sidik jari ${fp.label} template ID ${fp.templateId}`}
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {existingFps.length >= 3 && (
              <div className="p-2.5 rounded-md bg-[#fdf3eb] border border-[#fbd6b8] text-[11px] text-[#dd5b00] flex items-start gap-2">
                <span className="font-bold shrink-0">&bull;</span>
                <span className="min-w-0 flex-1">Batas maksimal 3 sidik jari per user telah tercapai. Hapus salah satu sidik jari jika ingin mendaftarkan baru.</span>
              </div>
            )}
          </div>
        ) : (

          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-[#5d5b54]">
                <span>Tahap {currentStep} dari 4</span>
                <span className="font-mono text-[#5645d4] font-semibold">Slot {enrollingSlot} / 3</span>
              </div>
              <div className="h-1.5 w-full bg-[#f6f5f4] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#e5e3df]">
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-[#5645d4] w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-[#5645d4] w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-[#5645d4] w-1/4' : ''}`}></div>
                <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-[#1aae39] w-1/4' : ''}`}></div>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-2 p-3.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df]">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fp-input-label" className="text-xs font-semibold text-[#1a1a1a]">
                    Label / Posisi Jari
                  </Label>
                  {newLabelInput && (
                    <button
                      type="button"
                      onClick={() => setNewLabelInput("")}
                      className="text-[10px] text-[#787671] hover:text-[#e03131] cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <Input
                  id="fp-input-label"
                  type="text"
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  placeholder="Misal: Jempol Kanan..."
                  className="h-8 text-xs bg-white border-[#e5e3df] focus:border-[#5645d4] focus:ring-1 focus:ring-[#5645d4]"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  {defaultSuggestedLabels.map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewLabelInput(lbl)}
                      className={`text-[11px] py-1 px-1.5 rounded-md border text-center transition-all cursor-pointer truncate font-medium ${
                        newLabelInput === lbl
                          ? 'bg-[#e6e0f5] text-[#5645d4] border-[#5645d4]/40 font-semibold shadow-2xs'
                          : 'bg-white text-[#5d5b54] hover:text-[#1a1a1a] border-[#e5e3df] hover:bg-[#f6f5f4] hover:border-[#c8c4be]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {enrollError && (
              <div className="p-3 rounded-md bg-[#fadad9]/50 border border-[#f5b8b6] text-xs text-[#eb5757] flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#eb5757]" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">Gagal Mendaftarkan Sidik Jari</div>
                  <div className="text-[11px] text-[#787774] mt-0.5">{enrollError}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleStartEnrollment}
                      className="h-7 text-[11px] px-2.5 gap-1.5 cursor-pointer bg-white border-[#f5b8b6] text-[#eb5757] hover:bg-[#fadad9]"
                    >
                      <RotateCcw className="h-3 w-3 shrink-0" />
                      Coba Lagi
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-md bg-[#f6f5f4] border border-[#e5e3df] text-center space-y-3">
              <BiometricScanner
                status={
                  enrollError
                    ? 'failed'
                    : currentStep === 1
                    ? 'idle'
                    : currentStep === 2
                    ? 'scanning'
                    : currentStep === 3
                    ? 'scanning'
                    : 'success'
                }
                size="md"
                label={
                  enrollError
                    ? 'Proses Terputus atau Gagal'
                    : currentStep === 1
                    ? `Siap Mendaftarkan Sidik Jari #${enrollingSlot}`
                    : currentStep === 2
                    ? 'Tempelkan Jari ke Sensor DY50'
                    : currentStep === 3
                    ? 'Angkat & Tempelkan Sekali Lagi'
                    : 'Pendaftaran Biometrik Berhasil'
                }
                sublabel={
                  hardwareStatusMsg || (
                    currentStep === 1
                      ? `Sinkronisasi Node: ${targetRoom.name} (${targetRoom.deviceId})`
                      : currentStep === 2
                      ? `Minta ${targetUser.name} menempelkan jari pada sensor...`
                      : currentStep === 3
                      ? 'Memverifikasi template ID internal DY50...'
                      : `Template ID #${assignedTemplateId} tersimpan di Flash memory DY50`
                  )
                }
              />

              {/* Dev Simulation Button if offline / testing in browser */}
              {(currentStep === 2 || currentStep === 3) && !enrollError && (
                <div className="pt-2 border-t border-[#e5e3df]/60 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleTriggerSimulatedSuccess}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#5645d4] hover:text-[#4335a8] px-2 py-1 rounded bg-[#e6e0f5]/60 hover:bg-[#e6e0f5] transition-colors cursor-pointer"
                    title="Simulasikan respon STORE_OK dari sensor DY50"
                  >
                    <Sparkles className="h-3 w-3" />
                    Simulasi Sinyal Sensor OK (Dev)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        </DialogBody>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-[#e5e3df] bg-[#f6f5f4]">
          {!isAdding ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer rounded-md font-medium"
              onClick={handleResetAndClose}
            >
              Tutup
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:justify-end">
              {currentStep === 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelAddFlow}
                    className="min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer rounded-md font-medium"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleStartEnrollment}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer font-medium shadow-xs rounded-md"
                  >
                    Mulai Enrollment
                  </Button>
                </>
              )}

              {(currentStep === 2 || currentStep === 3) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelAddFlow}
                  className="col-span-2 w-full sm:w-auto min-h-[40px] sm:min-h-[36px] px-4 cursor-pointer rounded-md font-medium text-[#eb5757] hover:bg-[#fadad9]/40"
                >
                  Batal Enrollment
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  variant="default"
                  size="sm"
                  className="col-span-2 w-full sm:w-auto min-h-[40px] sm:min-h-[36px] px-5 cursor-pointer font-medium shadow-xs rounded-md"
                  onClick={handleCancelAddFlow}
                >
                  Selesai &amp; Kembali ke Daftar
                </Button>
              )}
            </div>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

