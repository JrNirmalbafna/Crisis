// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH: Satellite Descriptive Information
// This file holds facts that never change at runtime (name, agency, role).
// Consumed by Landing page, Mission Control tooltips, and search features.
// ─────────────────────────────────────────────────────────────────────────────

import type { SatelliteInfo } from "../types/types";

export const SATELLITE_INFO: SatelliteInfo[] = [
  {
    id: "Aditya-L1",
    name: "Aditya-L1",
    agency: "ISRO (India)",
    launchYear: 2023,
    role: "India's first solar observation mission, studying the Sun's corona and solar wind from a halo orbit around the L1 Lagrange point.",
    orbitPosition: "L1 Lagrange Point",
  },
  {
    id: "SOHO",
    name: "SOHO",
    agency: "NASA/ESA",
    launchYear: 1995,
    role: "Long-running solar observatory at L1, known for detecting and imaging coronal mass ejections via its LASCO coronagraph.",
    orbitPosition: "L1 Lagrange Point",
  },
  {
    id: "DSCOVR",
    name: "DSCOVR",
    agency: "NASA/NOAA/USAF",
    launchYear: 2015,
    role: "Positioned at L1, provides 15–60 minute early warning of incoming solar wind/CME impact by directly measuring particles as they pass.",
    orbitPosition: "L1 Lagrange Point",
  },
  {
    id: "GOES-16",
    name: "GOES-16",
    agency: "NOAA",
    launchYear: 2016, // GOES-R series (GOES-16) launched in 2016
    role: "Orbits Earth, monitoring space weather effects closer to Earth including solar flares, X-ray flux, and near-Earth conditions.",
    orbitPosition: "Earth Orbit",
  },
];

export const getSatelliteInfoById = (id: string): SatelliteInfo | undefined => {
  return SATELLITE_INFO.find((s) => s.id === id);
};
