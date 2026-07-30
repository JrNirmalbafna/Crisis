import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getRecentEvents, getPredictionSummary, getImpactSummary, getSolarParameters } from "../../services/api";
import type { CMEEvent, PredictionResult, ImpactRisk, SolarParameter } from "../../types/types";
import { 
  mockTimelineEvents, 
  mockPrediction, 
  mockImpactAssessment, 
  mockSolarParameters 
} from "../../constants/mockData";

import TopTelemetryBar from "./TopTelemetryBar";
import EventCatalogSidebar from "./EventCatalogSidebar";
import ThreeJSRadarVisualizer from "./ThreeJSRadarVisualizer";
import EventDetailsSidebar from "./EventDetailsSidebar";
import TimelineController from "./TimelineController";

export default function EventAnalysisPage() {
  const [events, setEvents] = useState<CMEEvent[]>(mockTimelineEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(mockTimelineEvents[0]?.id || null);
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(mockPrediction);
  const [impact, setImpact] = useState<ImpactRisk | null>(mockImpactAssessment);
  const [solarParams, setSolarParams] = useState<SolarParameter[]>(mockSolarParameters);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    async function loadData() {
      setSyncing(true);
      try {
        const evs = await getRecentEvents(10);
        if (evs && evs.length > 0) {
          setEvents(evs);
          if (!selectedEventId) {
            setSelectedEventId(evs[0].id);
          }
        }
        
        const [pred, imp, params] = await Promise.all([
          getPredictionSummary(),
          getImpactSummary(),
          getSolarParameters()
        ]);

        if (pred) setPrediction(pred);
        if (imp) setImpact(imp);
        if (params && params.length > 0) setSolarParams(params);
      } catch (error) {
        console.error("Failed to load event analysis data", error);
      } finally {
        setSyncing(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [selectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  return (
    // Assuming the parent adds some padding, negative margins help it go edge-to-edge
    // If not, they are harmless inside a flex container with overflow hidden.
    <div className="absolute inset-0 flex flex-col bg-[#050B14] overflow-hidden text-slate-300">
      <TopTelemetryBar params={solarParams} prediction={prediction} syncing={syncing} />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <EventCatalogSidebar 
          events={events} 
          selectedEventId={selectedEventId} 
          onSelectEvent={setSelectedEventId} 
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <ThreeJSRadarVisualizer events={events} />
          <TimelineController />
        </div>
        
        <EventDetailsSidebar 
          event={selectedEvent} 
          prediction={prediction} 
          impact={impact} 
        />
      </div>
    </div>
  );
}
