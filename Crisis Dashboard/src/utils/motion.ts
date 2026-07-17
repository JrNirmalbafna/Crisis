import type { Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";

/**
 * Shared animation variants for consistent component entrances.
 * Use the hooks to automatically respect user reduced-motion preferences.
 */

export const hoverScale = {
  scale: 1.02,
};

export function useSharedAnimations() {
  const prefersReducedMotion = useReducedMotion();

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const fadeSlideUp: Variants = {
    hidden: prefersReducedMotion 
      ? { opacity: 0 } 
      : { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    },
  };

  return {
    staggerContainer,
    fadeSlideUp,
    hoverScale,
  };
}
