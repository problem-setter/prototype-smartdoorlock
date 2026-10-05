import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Register GSAP plugins
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };

/**
 * Standard Notion Design System animation easing curves & presets
 */
export const GSAP_PRESETS = {
  // Notion-style subtle entry ease (quick start, smooth deceleration)
  easeStandard: "power2.out",
  // Smooth sine for oscillating physical indicators (lasers, beacon pulses)
  easeSmooth: "sine.inOut",
  // Mechanical/Linear for continuous electrical/data current flows
  easeLinear: "none",
  // Gentle micro-spring for interactive state changes
  easeSnappy: "back.out(1.4)",
  // Subtle vibration for warning/error feedback
  easeShake: "rough({strength: 2, points: 10, template: power2.inOut, taper: 'out'})",
  // Durations (in seconds)
  durationFast: 0.2,
  durationNormal: 0.35,
  durationSlow: 0.6,
  durationCircuitLoop: 1.5,
};

/**
 * Helper to animate SVG stroke dashed flow for circuit wires
 */
export const animateCircuitWire = (
  element: SVGElement | string,
  options?: {
    speed?: number;
    reverse?: boolean;
    active?: boolean;
  }
) => {
  const { speed = GSAP_PRESETS.durationCircuitLoop, reverse = false, active = true } = options || {};
  if (!active) {
    gsap.killTweensOf(element);
    return null;
  }

  return gsap.to(element, {
    strokeDashoffset: reverse ? 40 : -40,
    duration: speed,
    repeat: -1,
    ease: "none",
  });
};

/**
 * Helper to flash terminal or card with pastel background and fade back
 */
export const flashHighlight = (
  element: HTMLElement | null,
  startColor = "#e6e0f5",
  duration = 0.6
) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { backgroundColor: startColor },
    {
      backgroundColor: "transparent",
      duration,
      ease: GSAP_PRESETS.easeStandard,
      clearProps: "backgroundColor",
    }
  );
};
