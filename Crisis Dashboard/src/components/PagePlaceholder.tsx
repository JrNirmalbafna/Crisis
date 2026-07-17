import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  accentColor?: string;
}

export default function PagePlaceholder({
  title,
  description,
  Icon,
  accentColor = "#3B82F6",
}: PagePlaceholderProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-full p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="glass-card p-10 flex flex-col items-center text-center max-w-lg w-full">
        {/* Icon badge */}
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{
            background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%)`,
            border: `1px solid ${accentColor}33`,
            boxShadow: `0 0 24px ${accentColor}22`,
          }}
        >
          <Icon
            className="w-8 h-8"
            style={{ color: accentColor }}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>

        {/* Description */}
        <p className="text-white/40 text-sm leading-relaxed mb-6">{description}</p>

        {/* Coming soon badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase"
          style={{
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}25`,
            color: accentColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accentColor }}
          />
          Building...
        </div>
      </div>
    </motion.div>
  );
}
