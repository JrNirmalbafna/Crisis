import { SUN_X, SUN_Y, EARTH_X, EARTH_Y } from "./constants";

export function SunEarthAxis() {
  return (
    <g className="sun-earth-axis">
      {/* SUN_EARTH_PATH: CME marker will be positioned along this line via interpolation in a later step */}
      <line
        x1={SUN_X}
        y1={SUN_Y}
        x2={EARTH_X}
        y2={EARTH_Y}
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1"
        strokeDasharray="4 4"
        className="pointer-events-none"
      />
    </g>
  );
}
