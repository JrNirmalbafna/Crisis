// ─────────────────────────────────────────────────────────────────────────────
// layouts/Sidebar.tsx
// Full-height fixed sidebar — glassmorphism, collapsible, Framer Motion,
// active-route derived from URL, tooltip labels when collapsed.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Satellite,
  BrainCircuit,
  Zap,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { NAV_ITEMS, APP_META, ROUTES } from "../constants/constants";
import type { NavItem } from "../constants/constants";

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Satellite,
  BrainCircuit,
  Zap,
  BarChart3,
  Settings,
};

// ── Widths ────────────────────────────────────────────────────────────────────
const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 68;

// ── Nav Item ──────────────────────────────────────────────────────────────────
interface NavItemRowProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate: () => void;
}

function NavItemRow({ item, collapsed, onNavigate }: NavItemRowProps) {
  const Icon: LucideIcon = ICON_MAP[item.iconName] ?? LayoutDashboard;
  const tooltipRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative group/navitem">
      <NavLink
        to={item.path}
        onClick={onNavigate}
        end={item.path === ROUTES.MISSION_CONTROL}
        className={({ isActive }) =>
          [
            "relative flex items-center gap-3 rounded-xl transition-all duration-200 overflow-hidden select-none",
            collapsed ? "px-[14px] py-3 justify-center" : "px-3 py-2.5",
            isActive
              ? "text-white"
              : "text-white/45 hover:text-white/85",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            {/* Active slide-in background */}
            {isActive && (
              <motion.span
                layoutId="sidebar-active-bg"
                className="absolute inset-0 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(6,182,212,0.08) 100%)",
                  border: "1px solid rgba(59,130,246,0.22)",
                }}
                transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
              />
            )}

            {/* Hover background (inactive only) */}
            {!isActive && (
              <span className="absolute inset-0 rounded-xl bg-white/0 group-hover/navitem:bg-white/[0.04] transition-colors duration-200" />
            )}

            {/* Left accent pill */}
            {isActive && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                style={{
                  background: "linear-gradient(180deg, #3B82F6, #06B6D4)",
                  boxShadow: "0 0 10px rgba(59,130,246,0.55)",
                }}
                transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
              />
            )}

            {/* Icon */}
            <Icon
              className={[
                "shrink-0 relative z-10 transition-colors duration-200",
                isActive ? "text-blue-400" : "text-current",
                // subtle scale on hover via group
                "group-hover/navitem:scale-[1.06] transition-transform duration-150",
              ].join(" ")}
              style={{ width: 17, height: 17 }}
            />

            {/* Label (fade out when collapsed) */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Badge (only when expanded) */}
            <AnimatePresence initial={false}>
              {!collapsed && item.badge && (
                <motion.span
                  key="badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="relative z-10 ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{
                    background: "rgba(59,130,246,0.18)",
                    border: "1px solid rgba(59,130,246,0.28)",
                    color: "#60A5FA",
                  }}
                >
                  {item.badge}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          ref={tooltipRef}
          className="
            pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
            px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
            opacity-0 group-hover/navitem:opacity-100 scale-95 group-hover/navitem:scale-100
            transition-all duration-150 origin-left
          "
          style={{
            background: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(59,130,246,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
          role="tooltip"
        >
          {item.label}
          {item.badge && (
            <span className="ml-1.5 text-[9px] text-blue-400 tracking-widest">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebar, toggleSidebarCollapsed } = useAppStore();
  const navigate = useNavigate();
  const collapsed = sidebar.collapsed;

  const handleLogoClick = () => {
    navigate(ROUTES.LANDING);
    onNavigate?.();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full z-30 overflow-visible shrink-0"
      style={{
        background: "linear-gradient(180deg, rgba(7,17,31,0.98) 0%, rgba(3,7,18,0.99) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <button
        onClick={handleLogoClick}
        className={[
          "flex items-center shrink-0 cursor-pointer select-none transition-all duration-200",
          "hover:bg-white/[0.03] rounded-xl mx-2 mt-2",
          collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-4",
        ].join(" ")}
        aria-label="Go to landing"
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #0284c7 100%)",
            boxShadow: "0 0 18px rgba(56,189,248,0.45)",
            border: "1px solid rgba(56,189,248,0.3)"
          }}
        >
          <img src="/favicon.svg" alt="Crisis Logo" className="w-5 h-5 object-contain" />
        </div>

        {/* Wordmark */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="wordmark"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden text-left"
            >
              <p className="text-white font-bold text-[15px] leading-tight tracking-wide">
                {APP_META.name}
              </p>
              <p className="text-[10px] text-white/35 leading-tight font-mono tracking-[0.18em] uppercase">
                Space Intel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* ── Top divider ───────────────────────────────────────────────────── */}
      <div className="mx-3 h-px bg-white/[0.05] my-1.5 shrink-0" />

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav
        className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto overflow-x-visible"
        style={{ scrollbarWidth: "none" }}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item: NavItem) => (
          <NavItemRow
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={() => onNavigate?.()}
          />
        ))}
      </nav>

      {/* ── Bottom: Collapse Toggle ────────────────────────────────────────── */}
      <div className="shrink-0 px-2 pb-3 pt-1">
        <div className="mx-1 h-px bg-white/[0.05] mb-2" />
        <button
          onClick={toggleSidebarCollapsed}
          className={[
            "w-full flex items-center rounded-xl px-3 py-2.5",
            "text-white/35 hover:text-white/65 hover:bg-white/[0.04]",
            "transition-all duration-200 text-sm group/collapse",
            collapsed ? "justify-center" : "gap-2.5",
          ].join(" ")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0"
          >
            {collapsed ? (
              <PanelLeftOpen style={{ width: 16, height: 16 }} />
            ) : (
              <PanelLeftClose style={{ width: 16, height: 16 }} />
            )}
          </motion.span>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="collapse-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden font-medium text-[13px]"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
