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
  align?: 'top' | 'center';
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, align = 'top' }) => {
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
        <div 
          className={cn(
            'fixed inset-0 z-50 flex justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain',
            align === 'top' 
              ? 'items-start pt-4 sm:pt-10 md:pt-14 pb-8 sm:pb-12' 
              : 'items-center py-4'
          )}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
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
  align?: 'top' | 'center';
}

const dialogSizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, size = 'lg', align = 'top' }, ref) => (
    <motion.div
      ref={ref as React.Ref<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      initial={{ 
        opacity: 0, 
        scale: 0.97, 
        y: align === 'top' ? -24 : 12 
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0 
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.97, 
        y: align === 'top' ? -16 : 12 
      }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative w-full flex flex-col rounded-2xl bg-[#0c111d] border border-white/[0.12] shadow-2xl shadow-black/90 z-10 overflow-hidden',
        align === 'center' && 'my-auto',
        'max-h-[min(92dvh,calc(100dvh-2.5rem))] sm:max-h-[min(88dvh,calc(100dvh-5rem))]',
        dialogSizeMap[size],
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors z-20 cursor-pointer"
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
      className={cn('flex flex-col space-y-1 border-b border-white/[0.08] px-4 py-3.5 sm:px-6 sm:py-4 bg-[#090e18]/90 backdrop-blur-md shrink-0 pr-10', className)}
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
      className={cn('text-xs sm:text-sm font-bold text-white tracking-tight leading-snug', className)}
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
      className={cn('text-[10px] sm:text-xs text-slate-400 leading-relaxed', className)}
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
      className={cn('flex-1 min-h-0 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-3.5 sm:space-y-4 overscroll-contain', className)}
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
      className={cn('flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-white/[0.08] bg-[#080d16]/90 backdrop-blur-md shrink-0', className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter };

