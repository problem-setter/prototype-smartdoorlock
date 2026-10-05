import React, { useCallback } from 'react';
import {
  Key,
  Lock,
  Unlock,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { SlideCommit } from './SlideCommit';

export interface SlideToUnlockProps {
  onUnlock: () => Promise<unknown> | unknown;
  isUnlocking?: boolean;
  isUnlocked?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  countdownRemaining?: number;
  onForceRelock?: () => void;
  label?: string;
  unlockedLabel?: string;
  roomName?: string;
  roomCode?: string;
  variant?: 'hero' | 'compact';
  className?: string;
}

// Single shared audio context to prevent main-thread latency & memory leaks
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTactileSolenoidSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
    snapGain.gain.setValueAtTime(0.15, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.04);

    const clackOsc = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clackOsc.type = 'sine';
    clackOsc.frequency.setValueAtTime(240, now + 0.025);
    clackOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    clackGain.gain.setValueAtTime(0.2, now + 0.025);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    clackOsc.connect(clackGain);
    clackGain.connect(ctx.destination);
    clackOsc.start(now + 0.025);
    clackOsc.stop(now + 0.1);
  } catch {
    // Ignore audio errors
  }
}

export const SlideToUnlock: React.FC<SlideToUnlockProps> = ({
  onUnlock,
  isUnlocking = false,
  isUnlocked = false,
  disabled = false,
  disabledReason = 'Perangkat tidak siap',
  countdownRemaining = 5,
  onForceRelock,
  label = 'GESER UNTUK MEMBUKA KUNCI',
  unlockedLabel = 'KUNCI TERBUKA',
  roomName,
  variant = 'hero',
  className,
}) => {
  const isHero = variant === 'hero';

  const handleConfirm = useCallback(async () => {
    playTactileSolenoidSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 70]);
    }
    const result = await onUnlock();
    if (result === false) {
      throw new Error('Unlock rejected');
    }
    return result;
  }, [onUnlock]);

  if (isUnlocked || isUnlocking) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md border',
          'bg-[#eefbf1] border-[#d2f4d9] shadow-notion-1',
          isHero ? 'p-3.5 sm:p-4' : 'p-2.5 sm:p-3',
          className
        )}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 sm:p-2.5 rounded-md bg-white border border-[#d2f4d9] text-[#1aae39] shadow-xs shrink-0">
              <Unlock className="h-5 w-5 sm:h-6 sm:w-6 text-[#1aae39]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#1a1a1a] tracking-wide font-mono uppercase">
                  {unlockedLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#37352f] font-mono mt-0.5">
                Tertutup otomatis dalam <strong className="text-[#1aae39] font-bold">{countdownRemaining} detik</strong>
              </p>
            </div>
          </div>

          {onForceRelock && (
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="destructive"
                size="sm"
                onClick={onForceRelock}
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                className="shrink-0 shadow-xs cursor-pointer rounded-md"
              >
                Kunci Paksa
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <Tooltip content={disabledReason}>
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-[#e5e3df] bg-[#f6f5f4] p-2 sm:p-2.5 opacity-70 cursor-not-allowed select-none',
            className
          )}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <div className="flex items-center gap-2.5 text-[#5d5b54] font-mono text-xs">
              <div className="p-2 rounded-md bg-white border border-[#e5e3df] text-[#5d5b54]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-[#1a1a1a] text-[11px] uppercase tracking-wider">Remote Unlock Terkunci</div>
                <div className="text-[10px] text-[#5d5b54] flex items-center gap-1">
                  <WifiOff className="h-3 w-3 text-[#eb5757]" />
                  {disabledReason}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono font-semibold text-[#5d5b54] uppercase px-2.5 py-1 rounded-full bg-white border border-[#e5e3df]">
              OFFLINE
            </div>
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={cn('relative w-full flex items-center justify-center select-none', className)}>
      <SlideCommit
        label={label}
        doneLabel={unlockedLabel}
        errorLabel="GAGAL MEMBUKA KUNCI"
        onConfirm={handleConfirm}
        trackColor="#f6f5f4"
        handleColor="#5645d4"
        successColor="#1aae39"
        dangerColor="#eb5757"
        width="100%"
        height={isHero ? 56 : 48}
        radius={isHero ? 28 : 24}
        speed={55}
        returnBounce={0.35}
        icon={<Key className="h-4 w-4 text-white" />}
        className={cn('w-full', roomName ? `slide-commit--${roomName.toLowerCase().replace(/\s+/g, '-')}` : '')}
      />
    </div>
  );
};

export default SlideToUnlock;

