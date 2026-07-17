import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAppStore } from "../store/useAppStore";

export default function AppLayout() {
  const { sidebar, closeMobileSidebar } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebar.mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      {/* Desktop */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile — slide-in drawer */}
      <AnimatePresence>
        {sidebar.mobileOpen && (
          <motion.div
            className="fixed left-0 top-0 bottom-0 z-30 lg:hidden"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-dot-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
