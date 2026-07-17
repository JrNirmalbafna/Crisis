// ─────────────────────────────────────────────────────────────────────────────
// layouts/Topbar.tsx
// Sticky top bar — glassmorphism, search input, notification bell, breadcrumb.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Search, X, ChevronRight, Menu, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";
import { NAV_ITEMS, APP_META } from "../constants/constants";
import NotificationDrawer from "../components/NotificationDrawer";

export default function Topbar({ onMobileMenuClick }: { onMobileMenuClick?: () => void }) {
  const { unreadAlertCount, notificationDrawerOpen, openNotifications, closeNotifications } = useAppStore();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Derive page title from current route path
  const currentNav = NAV_ITEMS.find((n) => n.path === location.pathname);
  const pageTitle = currentNav?.label ?? "Dashboard";

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchValue("");
  };

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center justify-between h-14 px-5 shrink-0"
        style={{
          background: "rgba(5,11,24,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.25)",
        }}
      >
        {/* ── Left: Mobile menu + Breadcrumb ────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white/75 hover:bg-white/[0.06] transition-colors shrink-0"
            onClick={onMobileMenuClick}
            aria-label="Open navigation"
          >
            <Menu style={{ width: 18, height: 18 }} />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-white/30 font-medium hidden sm:inline shrink-0">
              {APP_META.name}
            </span>
            <ChevronRight
              className="text-white/20 shrink-0 hidden sm:block"
              style={{ width: 13, height: 13 }}
            />
            <span className="text-white/85 font-semibold truncate">{pageTitle}</span>
          </nav>
        </div>

        {/* ── Right: Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search — expands inline on desktop, icon-only on mobile */}
          <div className="relative flex items-center">
            <AnimatePresence initial={false}>
              {searchOpen ? (
                <motion.div
                  key="search-open"
                  initial={{ width: 32, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 32, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    boxShadow: "0 0 0 3px rgba(59,130,246,0.08)",
                  }}
                >
                  <Search
                    className="ml-2.5 shrink-0 text-blue-400/70"
                    style={{ width: 14, height: 14 }}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search events, satellites…"
                    onKeyDown={(e) => e.key === "Escape" && handleSearchClose()}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 px-2 py-1.5 outline-none"
                    aria-label="Global search"
                  />
                  <button
                    onClick={handleSearchClose}
                    className="mr-1.5 p-1 rounded-md text-white/30 hover:text-white/70 transition-colors shrink-0"
                    aria-label="Close search"
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleSearchOpen}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white/40 hover:text-white/75 hover:bg-white/[0.05] transition-all duration-200"
                  aria-label="Open search"
                >
                  <Search style={{ width: 15, height: 15 }} />
                  <span className="hidden md:inline text-sm font-medium">Search</span>
                  <kbd
                    className="hidden md:inline text-[10px] text-white/25 font-mono ml-0.5"
                    aria-hidden
                  >
                    ⌘K
                  </kbd>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-white/[0.08] mx-0.5" />

          {/* Notification Bell */}
          <button
            id="topbar-notifications-btn"
            onClick={openNotifications}
            className="relative p-2 rounded-xl text-white/40 hover:text-white/75 hover:bg-white/[0.05] transition-all duration-200"
            aria-label={`Notifications${unreadAlertCount > 0 ? ` (${unreadAlertCount} unread)` : ""}`}
          >
            <Bell style={{ width: 17, height: 17 }} />

            {/* Unread badge */}
            <AnimatePresence>
              {unreadAlertCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.35 }}
                  className="absolute top-[5px] right-[5px] w-[7px] h-[7px] rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #EF4444, #F97316)",
                    boxShadow: "0 0 6px rgba(239,68,68,0.7)",
                  }}
                  aria-hidden
                />
              )}
            </AnimatePresence>
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-white/[0.08] mx-0.5" />

          {/* Live indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
            style={{
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.18)",
            }}
          >
            <Circle
              className="text-emerald-400 fill-emerald-400 animate-pulse"
              style={{ width: 6, height: 6 }}
            />
            <span className="text-[11px] font-semibold text-emerald-400 font-mono tracking-[0.12em]">
              LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Notification Drawer — rendered outside header for portal stacking */}
      <NotificationDrawer open={notificationDrawerOpen} onClose={closeNotifications} />
    </>
  );
}
