import StatusCards from "./StatusCards";
import SolarCoronagraphViewer from "../../components/visualization/SolarCoronagraphViewer";
import AuroralForecastMap from "../../components/visualization/AuroralForecastMap";
import EventsTimeline from "./EventsTimeline";
import SolarParametersChart from "./SolarParametersChart";
import PredictionSummary from "./PredictionSummary";
import ImpactSummary from "./ImpactSummary";
import GroundMagneticsChart from "./GroundMagneticsChart";

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
        className="flex flex-col lg:flex-row gap-5 min-h-[400px]"
      >
        <div className="flex-[4] min-w-0 h-[400px] lg:h-auto">
          <SolarCoronagraphViewer />
        </div>
        <div className="flex-[3] min-w-0 h-[400px] lg:h-auto">
          <AuroralForecastMap />
        </div>
        <div className="flex-[3] min-w-0 h-[400px] lg:h-auto">
          <EventsTimeline />
        </div>
      </section>

      {/* ── Bottom Row: Analytics & Impact ───────────────────────────────── */}
      <section 
        aria-label="Analytics and Impact Summaries"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        <SolarParametersChart />
        <GroundMagneticsChart />
        <PredictionSummary />
        <ImpactSummary />
      </section>
    </div>
  );
}
