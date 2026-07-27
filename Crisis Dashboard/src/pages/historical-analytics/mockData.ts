export interface MonthlyData {
  month: string;
  timestamp: number;
  cmeCount: number;
  avgKpIndex: number;
  severeStorms: number;
}

export interface HistoricalCME {
  id: string;
  date: string;
  speed: number;
  angularWidth: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  kpIndex: number;
}

export function generate15YearData(): {
  monthlyTrends: MonthlyData[];
  events: HistoricalCME[];
  kpis: { totalCMEs: number; severeStorms: number; avgSpeed: number; maxKp: number };
} {
  const monthlyTrends: MonthlyData[] = [];
  const events: HistoricalCME[] = [];
  
  let totalCMEs = 0;
  let severeStorms = 0;
  let speedSum = 0;
  let maxKp = 0;
  let totalEventCount = 0;

  // 15 years = 180 months. 2011 to 2026.
  const startYear = 2011;
  const endYear = 2025; // 15 years inclusive
  
  // Solar cycle 24 peaked around 2014. Solar cycle 25 peaking around 2024.
  // We'll use a double-sine wave function to simulate the 11-year solar cycles
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const timeInYears = year + (month / 12);
      
      // Solar cycle approximation (11 year cycle, peaks at 2014 and 2025)
      const cyclePhase = ((timeInYears - 2003) / 11) * Math.PI * 2;
      const activityLevel = (Math.cos(cyclePhase) * -0.5 + 0.5); // 0 to 1
      
      // Add some random noise
      const noise = Math.random() * 0.3;
      const finalActivity = Math.max(0, activityLevel * 0.8 + noise);
      
      const cmeCount = Math.floor(finalActivity * 30); // 0 to 30 CMEs a month
      const avgKpIndex = 1 + (finalActivity * 5); // 1 to 6
      
      let severeCount = 0;
      
      // Generate some individual events for this month
      for (let i = 0; i < cmeCount; i++) {
        // Only keep a sample of events to not overload the scatter plot / table
        if (Math.random() > 0.8) {
          const isSevere = Math.random() < (finalActivity * 0.2);
          const speed = isSevere ? 800 + Math.random() * 1200 : 300 + Math.random() * 500;
          const width = isSevere ? 180 + Math.random() * 180 : 30 + Math.random() * 100;
          const kp = isSevere ? 7 + Math.random() * 2 : 2 + Math.random() * 4;
          
          if (kp > maxKp) maxKp = kp;
          if (kp >= 7) {
             severeCount++;
             severeStorms++;
          }
          
          let severity: "low" | "medium" | "high" | "critical" = "low";
          if (kp >= 8) severity = "critical";
          else if (kp >= 6) severity = "high";
          else if (kp >= 4) severity = "medium";
          
          events.push({
            id: `evt-${year}-${month}-${i}`,
            date: new Date(year, month, Math.floor(Math.random() * 28) + 1).toISOString(),
            speed: Math.round(speed),
            angularWidth: Math.round(width),
            type: width > 180 ? "Halo CME" : "Partial CME",
            severity,
            kpIndex: Number(kp.toFixed(1))
          });
          
          speedSum += speed;
          totalEventCount++;
        }
      }
      
      totalCMEs += cmeCount;
      
      monthlyTrends.push({
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        timestamp: date.getTime(),
        cmeCount,
        avgKpIndex: Number(avgKpIndex.toFixed(1)),
        severeStorms: severeCount
      });
    }
  }

  return {
    monthlyTrends,
    events: events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    kpis: {
      totalCMEs,
      severeStorms,
      avgSpeed: totalEventCount > 0 ? Math.round(speedSum / totalEventCount) : 0,
      maxKp: Number(maxKp.toFixed(1))
    }
  };
}
