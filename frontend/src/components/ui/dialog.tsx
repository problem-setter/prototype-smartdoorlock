import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Dialog Overlay ─── */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, handleEscape]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal Card Content is rendered here */}
          {children}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
Dialog.displayName = 'Dialog';

/* ─── DialogContent ─── */
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const dialogSizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, size = 'lg' }, ref) => (
    <motion.div
      ref={ref as React.Ref<HTMLDivElement>}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative w-full flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-10 overflow-hidden my-auto',
        'max-h-[min(90dvh,calc(100dvh-2rem))] sm:max-h-[min(86dvh,720px)]',
        dialogSizeMap[size],
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </motion.div>
  )
);
DialogContent.displayName = 'DialogContent';

/* ─── DialogHeader ─── */
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1 border-b border-slate-800/80 px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900/90 backdrop-blur-sm shrink-0 pr-10', className)}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

/* ─── DialogTitle ─── */
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xs sm:text-sm font-bold text-white tracking-tight', className)}
      {...props}
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

/* ─── DialogDescription ─── */
const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-[10px] sm:text-xs text-slate-400', className)}
      {...props}
    />
  )
);
DialogDescription.displayName = 'DialogDescription';

/* ─── DialogBody — scrollable content area between Header and Footer ─── */
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-3.5 sm:space-y-4 overscroll-contain', className)}
      {...props}
    />
  )
);
DialogBody.displayName = 'DialogBody';

/* ─── DialogFooter ─── */
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shrink-0', className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter };
