import { BrainCircuit } from "lucide-react";
import PagePlaceholder from "../../components/PagePlaceholder";

export default function AIExplainabilityPage() {
  return (
    <PagePlaceholder
      title="AI Explainability"
      description="SHAP values, attention weights, and feature importance visualizations for all AI model predictions. Understand how the Helios ensemble reaches its geomagnetic storm forecasts."
      Icon={BrainCircuit}
      accentColor="#8B5CF6"
    />
  );
}
