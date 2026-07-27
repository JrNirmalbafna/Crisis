import { AppDialog } from "../ui-custom/AppDialog";
import { MetricGauge } from "../ui-custom/MetricGauge";
import type { SatelliteHealth } from "../../types/types";
import { getSatelliteInfoById } from "../../constants/satelliteInfo";

interface SatelliteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  satellite: SatelliteHealth | null;
}

export function SatelliteDetailDialog({ open, onOpenChange, satellite }: SatelliteDetailDialogProps) {
  if (!satellite) return null;

  // Descriptive facts from single source of truth (satelliteInfo.ts)
  const info = getSatelliteInfoById(satellite.name);
  const role = info?.role ?? "Space environment monitor";
  const agency = info?.agency ?? "—";
  const orbitPosition = info?.orbitPosition ?? "—";
  const launchYear = info?.launchYear ?? "—";

  return (
    <AppDialog 
      open={open} 
      onOpenChange={onOpenChange} 
      title={satellite.name}
      description={role}
      size="sm"
    >
      <div className="flex flex-col gap-6 mt-4">
        {/* Descriptive Meta Row (sourced from satelliteInfo.ts — single source of truth) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] text-white/40 font-mono uppercase">Agency</span>
            <span className="text-xs font-semibold text-white/80 mt-1">{agency}</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] text-white/40 font-mono uppercase">Launched</span>
            <span className="text-xs font-semibold text-white/80 mt-1">{launchYear}</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] text-white/40 font-mono uppercase">Orbit</span>
            <span className={`text-xs font-semibold mt-1 ${orbitPosition === "L1 Lagrange Point" ? "text-cyan-400" : "text-emerald-400"}`}>
              {orbitPosition === "L1 Lagrange Point" ? "L1" : "GEO"}
            </span>
          </div>
        </div>

        {/* Live Status (sourced from SatelliteHealth) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] text-white/40 font-mono uppercase">Health Status</span>
            <span className={`text-sm font-semibold capitalize mt-1 ${satellite.health === 'nominal' ? 'text-emerald-400' : satellite.health === 'warning' ? 'text-amber-400' : 'text-rose-400'}`}>
              {satellite.health}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[11px] text-white/40 font-mono uppercase">Signal Strength</span>
            <span className="text-sm font-semibold text-white/90 mt-1">{satellite.signal}</span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-white/40 font-mono uppercase mb-1">Latency</span>
            <span className="text-lg font-semibold text-white/90">{satellite.latency}ms</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-white/40 font-mono uppercase mb-1">Missing</span>
            <span className="text-lg font-semibold text-white/90">{satellite.missingPercent.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-[10px] text-white/40 font-mono uppercase mb-1">Contrib</span>
            <span className="text-lg font-semibold text-white/90">{satellite.contributionPercent}%</span>
          </div>
        </div>

        {/* Trust Score Gauge */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center">
          <span className="text-[11px] text-white/40 font-mono uppercase mb-4">Data Trust Score</span>
          <div className="w-48 h-32 relative">
            <MetricGauge 
              value={satellite.trustScore} 
              size="lg" 
            />
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
