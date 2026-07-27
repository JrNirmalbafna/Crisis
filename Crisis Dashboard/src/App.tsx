import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { OperationalProvider } from "./context/OperationalContext";

// ── React Query client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 30 seconds — good default for near-real-time data
      staleTime: 30_000,
      // Retry failed queries up to 2 times
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      // Refetch on window focus by default
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OperationalProvider>
        <RouterProvider router={router} />
      </OperationalProvider>
    </QueryClientProvider>
  );
}
