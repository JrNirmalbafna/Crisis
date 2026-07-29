// ─────────────────────────────────────────────────────────────────────────────
// layouts/DashboardLayout.tsx
// Shell wrapping every dashboard page (all routes except Landing).
// Sidebar + Topbar + Outlet — responsive, no layout shift.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "../store/useAppStore";

// ── Page content transition ───────────────────────────────────────────────────
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

export default function DashboardLayout() {
  const { sidebar, closeMobileSidebar } = useAppStore();
  const location = useLocation();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #030712 0%, #07111F 55%, #0B1728 100%)",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP SIDEBAR — always rendered, width animated by Framer Motion  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MOBILE SIDEBAR — overlay drawer, slide from left                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {sidebar.mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileSidebar}
              aria-hidden
            />

            {/* Sidebar drawer */}
            <motion.div
              key="mobile-sidebar"
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.85 }}
            >
              <Sidebar onNavigate={closeMobileSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT AREA                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Topbar */}
        <Topbar onMobileMenuClick={() => useAppStore.getState().toggleMobileSidebar()} />

        {/* Page content with subtle fade-in on route change */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(59,130,246,0.2) transparent" }}
        >
          {/* Dot grid texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 min-h-full flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
