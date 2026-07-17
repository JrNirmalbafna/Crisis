/**
 * Linearly interpolates a position between a start and end point.
 * @param startX X coordinate of start point (progress = 0)
 * @param startY Y coordinate of start point
 * @param endX X coordinate of end point (progress = 100)
 * @param endY Y coordinate of end point
 * @param progress Value from 0 to 100
 * @returns { x, y } interpolated coordinates
 */
export function interpolatePosition(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  progress: number
): { x: number; y: number } {
  // Clamp progress between 0 and 100
  const t = Math.max(0, Math.min(100, progress)) / 100;
  
  return {
    x: startX + (endX - startX) * t,
    y: startY + (endY - startY) * t,
  };
}
