import { motion } from "framer-motion";
import { cn } from "../../utils";

interface LoadingSkeletonProps {
  variant?: "card" | "row" | "chart" | "text";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "text", count = 1, className }: LoadingSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "card":
        return "w-full h-32 rounded-[18px]";
      case "row":
        return "w-full h-12 rounded-lg";
      case "chart":
        return "w-full h-64 rounded-[18px]";
      case "text":
      default:
        return "w-full h-4 rounded-md";
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "relative overflow-hidden bg-white/[0.02] border border-white/[0.04]",
            getVariantStyles(),
            className
          )}
        >
          <motion.div
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 1.5,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { LoadingSkeleton } from "@/components/ui-custom/LoadingSkeleton";
// <LoadingSkeleton variant="card" count={3} />
