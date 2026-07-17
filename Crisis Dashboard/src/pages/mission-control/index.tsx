import { motion } from "framer-motion";
import StatusCards from "./StatusCards";
import LiveEnvironmentPanel from "./LiveEnvironmentPanel";
import EventsTimeline from "./EventsTimeline";
import SolarParametersChart from "./SolarParametersChart";
import PredictionSummary from "./PredictionSummary";
import ImpactSummary from "./ImpactSummary";

export default function MissionControlPage() {
  return (
    <div className="flex flex-col gap-5 p-5 min-h-full">
      {/* ── Top Row: Status Cards ─────────────────────────────────────────── */}
      <section aria-label="System Status">
        <StatusCards />
      </section>

      {/* ── Middle Row: Live Viz & Timeline ──────────────────────────────── */}
      <section 
        aria-label="Live Environment and Timeline"
        className="flex flex-col lg:flex-row gap-5 min-h-[400px] lg:min-h-[500px]"
      >
        <div className="flex-[7] min-w-0 h-[400px] lg:h-auto">
          <LiveEnvironmentPanel />
        </div>
        <div className="flex-[3] min-w-0 h-[400px] lg:h-auto">
          <EventsTimeline />
        </div>
      </section>

      {/* ── Bottom Row: Analytics & Impact ───────────────────────────────── */}
      <section 
        aria-label="Analytics and Impact Summaries"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <SolarParametersChart />
        <PredictionSummary />
        <ImpactSummary />
      </section>
    </div>
  );
}
