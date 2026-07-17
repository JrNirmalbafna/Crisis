import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: number | string;
}

export function AppDrawer({ 
  open, 
  onOpenChange, 
  title, 
  children, 
  side = "right",
  width = 340 
}: AppDrawerProps) {
  
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const xInitial = side === "left" ? "-100%" : "100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            aria-hidden
          />

          {/* Drawer Panel */}
          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            className="fixed top-0 bottom-0 z-50 flex flex-col max-w-[92vw] shadow-2xl"
            style={{
              width,
              [side]: 0,
              background: "linear-gradient(180deg, rgba(9,18,36,0.98) 0%, rgba(5,10,22,0.99) 100%)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderRight: side === "left" ? "1px solid rgba(255,255,255,0.07)" : "none",
              borderLeft: side === "right" ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
            initial={{ x: xInitial }}
            animate={{ x: 0 }}
            exit={{ x: xInitial }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold text-[15px] pr-4">{title}</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-all duration-200 shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Usage Example ────────────────────────────────────────────────────────────
// import { AppDrawer } from "@/components/ui-custom/AppDrawer";
// <AppDrawer open={isOpen} onOpenChange={setIsOpen} title="Settings" side="right">
//   Content inside
// </AppDrawer>
