import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = 'md',
  id,
}) => {
  const sizeStyles = {
    sm: { track: 'h-5 w-9 p-0.5', thumb: 'h-4 w-4', offset: 16 },
    md: { track: 'h-6 w-11 p-0.5', thumb: 'h-5 w-5', offset: 20 },
  };

  const s = sizeStyles[size];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06090f] disabled:cursor-not-allowed disabled:opacity-50 relative shadow-inner',
        s.track,
        checked ? 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_12px_rgba(14,165,233,0.4)] border-sky-400/50' : 'bg-slate-900 border-slate-700',
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        animate={{
          x: checked ? s.offset : 0,
          backgroundColor: '#ffffff',
          boxShadow: checked ? '0 0 8px rgba(255,255,255,0.8)' : '0 1px 3px rgba(0,0,0,0.4)',
        }}
        className={cn(
          'pointer-events-none block rounded-full ring-0 shadow-sm',
          s.thumb
        )}
      />
    </button>
  );
};
Switch.displayName = 'Switch';

export { Switch };


