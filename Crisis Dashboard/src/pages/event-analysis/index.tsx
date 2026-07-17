import { Zap } from "lucide-react";
import PagePlaceholder from "../../components/PagePlaceholder";

export default function EventAnalysisPage() {
  return (
    <PagePlaceholder
      title="Event Analysis"
      description="Deep-dive CME event inspector. Propagation modelling, impact timelines, domain risk breakdowns (power grids, satellites, HF comms, aviation, GPS), and expert annotation tools."
      Icon={Zap}
      accentColor="#F59E0B"
    />
  );
}
