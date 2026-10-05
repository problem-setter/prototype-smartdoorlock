import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string | number;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string | number) => void;
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-[#1aae39] shrink-0" />,
  error: <XCircle className="h-4 w-4 text-[#eb5757] shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-[#dd5b00] shrink-0" />,
  info: <ShieldCheck className="h-4 w-4 text-[#5645d4] shrink-0" />,
};

const toastBorderBg: Record<ToastVariant, string> = {
  success: 'bg-white border-[#d2f4d9] text-[#000000] shadow-notion-2',
  error: 'bg-white border-[#fadad9] text-[#000000] shadow-notion-2',
  warning: 'bg-white border-[#fbd6b8] text-[#000000] shadow-notion-2',
  info: 'bg-white border-[#d6b6f6] text-[#000000] shadow-notion-2',
};

const toastProgressBar: Record<ToastVariant, string> = {
  success: 'bg-[#1aae39]',
  error: 'bg-[#eb5757]',
  warning: 'bg-[#dd5b00]',
  info: 'bg-[#5645d4]',
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-[calc(100%-1.5rem)] sm:max-w-[420px] pointer-events-none font-sans px-2"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const variant = toast.variant || 'success';
          const duration = toast.duration || 3000;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={cn(
                'pointer-events-auto relative overflow-hidden rounded-lg border p-3.5 sm:p-4 shadow-notion-2 flex items-center justify-between gap-3',
                toastBorderBg[variant]
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {toastIcons[variant]}
                <span className="text-xs sm:text-sm font-semibold tracking-tight truncate leading-snug text-[#000000]">
                  {toast.message}
                </span>
              </div>

              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#5645d4] hover:bg-[#4534b3] text-white shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                >
                  {toast.action.label}
                </button>
              )}

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-md text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>

              {/* Countdown Progress Line */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={cn('absolute bottom-0 inset-x-0 h-[2px]', toastProgressBar[variant])}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
ToastNotification.displayName = 'ToastNotification';


