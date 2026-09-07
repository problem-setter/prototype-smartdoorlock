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
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string | number) => void;
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
  info: <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />,
};

const toastBorderBg: Record<ToastVariant, string> = {
  success: 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100 shadow-emerald-950/50',
  error: 'bg-rose-950/90 border-rose-700/60 text-rose-100 shadow-rose-950/50',
  warning: 'bg-amber-950/90 border-amber-700/60 text-amber-100 shadow-amber-950/50',
  info: 'bg-sky-950/90 border-sky-700/60 text-sky-100 shadow-sky-950/50',
};

const toastProgressBar: Record<ToastVariant, string> = {
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
  warning: 'bg-amber-400',
  info: 'bg-sky-400',
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const variant = toast.variant || 'success';
          const duration = toast.duration || 3000;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={cn(
                'pointer-events-auto relative overflow-hidden rounded-xl border p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3',
                toastBorderBg[variant]
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {toastIcons[variant]}
                <span className="text-xs sm:text-sm font-medium tracking-tight truncate leading-snug">
                  {toast.message}
                </span>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Countdown Progress Line */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={cn('absolute bottom-0 inset-x-0 h-0.5', toastProgressBar[variant])}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
ToastNotification.displayName = 'ToastNotification';
