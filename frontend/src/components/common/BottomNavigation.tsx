import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/context';
import { Layers, UserCheck, DoorClosed, Lock, Unlock } from 'lucide-react';
import { gsap } from 'gsap';
import './BottomNavigation.css';

interface BottomNavigationProps {
  currentTab: 'rooms' | 'users';
  setCurrentTab: (tab: 'rooms' | 'users') => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'sky' | 'purple' | 'emerald';
  isActive: boolean;
  onClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { currentUser, selectedRoomId, setSelectedRoomId, rooms } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const isLayoutScheduledRef = useRef(false);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleSelectRooms = useCallback(() => {
    setSelectedRoomId(null);
    setCurrentTab('rooms');
  }, [setSelectedRoomId, setCurrentTab]);

  const handleSelectActiveRoom = useCallback(() => {
    setCurrentTab('rooms');
  }, [setCurrentTab]);

  const handleSelectUsers = useCallback(() => {
    setSelectedRoomId(null);
    setCurrentTab('users');
  }, [setSelectedRoomId, setCurrentTab]);

  const navItems: NavItemConfig[] = useMemo(() => {
    if (!currentUser) return [];

    const items: NavItemConfig[] = [
      {
        id: 'rooms',
        label: 'Ruangan',
        icon: Layers,
        variant: 'sky',
        isActive: currentTab === 'rooms' && !selectedRoomId,
        onClick: handleSelectRooms,
      },
    ];

    if (selectedRoomId) {
      const isUnlocked = selectedRoom?.lockStatus === 'UNLOCKED';
      items.push({
        id: 'active-room',
        label: selectedRoom?.code || 'Detail',
        icon: isUnlocked ? Unlock : (selectedRoom ? DoorClosed : Lock),
        variant: isUnlocked ? 'emerald' : 'sky',
        isActive: true,
        onClick: handleSelectActiveRoom,
      });
    }

    if (currentUser.role === 'superadmin') {
      items.push({
        id: 'users',
        label: 'Pengguna',
        icon: UserCheck,
        variant: 'purple',
        isActive: currentTab === 'users' && !selectedRoomId,
        onClick: handleSelectUsers,
      });
    }

    return items;
  }, [currentTab, selectedRoomId, selectedRoom, currentUser, handleSelectRooms, handleSelectActiveRoom, handleSelectUsers]);

  // Zero-layout-thrashing geometry setup using decoupled RAF batching
  const scheduleLayout = useCallback(() => {
    if (isLayoutScheduledRef.current) return;
    isLayoutScheduledRef.current = true;

    requestAnimationFrame(() => {
      isLayoutScheduledRef.current = false;
      const circles = circleRefs.current;
      if (!circles || circles.length === 0) return;

      // PHASE 1: Batch All DOM Reads (Zero Reflow Invalidation)
      const measurements = circles.map((circle) => {
        if (!circle?.parentElement) return null;
        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        return {
          circle,
          pill,
          w: rect.width,
          h: rect.height,
        };
      });

      // PHASE 2: Batch All DOM & GSAP Writes
      measurements.forEach((m, index) => {
        if (!m || m.w === 0 || m.h === 0) return;
        const { circle, pill, w, h } = m;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const def = pill.querySelector<HTMLElement>('.bottom-pill-label-default');
        const hov = pill.querySelector<HTMLElement>('.bottom-pill-label-hover');
        if (def) gsap.set(def, { y: 0, opacity: 1 });
        if (hov) gsap.set(hov, { y: h + 10, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.25, xPercent: -50, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }, 0);
        if (def) {
          tl.to(def, { y: -(h + 6), opacity: 0, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }, 0);
        }
        if (hov) {
          gsap.set(hov, { y: Math.ceil(h + 16), opacity: 0 });
          tl.to(hov, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }, 0);
        }
        tlRefs.current[index] = tl;
      });
    });
  }, []);

  useEffect(() => {
    if (!currentUser || navItems.length === 0) return;

    scheduleLayout();

    const observer = new ResizeObserver(() => {
      scheduleLayout();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const tls = tlRefs.current;
    const tweens = activeTweenRefs.current;

    return () => {
      observer.disconnect();
      tls.forEach((tl) => tl?.kill());
      tweens.forEach((tw) => tw?.kill());
    };
  }, [currentUser, navItems.length, scheduleLayout]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.28,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.18,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  if (!currentUser) return null;

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 pointer-events-none safe-pb flex justify-center"
      aria-label="Navigasi Aplikasi"
    >
      <div className="max-w-md w-full pointer-events-auto px-1 sm:px-0" ref={containerRef}>
        <div 
          className="bottom-nav-dock p-1.5 flex items-center justify-around gap-1.5"
          role="tablist"
        >
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            const circleVariantClass = 
              item.variant === 'purple' 
                ? 'bottom-pill-circle-purple' 
                : item.variant === 'emerald'
                ? 'bottom-pill-circle-emerald'
                : 'bottom-pill-circle-sky';

            const activeClass = item.isActive
              ? item.variant === 'purple'
                ? 'is-active-purple text-purple-200 font-bold'
                : item.variant === 'emerald'
                ? 'is-active-emerald text-emerald-200 font-bold'
                : 'is-active-sky text-sky-200 font-bold'
              : 'text-slate-400 hover:text-slate-200';

            const pipClass = 
              item.variant === 'purple'
                ? 'bottom-pill-pip-purple'
                : item.variant === 'emerald'
                ? 'bottom-pill-pip-emerald'
                : 'bottom-pill-pip-sky';

            const iconDefaultColor = item.isActive
              ? item.variant === 'purple'
                ? 'text-purple-400'
                : item.variant === 'emerald'
                ? 'text-emerald-400'
                : 'text-sky-400'
              : 'text-slate-400';

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.isActive}
                aria-label={item.label}
                onClick={item.onClick}
                onMouseEnter={() => handleEnter(index)}
                onMouseLeave={() => handleLeave(index)}
                className={`bottom-pill-item flex-1 py-2 sm:py-2.5 px-2.5 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[54px] cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 ${activeClass}`}
              >
                {/* GSAP Expandable Hover Circle */}
                <span
                  className={`bottom-pill-circle ${circleVariantClass}`}
                  aria-hidden="true"
                  ref={(el) => {
                    circleRefs.current[index] = el;
                  }}
                />

                {/* Animated Label & Icon Stack */}
                <span className="bottom-pill-stack">
                  {/* Default Content */}
                  <span className="bottom-pill-label-default">
                    <IconComponent className={`h-4 w-4 shrink-0 transition-transform ${iconDefaultColor}`} />
                    <span className="text-[11px] sm:text-xs font-semibold tracking-tight truncate max-w-[110px]">
                      {item.label}
                    </span>
                  </span>

                  {/* Hovered Revealed Content */}
                  <span className="bottom-pill-label-hover font-bold" aria-hidden="true">
                    <IconComponent className="h-4 w-4 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                    <span className="text-[11px] sm:text-xs tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] truncate max-w-[110px]">
                      {item.label}
                    </span>
                  </span>
                </span>

                {/* Active Indicator Neon Pip */}
                {item.isActive && (
                  <span className={`bottom-pill-pip ${pipClass}`} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
