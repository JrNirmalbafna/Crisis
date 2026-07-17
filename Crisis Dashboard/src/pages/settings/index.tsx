import { Settings } from "lucide-react";
import PagePlaceholder from "../../components/PagePlaceholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Configure satellite data sources, alert thresholds, notification preferences, API keys, and dashboard display options. Customize your Helios workspace."
      Icon={Settings}
      accentColor="#6B7280"
    />
  );
}
