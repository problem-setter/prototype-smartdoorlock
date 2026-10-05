import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'purple' | 'orange';
  group?: string;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  isActive?: boolean;
  onClear?: () => void;
  size?: 'sm' | 'default';
  disabled?: boolean;
  customActiveLabel?: React.ReactNode;
  variant?: 'form' | 'filter';
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  label,
  ariaLabel,
  icon,
  className,
  menuClassName,
  align = 'left',
  isActive: customIsActive,
  onClear,
  size = 'sm',
  disabled = false,
  customActiveLabel,
  variant,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const listboxId = `${uniqueId}-listbox`;

  // Determine effective mode: form or filter
  const effectiveVariant: 'form' | 'filter' =
    variant || (onClear || customIsActive !== undefined ? 'filter' : 'form');

  const selectedOption = options.find((opt) => opt.value === value);
  const isFiltered =
    effectiveVariant === 'filter' &&
    (customIsActive !== undefined ? customIsActive : (value !== 'ALL' && value !== ''));

  // Auto-detect optimal dropdown placement (top or bottom) based on viewport space
  const updatePlacement = useCallback(() => {
    if (triggerRef.current && typeof window !== 'undefined') {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If space below is constrained (< 240px) and above has more room, flip upwards
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePlacement();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Group options by group property if present
  const groupedOptions = React.useMemo(() => {
    const groups: { groupName?: string; items: SelectOption<T>[] }[] = [];
    const ungrouped: SelectOption<T>[] = [];

    options.forEach((opt) => {
      if (!opt.group) {
        ungrouped.push(opt);
      } else {
        let existingGroup = groups.find((g) => g.groupName === opt.group);
        if (!existingGroup) {
          existingGroup = { groupName: opt.group, items: [] };
          groups.push(existingGroup);
        }
        existingGroup.items.push(opt);
      }
    });

    const result: { groupName?: string; items: SelectOption<T>[] }[] = [];
    if (ungrouped.length > 0) {
      result.push({ items: ungrouped });
    }
    return result.concat(groups);
  }, [options]);

  // Flattened enabled options for keyboard navigation
  const flatEnabledOptions = React.useMemo(() => {
    return options.filter((opt) => !opt.disabled);
  }, [options]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Reset focus index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = flatEnabledOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, flatEnabledOptions, value]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < flatEnabledOptions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : flatEnabledOptions.length - 1));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(flatEnabledOptions.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < flatEnabledOptions.length) {
            const opt = flatEnabledOptions[focusedIndex];
            onChange(opt.value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [disabled, isOpen, focusedIndex, flatEnabledOptions, onChange]
  );

  const handleSelectOption = (optValue: T) => {
    onChange(optValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-[#eefbf1] text-[#0f762a] border-[#c8f2d1]';
      case 'warning':
      case 'orange':
        return 'bg-[#fdf3eb] text-[#b34500] border-[#fbd6b8]';
      case 'purple':
        return 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]';
      default:
        return 'bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative text-xs',
        effectiveVariant === 'form' ? 'w-full flex items-center min-w-0' : 'w-full sm:w-auto flex sm:inline-flex items-center',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || label || placeholder}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'rounded-md border text-xs font-medium transition-all cursor-pointer select-none focus-visible:outline-none',
          effectiveVariant === 'form'
            ? 'w-full min-w-0 flex items-center justify-between gap-2 text-left'
            : 'w-full sm:w-auto flex sm:inline-flex items-center justify-between gap-1.5',
          size === 'sm' ? 'h-8 px-2.5 py-1 min-h-[32px]' : 'h-9 px-3 py-1.5 min-h-[36px]',
          effectiveVariant === 'form'
            ? cn(
                'bg-white hover:bg-[#fafaf9] border-[#e5e3df] hover:border-[#c8c4be] text-[#1a1a1a]',
                isOpen && 'border-[#5645d4] ring-2 ring-[#5645d4]/15 bg-white shadow-xs',
                !selectedOption && 'text-[#a4a097]'
              )
            : cn(
                isFiltered
                  ? 'bg-[#e6e0f5]/40 border-[#d6b6f6] text-[#5645d4] hover:bg-[#e6e0f5]/60'
                  : 'bg-[#f6f5f4] hover:bg-white border-[#e5e3df] text-[#37352f] hover:text-[#000000]',
                isOpen && 'ring-2 ring-[#5645d4]/30 border-[#5645d4] bg-white shadow-2xs'
              ),
          disabled && 'opacity-50 pointer-events-none cursor-not-allowed'
        )}
      >
        {/* Left Icon & Label */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon ? (
            <span
              className={cn(
                'shrink-0 transition-colors',
                effectiveVariant === 'filter' && isFiltered ? 'text-[#5645d4]' : 'text-[#787671]'
              )}
            >
              {icon}
            </span>
          ) : selectedOption?.icon ? (
            <span className="shrink-0">{selectedOption.icon}</span>
          ) : null}

          {/* Trigger Label */}
          <span
            className={cn(
              'truncate',
              effectiveVariant === 'form' ? 'flex-1' : 'max-w-[140px] sm:max-w-[200px]',
              !selectedOption && 'text-[#a4a097]'
            )}
          >
            {customActiveLabel || selectedOption?.label || placeholder}
          </span>
        </div>

        {/* Right Controls: Badge & Clear/Chevron */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {selectedOption?.badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0 border leading-none',
                getBadgeStyle(selectedOption.badgeVariant)
              )}
            >
              {selectedOption.badge}
            </span>
          )}

          {/* Clear Button if Filtered */}
          {effectiveVariant === 'filter' && isFiltered && onClear ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Hapus filter"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="p-0.5 -mr-0.5 rounded hover:bg-black/10 text-[#5645d4] hover:text-[#000000] cursor-pointer transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          ) : (
            /* Chevron */
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                isOpen && 'rotate-180 text-[#5645d4]',
                effectiveVariant === 'filter' && isFiltered ? 'text-[#5645d4]' : 'text-[#787671]'
              )}
            />
          )}
        </div>
      </button>

      {/* Floating Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            initial={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 max-h-[340px] overflow-y-auto rounded-lg border border-[#e5e3df] bg-white p-1 shadow-notion-2 scrollbar-thin',
              placement === 'top' ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]',
              effectiveVariant === 'form' ? 'w-full min-w-[200px]' : 'min-w-[200px] max-w-[320px]',
              align === 'right' ? 'right-0' : 'left-0',
              menuClassName
            )}
          >
            {groupedOptions.map((group, gIdx) => (
              <div key={group.groupName || `ungrouped-${gIdx}`}>
                {group.groupName && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#787671] bg-[#f6f5f4]/80 rounded-sm my-0.5 flex items-center justify-between">
                    <span>{group.groupName}</span>
                  </div>
                )}
                {group.items.map((opt) => {
                  const isSelected = opt.value === value;
                  const flatIdx = flatEnabledOptions.findIndex((o) => o.value === opt.value);
                  const isFocused = flatIdx === focusedIndex;

                  return (
                    <button
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      onMouseEnter={() => setFocusedIndex(flatIdx)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-2.5 py-2 sm:py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer select-none',
                        isSelected
                          ? 'bg-[#e6e0f5]/70 text-[#5645d4] font-medium'
                          : isFocused
                          ? 'bg-[#f6f5f4] text-[#000000]'
                          : 'text-[#37352f] hover:bg-[#f6f5f4] hover:text-[#000000]',
                        opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                      )}
                    >
                      {/* Left: Icon & Label & Description */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.icon && (
                          <span
                            className={cn(
                              'shrink-0',
                              isSelected ? 'text-[#5645d4]' : 'text-[#787671]'
                            )}
                          >
                            {opt.icon}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[10px] text-[#787671] truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Badge & Checkmark */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {opt.badge !== undefined && (
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded-full text-[10px] font-mono border',
                              getBadgeStyle(opt.badgeVariant)
                            )}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#5645d4] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
                {gIdx < groupedOptions.length - 1 && (
                  <div className="h-px bg-[#f0eeec] my-1 mx-1" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
