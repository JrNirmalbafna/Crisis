import { useMemo } from "react";
import { generate15YearData } from "./mockData";
import SummaryCards from "./SummaryCards";
import SolarCycleChart from "./SolarCycleChart";
import SpeedWidthScatter from "./SpeedWidthScatter";
import HistoricalEventsGrid from "./HistoricalEventsGrid";
import { BarChart3 } from "lucide-react";

export default function HistoricalAnalyticsPage() {
  // Generate data once per mount
  const { monthlyTrends, events, kpis } = useMemo(() => generate15YearData(), []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#020617] p-6 text-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded bg-[#10B981]/20 flex items-center justify-center border border-[#10B981]/30">
          <BarChart3 className="w-5 h-5 text-[#10B981]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Historical Analytics</h1>
          <p className="text-sm text-slate-400">15-Year Longitudinal Solar Cycle & CME Database (2011–2026)</p>
        </div>
      </div>

      <SummaryCards kpis={kpis} />
      
      <SolarCycleChart data={monthlyTrends} />

      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[400px]">
        <SpeedWidthScatter events={events} />
        <HistoricalEventsGrid events={events} />
      </div>
      
      {/* Bottom padding for scrolling */}
      <div className="h-12 w-full shrink-0"></div>
    </div>
  );
}
