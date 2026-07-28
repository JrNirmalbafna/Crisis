import StatusCards from "./StatusCards";
import SolarCoronagraphViewer from "../../components/visualization/SolarCoronagraphViewer";
import AuroralForecastMap from "../../components/visualization/AuroralForecastMap";
import AdityaL1SolarViewer from "../../components/visualization/AdityaL1SolarViewer";
import EventsTimeline from "./EventsTimeline";
import SolarParametersChart from "./SolarParametersChart";
import PredictionSummary from "./PredictionSummary";
import ImpactSummary from "./ImpactSummary";
import GroundMagneticsChart from "./GroundMagneticsChart";

export default function MissionControlPage() {
  return (
    <div className="flex flex-col gap-5 p-5 min-h-full">
      {/* ── Row 1: Status Cards ──────────────────────────────────────────────── */}
      <section aria-label="System Status">
        <StatusCards />
      </section>

      {/* ── Row 2: Three Live Spacecraft Viewers (fixed height) ──────────────── */}
      <section
        aria-label="Live Solar Observatory Suite"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[420px]"
      >
        {/* SOHO LASCO C2 White-light Coronagraph */}
        <div className="h-full">
          <SolarCoronagraphViewer />
        </div>
        {/* NASA SDO / Aditya-L1 Multi-Wavelength EUV Observer */}
        <div className="h-full">
          <AdityaL1SolarViewer />
        </div>
        {/* NOAA OVATION Auroral Forecast */}
        <div className="h-full">
          <AuroralForecastMap />
        </div>
      </section>

      {/* ── Row 3: Recent Events Timeline (full width, scrollable internally) ── */}
      <section aria-label="Recent Heliospheric Events" className="h-[520px]">
        <EventsTimeline />
      </section>

      {/* ── Row 4: Analytics & Impact ─────────────────────────────────────────── */}
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
