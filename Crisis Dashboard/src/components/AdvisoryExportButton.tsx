import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getSystemStatusOverview, getMissionStatus, getPredictionSummary } from "../services/api";

export default function AdvisoryExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const generateAdvisory = async () => {
    setIsExporting(true);
    try {
      const [overview, mission, prediction] = await Promise.all([
        getSystemStatusOverview(),
        getMissionStatus(),
        getPredictionSummary()
      ]);

      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const advisoryId = `SWPC-ADV-${Math.floor(Math.random() * 90000) + 10000}`;

      const textContent = `
========================================================================
SPACE WEATHER PREDICTION CENTER ADVISORY BULLETIN
========================================================================
Message ID: ${advisoryId}
Date/Time Issued: ${timestamp}
Source: Helios Intelligence Mission Control

1. CURRENT CONDITIONS
------------------------------------------------------------------------
Global Alert Level: ${overview.alertLevel.toUpperCase()}
System Status: ${overview.statusText.toUpperCase()}
AI Confidence: ${overview.aiConfidence}%
Physics Validation: ${overview.physicsValidation}

2. TELEMETRY & SENSOR HEALTH
------------------------------------------------------------------------
Active Satellites: ${mission.activeSatellites}/${mission.totalSatellites}
Data Quality: ${overview.dataQuality}%
Mission Health: ${mission.systemHealth.toUpperCase()}

3. EVENT PREDICTION
------------------------------------------------------------------------
Predicted Kp Index: ${prediction?.kpIndex ?? "N/A"}
Forecast Horizon: +${prediction?.horizonHours ?? 0} Hours
Storm Probability: ${prediction ? Math.round(prediction.stormProbability * 100) : 0}%
AI Uncertainty: ${prediction?.uncertainty ?? "N/A"}

4. OPERATIONAL ADVICE
------------------------------------------------------------------------
Aviation: Check HF propagation conditions for polar routes.
Power Grid: Monitor GIC geomagnetically induced currents.
Satellites: Prepare for potential surface charging and drag variations.

========================================================================
END OF ADVISORY
========================================================================
`;

      const blob = new Blob([textContent.trim()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${advisoryId}_Advisory.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Failed to generate advisory", error);
      alert("Error generating advisory bulletin.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generateAdvisory}
      disabled={isExporting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all duration-200 disabled:opacity-50"
      title="Export Official Advisory Bulletin"
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      <span className="hidden md:inline text-xs font-semibold tracking-wide uppercase">Export Advisory</span>
    </button>
  );
}
