import { createContext, useContext, useState, type ReactNode } from "react";

type ThreatLevel = "Normal" | "High" | "Critical";

interface OperationalContextType {
  isOverrideEnabled: boolean;
  setOverrideEnabled: (val: boolean) => void;
  manualThreatLevel: ThreatLevel;
  setManualThreatLevel: (val: ThreatLevel) => void;
  kpThreshold: number;
  setKpThreshold: (val: number) => void;
}

const OperationalContext = createContext<OperationalContextType | undefined>(undefined);

export function OperationalProvider({ children }: { children: ReactNode }) {
  const [isOverrideEnabled, setOverrideEnabled] = useState(false);
  const [manualThreatLevel, setManualThreatLevel] = useState<ThreatLevel>("Critical");
  const [kpThreshold, setKpThreshold] = useState(5);

  return (
    <OperationalContext.Provider 
      value={{
        isOverrideEnabled,
        setOverrideEnabled,
        manualThreatLevel,
        setManualThreatLevel,
        kpThreshold,
        setKpThreshold
      }}
    >
      {children}
    </OperationalContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useOperational() {
  const context = useContext(OperationalContext);
  if (context === undefined) {
    throw new Error("useOperational must be used within an OperationalProvider");
  }
  return context;
}
