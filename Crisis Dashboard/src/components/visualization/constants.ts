// ─────────────────────────────────────────────────────────────────────────────
// Space Weather Visualization Constants
// ─────────────────────────────────────────────────────────────────────────────

// SVG Canvas Dimensions (designed to scale cleanly with preserveAspectRatio)
export const VIEWBOX_WIDTH = 1000;
export const VIEWBOX_HEIGHT = 400;

// Sun Position (Left Side)
export const SUN_X = 150;
export const SUN_Y = 200;
export const SUN_RADIUS = 32;

// Earth Position (Right Side)
export const EARTH_X = 850;
export const EARTH_Y = 200;
export const EARTH_RADIUS = 8;
export const GOES_ORBIT_RADIUS = 28;

// ── Satellite Marker Positions ────────────────────────────────────────────────

// L1 is visually ~1/6th of the way from Earth to Sun
const distance = EARTH_X - SUN_X; // 700
export const L1_X = EARTH_X - (distance / 6); // 850 - 116.66 = 733.33
export const L1_Y = 200;

// Specific offsets so they cluster without overlapping
export const SAT_POSITIONS: Record<string, { x: number; y: number }> = {
  "Aditya-L1": { x: L1_X - 9, y: L1_Y - 9 },
  "SOHO":      { x: L1_X + 9, y: L1_Y - 4 },
  "DSCOVR":    { x: L1_X,     y: L1_Y + 11 },
  // GOES sits statically on its orbit ring (top edge for now)
  "GOES-16":   { x: EARTH_X,  y: EARTH_Y - GOES_ORBIT_RADIUS },
};

