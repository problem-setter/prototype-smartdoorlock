import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Focusable Selector for Focus Trapping ─── */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/* ─── Dialog Context for Accessible ARIA IDs ─── */
interface DialogContextValue {
  open: boolean;
  titleId: string;
  descriptionId: string;
  align: 'top' | 'center';
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

/* ─── Dialog Overlay ─── */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  align?: 'top' | 'center';
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, align = 'top' }) => {
  const baseId = React.useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-desc`;
  const shouldReduceMotion = useReducedMotion();

  // Escape key handling & body scroll locking with strict cleanup
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.stopPropagation();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onOpenChange]);

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      open,
      titleId,
      descriptionId,
      align,
    }),
    [open, titleId, descriptionId, align]
  );

  if (typeof document === 'undefined') return null;

  return (
    <DialogContext.Provider value={contextValue}>
      {createPortal(
        <AnimatePresence>
          {open && (
            <div
              className={cn(
                'fixed inset-0 z-50 flex justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain',
                align === 'top'
                  ? 'items-start pt-6 pb-6 sm:pt-10 sm:pb-10'
                  : 'items-center py-4'
              )}
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.05 : 0.15 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
              />

              {/* Modal Card Content is rendered here */}
              {children}
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </DialogContext.Provider>
  );
};
Dialog.displayName = 'Dialog';

/* ─── DialogContent ─── */
export interface DialogContentProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'top' | 'center';
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const dialogSizeMap = {
  sm: 'max-w-[360px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[460px]',
  xl: 'max-w-[480px]',
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      onClose,
      size = 'lg',
      align = 'top',
      initialFocusRef,
      onKeyDown,
      'aria-labelledby': ariaLabelledByProp,
      'aria-describedby': ariaDescribedByProp,
      ...props
    },
    forwardedRef
  ) => {
    const context = React.useContext(DialogContext);
    const shouldReduceMotion = useReducedMotion();

    const localRef = useRef<HTMLDivElement | null>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    const [hasTitle, setHasTitle] = useState(false);
    const [hasDesc, setHasDesc] = useState(false);

    // Merge forwarded ref and local ref
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    // Dynamic verification of title and description presence for valid ARIA references
    useEffect(() => {
      const container = localRef.current;
      if (!container || !context) return;

      if (!ariaLabelledByProp && context.titleId) {
        setHasTitle(Boolean(container.querySelector(`[id="${context.titleId}"]`)));
      }
      if (!ariaDescribedByProp && context.descriptionId) {
        setHasDesc(Boolean(container.querySelector(`[id="${context.descriptionId}"]`)));
      }
    }, [context, ariaLabelledByProp, ariaDescribedByProp]);

    // Focus management: initial focus placement & focus restoration on unmount
    useEffect(() => {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      const container = localRef.current;
      if (!container) return;

      const focusInitial = () => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
          return;
        }

        // Prioritize first form input/textarea/select in modal body if present
        const inputElements = container.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
        );
        const firstInput = Array.from(inputElements).find((el) => el.offsetParent !== null);
        if (firstInput) {
          firstInput.focus();
          return;
        }

        // Otherwise find first interactive element
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const first = Array.from(focusable).find(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );
        if (first) {
          first.focus();
        } else {
          container.focus();
        }
      };

      const rafId = requestAnimationFrame(focusInitial);

      return () => {
        cancelAnimationFrame(rafId);
        if (
          previousActiveElementRef.current &&
          typeof previousActiveElementRef.current.focus === 'function'
        ) {
          try {
            previousActiveElementRef.current.focus({ preventScroll: true });
          } catch {
            // Graceful fallback if original element was unmounted
          }
        }
      };
    }, [initialFocusRef]);

    // Keyboard focus trapping within the dialog boundary
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      if (e.key === 'Tab') {
        const container = localRef.current;
        if (!container) return;

        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusableElements.length === 0) {
          e.preventDefault();
          container.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Guard against focus having leaked outside dialog
        if (!container.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === container) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const effectiveAriaLabelledby =
      ariaLabelledByProp || (hasTitle && context?.titleId ? context.titleId : undefined);
    const effectiveAriaDescribedby =
      ariaDescribedByProp || (hasDesc && context?.descriptionId ? context.descriptionId : undefined);

    return (
      <motion.div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={effectiveAriaLabelledby}
        aria-describedby={effectiveAriaDescribedby}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.98, y: align === 'top' ? -12 : 8 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.98, y: align === 'top' ? -8 : 8 }
        }
        transition={{
          duration: shouldReduceMotion ? 0.05 : 0.18,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={cn(
          'relative w-full flex flex-col rounded-lg bg-white border border-[#e6e6e6] shadow-notion-2 z-10 overflow-hidden text-[#000000] focus:outline-none',
          align === 'center' && 'my-auto',
          'max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(88dvh,calc(100dvh-4rem))]',
          dialogSizeMap[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 inline-flex items-center justify-center h-8 w-8 rounded-md text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors z-20 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        )}
        {children}
      </motion.div>
    );
  }
);
DialogContent.displayName = 'DialogContent';

/* ─── DialogHeader ─── */
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1 border-b border-[#e6e6e6] px-4 py-3.5 bg-white shrink-0 pr-12 min-w-0',
        className
      )}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

/* ─── DialogTitle ─── */
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, id, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    const titleId = id || context?.titleId;
    return (
      <h3
        ref={ref}
        id={titleId}
        className={cn(
          'text-sm sm:text-base font-bold text-[#000000] tracking-tight leading-snug break-words min-w-0',
          className
        )}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = 'DialogTitle';

/* ─── DialogDescription ─── */
const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, id, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    const descriptionId = id || context?.descriptionId;
    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn('text-xs text-[#615d59] leading-relaxed break-words min-w-0', className)}
        {...props}
      />
    );
  }
);
DialogDescription.displayName = 'DialogDescription';

/* ─── DialogBody: scrollable content area between Header and Footer ─── */
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-dialog-body=""
      className={cn(
        'flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3.5 overscroll-contain pb-5 text-[#31302e]',
        className
      )}
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
      className={cn(
        'flex items-center justify-end gap-2 border-t border-[#e6e6e6] bg-[#f6f5f4] px-4 py-3 shrink-0',
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
};
