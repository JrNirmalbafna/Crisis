// ─────────────────────────────────────────────────────────────────────────────
// components/NotificationDrawer.tsx
// Right-side slide-in drawer for notifications — portal-rendered,
// glassmorphism panel, empty state with clear CTA.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Satellite, Zap, BrainCircuit } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ── Placeholder notification items ────────────────────────────────────────────
// These will be replaced with real data from the backend/store later.
const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: "1",
    icon: Zap,
    iconColor: "#F59E0B",
    iconBg: "rgba(245,158,11,0.10)",
    title: "CME Event Detected",
    body: "Moderate CME observed by SOHO — estimated arrival in 38h",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    icon: Satellite,
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.10)",
    title: "DSCOVR Bz Turning South",
    body: "Bz dropped to −12 nT — geomagnetic storm watch issued",
    time: "18 min ago",
    unread: true,
  },
  {
    id: "3",
    icon: BrainCircuit,
    iconColor: "#8B5CF6",
    iconBg: "rgba(139,92,246,0.10)",
    title: "Model Prediction Updated",
    body: "Helios consensus model revised Kp forecast to 6.2 (G2 storm)",
    time: "1 hr ago",
    unread: false,
  },
] as const;

export default function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { clearAlerts } = useAppStore();

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClearAll = () => {
    clearAlerts();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="notif-backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          {/* ── Drawer panel ─────────────────────────────────────────────── */}
          <motion.aside
            key="notif-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-[340px] max-w-[92vw]"
            style={{
              background:
                "linear-gradient(180deg, rgba(9,18,36,0.98) 0%, rgba(5,10,22,0.99) 100%)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.45)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <Bell className="text-blue-400" style={{ width: 14, height: 14 }} />
                </div>
                <h2 className="text-white font-semibold text-[15px]">Notifications</h2>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded text-blue-400 tracking-wide"
                  style={{
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.22)",
                  }}
                >
                  {PLACEHOLDER_NOTIFICATIONS.filter((n) => n.unread).length} NEW
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200"
                aria-label="Close notifications"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* ── Notification list ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5" style={{ scrollbarWidth: "none" }}>
              {PLACEHOLDER_NOTIFICATIONS.map((notif, i) => {
                const Icon = notif.icon;
                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                    className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 group/notif"
                    style={{
                      background: notif.unread
                        ? "rgba(59,130,246,0.05)"
                        : "rgba(255,255,255,0.02)",
                      border: notif.unread
                        ? "1px solid rgba(59,130,246,0.12)"
                        : "1px solid rgba(255,255,255,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = notif.unread
                        ? "rgba(59,130,246,0.05)"
                        : "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLElement).style.borderColor = notif.unread
                        ? "rgba(59,130,246,0.12)"
                        : "rgba(255,255,255,0.04)";
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                      style={{
                        background: notif.iconBg,
                        border: `1px solid ${notif.iconColor}22`,
                      }}
                    >
                      <Icon style={{ width: 14, height: 14, color: notif.iconColor }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold text-white/90 leading-snug">
                          {notif.title}
                        </p>
                        {notif.unread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ background: "#3B82F6" }}
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="text-[12px] text-white/40 leading-snug">{notif.body}</p>
                      <p className="text-[11px] text-white/25 mt-1 font-mono">{notif.time}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={handleClearAll}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200"
              >
                Mark all as read
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
