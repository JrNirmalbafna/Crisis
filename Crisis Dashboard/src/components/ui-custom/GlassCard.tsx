import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils";

type MotionDivProps = React.ComponentPropsWithoutRef<typeof motion.div>;

interface GlassCardProps extends Omit<MotionDivProps, "children"> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = false, padding = "md", ...props }, ref) => {
    const paddingStyles = {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.02 } : {}}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "relative rounded-[18px] overflow-hidden text-slate-50",
          "bg-white/[0.02] border border-white/[0.06] backdrop-blur-[12px]",
          "shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {/* Subtle hover background lift (internal) */}
        {hover && (
          <span className="absolute inset-0 bg-white/0 hover:bg-white/[0.02] transition-colors duration-200 pointer-events-none" />
        )}
        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// ── Usage Example ────────────────────────────────────────────────────────────
// import { GlassCard } from "@/components/ui-custom/GlassCard";
// <GlassCard hover padding="md">Content</GlassCard>
