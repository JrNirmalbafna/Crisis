import { Satellite } from "lucide-react";
import PagePlaceholder from "../../components/PagePlaceholder";

export default function DataFusionPage() {
  return (
    <PagePlaceholder
      title="Data Fusion"
      description="Multi-satellite data aggregation and fusion layer. Cross-correlate solar wind measurements from Aditya-L1, SOHO, DSCOVR, and GOES for comprehensive heliospheric situational awareness."
      Icon={Satellite}
      accentColor="#06B6D4"
    />
  );
}
