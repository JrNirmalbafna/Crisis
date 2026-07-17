import { BarChart3 } from "lucide-react";
import PagePlaceholder from "../../components/PagePlaceholder";

export default function HistoricalAnalyticsPage() {
  return (
    <PagePlaceholder
      title="Historical Analytics"
      description="Longitudinal analysis of past CME events, geomagnetic storm trends, Kp/Dst index history, and model prediction accuracy benchmarks. Query and visualize decades of space weather data."
      Icon={BarChart3}
      accentColor="#10B981"
    />
  );
}
