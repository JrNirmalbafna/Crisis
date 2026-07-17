import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getSystemStatusOverview } from "../../services/api";
import { SpaceWeatherView } from "../../components/visualization/SpaceWeatherView";

export default function LiveEnvironmentPanel() {
  const { data: statusOverview } = useQuery({
    queryKey: ["system-status-overview"],
    queryFn: getSystemStatusOverview,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex flex-col w-full h-full min-h-[400px] lg:min-h-[500px] rounded-[18px] overflow-hidden group"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.8) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── Space Weather Visualization ────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <SpaceWeatherView />
      </div>

      {/* ── Overlay Header ─────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10 pointer-events-none">
        <div>
          <h2 className="text-white/90 font-semibold text-sm drop-shadow-lg">
            Live Space Environment
          </h2>
          <p className="text-white/50 text-[11px] font-mono mt-0.5 drop-shadow-sm uppercase tracking-widest">
            NASA Eyes · Solar System
          </p>
        </div>

        {statusOverview && (
          <div
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-auto"
            style={{
              background: "rgba(7, 17, 31, 0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                statusOverview.statusColor === "amber"
                  ? "bg-amber-400 animate-pulse"
                  : statusOverview.statusColor === "red"
                  ? "bg-rose-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span className="text-[10px] text-white/80 font-mono font-semibold uppercase tracking-wider">
              {statusOverview.statusText}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
