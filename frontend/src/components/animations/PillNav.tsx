import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  href?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
}

export const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#06090f',
  pillColor = '#0c111d',
  hoveredPillTextColor = '#ffffff',
  pillTextColor = '#94a3b8',
  onMobileMenuClick,
  initialLoadAnimation = true,
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);
  const isLayoutScheduledRef = useRef(false);

  const scheduleLayout = useCallback(() => {
    if (isLayoutScheduledRef.current) return;
    isLayoutScheduledRef.current = true;

    requestAnimationFrame(() => {
      isLayoutScheduledRef.current = false;
      const circles = circleRefs.current;
      if (!circles || circles.length === 0) return;

      // Phase 1: Batch Reads
      const measurements = circles.map((circle) => {
        if (!circle?.parentElement) return null;
        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        return { circle, pill, w: rect.width, h: rect.height };
      });

      // Phase 2: Batch Writes
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

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');
        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.25, xPercent: -50, duration: 1.5, ease, overwrite: 'auto' }, 0);
        if (label) {
          tl.to(label, { y: -(h + 8), duration: 1.5, ease, overwrite: 'auto' }, 0);
        }
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 80), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 1.5, ease, overwrite: 'auto' }, 0);
        }
        tlRefs.current[index] = tl;
      });
    });
  }, [ease]);

  useEffect(() => {
    scheduleLayout();

    const observer = new ResizeObserver(() => {
      scheduleLayout();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;
      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, { scale: 1, duration: 0.6, ease });
      }
      if (navItems) {
        gsap.set(navItems, { opacity: 0, y: 10 });
        gsap.to(navItems, { opacity: 1, y: 0, duration: 0.6, ease });
      }
    }

    const tls = tlRefs.current;
    const tweens = activeTweenRefs.current;
    return () => {
      observer.disconnect();
      tls.forEach((tl) => tl?.kill());
      tweens.forEach((tw) => tw?.kill());
      logoTweenRef.current?.kill();
    };
  }, [items.length, ease, initialLoadAnimation, scheduleLayout]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto',
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto',
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.4,
      ease,
      overwrite: 'auto',
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;
    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }
    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          },
        });
      }
    }
    onMobileMenuClick?.();
  };

  const cssVars = {
    ['--base' as string]: baseColor,
    ['--pill-bg' as string]: pillColor,
    ['--hover-text' as string]: hoveredPillTextColor,
    ['--pill-text' as string]: resolvedPillTextColor,
  } as React.CSSProperties;

  return (
    <div className="pill-nav-container" ref={containerRef}>
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        {logo && (
          <a
            className="pill-logo"
            href={items?.[0]?.href || '#'}
            aria-label="Home"
            onMouseEnter={handleLogoEnter}
            ref={logoRef}
            onClick={(e) => {
              if (items?.[0]?.onClick) {
                e.preventDefault();
                items[0].onClick(e);
              }
            }}
          >
            <img src={logo} alt={logoAlt} ref={logoImgRef} />
          </a>
        )}

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const isActive = activeHref === item.href;
              const content = (
                <>
                  <span
                    className="hover-circle"
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack">
                    <span className="pill-label">
                      {item.icon && <span className="pill-icon">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                    <span className="pill-label-hover" aria-hidden="true">
                      {item.icon && <span className="pill-icon">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                  </span>
                </>
              );

              return (
                <li key={item.href || `item-${i}`} role="none">
                  {item.href ? (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={item.onClick}
                    >
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={item.onClick}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item, i) => (
            <li key={item.href || `mobile-item-${i}`}>
              <a
                href={item.href || '#'}
                className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                {item.icon && <span className="inline-block mr-2">{item.icon}</span>}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
