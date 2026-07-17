// ─────────────────────────────────────────────────────────────────────────────
// store/useAppStore.ts — Global UI state
// Persists sidebar.collapsed + theme to localStorage.
// Ephemeral state (mobileOpen, alerts) is NOT persisted.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme, SidebarState } from "../types/types";

interface AppState {
  // ── Theme ──────────────────────────────────────────────────────────────────
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebar: SidebarState;
  /** Toggle collapsed state (desktop) — persisted */
  toggleSidebarCollapsed: () => void;
  /** Set collapsed state directly (desktop) — persisted */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Toggle mobile overlay open/close */
  toggleMobileSidebar: () => void;
  /** Close mobile overlay (called on navigation or backdrop click) */
  closeMobileSidebar: () => void;

  // ── Notification drawer ───────────────────────────────────────────────────
  notificationDrawerOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;

  // ── Unread alert count ─────────────────────────────────────────────────────
  unreadAlertCount: number;
  setUnreadAlertCount: (count: number) => void;
  incrementUnreadAlerts: () => void;
  clearAlerts: () => void;

  // ── Active CME event (cross-page drill-down) ───────────────────────────────
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Theme ───────────────────────────────────────────────────────────────
      theme: "dark",
      setTheme: (theme) => set({ theme }),

      // ── Sidebar ─────────────────────────────────────────────────────────────
      sidebar: { collapsed: false, mobileOpen: false },

      toggleSidebarCollapsed: () =>
        set((s) => ({
          sidebar: { ...s.sidebar, collapsed: !s.sidebar.collapsed },
        })),

      setSidebarCollapsed: (collapsed) =>
        set((s) => ({ sidebar: { ...s.sidebar, collapsed } })),

      toggleMobileSidebar: () =>
        set((s) => ({
          sidebar: { ...s.sidebar, mobileOpen: !s.sidebar.mobileOpen },
        })),

      closeMobileSidebar: () =>
        set((s) => ({ sidebar: { ...s.sidebar, mobileOpen: false } })),

      // ── Notification drawer ──────────────────────────────────────────────────
      notificationDrawerOpen: false,
      openNotifications:  () => set({ notificationDrawerOpen: true }),
      closeNotifications: () => set({ notificationDrawerOpen: false }),

      // ── Alerts ──────────────────────────────────────────────────────────────
      unreadAlertCount: 0,
      setUnreadAlertCount: (count) => set({ unreadAlertCount: count }),
      incrementUnreadAlerts: () =>
        set((s) => ({ unreadAlertCount: s.unreadAlertCount + 1 })),
      clearAlerts: () => set({ unreadAlertCount: 0 }),

      // ── Event selection ──────────────────────────────────────────────────────
      selectedEventId: null,
      setSelectedEventId: (id) => set({ selectedEventId: id }),
    }),
    {
      name: "helios-app-store-v2",
      storage: createJSONStorage(() => localStorage),
      // Only persist layout prefs — no ephemeral drawer/mobile states
      partialize: (state) => ({
        theme:   state.theme,
        sidebar: { collapsed: state.sidebar.collapsed, mobileOpen: false },
      }),
    }
  )
);
