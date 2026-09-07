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
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06090f] disabled:cursor-not-allowed disabled:opacity-50 relative',
        s.track,
        checked ? 'bg-sky-500 shadow-sm shadow-sky-500/30' : 'bg-slate-800 border-slate-700',
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        animate={{
          x: checked ? s.offset : 0,
          backgroundColor: checked ? '#ffffff' : '#cbd5e1',
        }}
        className={cn(
          'pointer-events-none block rounded-full shadow-md ring-0',
          s.thumb
        )}
      />
    </button>
  );
};
Switch.displayName = 'Switch';

export { Switch };

