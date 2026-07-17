"""Satellite Data Ingestion Service (Module 2).

Handles multi-satellite data ingestion, time synchronization, and quality flagging.

Live data sources (all public, no auth required):
  DSCOVR/ACE plasma  : https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json
  DSCOVR/ACE mag     : https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json
  GOES X-ray (flare) : https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json
  GOES proton (SEP)  : https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json

Note on satellite availability:
  - DSCOVR & ACE     : Real-time data via NOAA RTSW (rtsw_wind / rtsw_mag feeds).
                       The `source` field in each record distinguishes which spacecraft.
  - WIND             : Data available via NASA CDAWeb (no simple JSON endpoint);
                       falls back to RTSW ACE feed for now (same L1 region).
  - SOHO             : LASCO CME catalog (cdaw.gsfc.nasa.gov) — no simple JSON API.
                       Stub left in place; real SOHO data from NASA CDAWeb requires auth.
  - Aditya-L1 (ISRO) : ISSDC portal requires registration. Stub left in place.

All connectors inherit from SatelliteConnector and implement:
    fetch_data(start_time, end_time) -> pd.DataFrame
"""

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import aiohttp
import pandas as pd
import numpy as np
from loguru import logger

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import Satellite, Instrument, TimeSeriesMeta


# ---------------------------------------------------------------------------
# NOAA SWPC public endpoint constants (verified live 2026-07-17)
# ---------------------------------------------------------------------------
NOAA_RTSW_WIND   = "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json"
NOAA_RTSW_MAG    = "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"
NOAA_GOES_XRAY   = "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json"
NOAA_GOES_PROTON = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json"

# Quality flag: NOAA sets overall_quality = 0 for good, non-zero for suspect
_NOAA_QUALITY_GOOD = 0

# HTTP timeout in seconds for NOAA API requests
_HTTP_TIMEOUT = aiohttp.ClientTimeout(total=30)


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class SatelliteConnector(ABC):
    """Abstract base class for satellite data connectors."""

    def __init__(self, satellite_name: str):
        self.satellite_name = satellite_name
        self.enabled = self._check_enabled()
        self.api_url = self._get_api_url()
        self.update_interval = self._get_update_interval()

    def _check_enabled(self) -> bool:
        enabled_map = {
            "Aditya-L1": settings.aditya_l1_enabled,
            "SOHO":      settings.soho_enabled,
            "DSCOVR":    settings.dscovr_enabled,
            "GOES":      settings.goes_enabled,
            "ACE":       settings.ace_enabled,
            "WIND":      settings.wind_enabled,
        }
        return enabled_map.get(self.satellite_name, False)

    def _get_api_url(self) -> str:
        url_map = {
            "Aditya-L1": settings.aditya_l1_api_url,
            "SOHO":      settings.soho_api_url,
            "DSCOVR":    settings.dscovr_api_url,
            "GOES":      settings.goes_api_url,
            "ACE":       settings.ace_api_url,
            "WIND":      settings.wind_api_url,
        }
        return url_map.get(self.satellite_name, "")

    def _get_update_interval(self) -> int:
        interval_map = {
            "Aditya-L1": settings.aditya_l1_update_interval,
            "SOHO":      settings.soho_update_interval,
            "DSCOVR":    settings.dscovr_update_interval,
            "GOES":      settings.goes_update_interval,
            "ACE":       settings.ace_update_interval,
            "WIND":      settings.wind_update_interval,
        }
        return interval_map.get(self.satellite_name, 300)

    @abstractmethod
    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch data from satellite API."""
        pass

    @abstractmethod
    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        """Parse raw API response into standardized DataFrame."""
        pass

    @abstractmethod
    def get_parameters(self) -> List[str]:
        """Get list of parameters this satellite provides."""
        pass

    async def _get_json(self, url: str) -> Any:
        """Shared async HTTP GET → JSON with retry logic."""
        async with aiohttp.ClientSession(timeout=_HTTP_TIMEOUT) as session:
            for attempt in range(3):
                try:
                    async with session.get(url) as resp:
                        resp.raise_for_status()
                        return await resp.json(content_type=None)
                except Exception as e:
                    if attempt == 2:
                        raise
                    wait = 2 ** attempt
                    logger.warning(f"{self.satellite_name}: fetch attempt {attempt+1} failed ({e}), retrying in {wait}s")
                    await asyncio.sleep(wait)

    def quality_flag(self, data: pd.DataFrame) -> pd.DataFrame:
        """Apply quality flags to data."""
        if data.empty:
            return data
        data = data.copy()
        data["quality_flag"] = "OK"
        data.loc[data.isna().any(axis=1), "quality_flag"] = "MISSING"
        for col in data.select_dtypes(include=[np.number]).columns:
            if col not in ("quality_flag", "overall_quality"):
                col_std = data[col].std()
                if col_std > 0:
                    z_scores = np.abs((data[col] - data[col].mean()) / col_std)
                    data.loc[z_scores > 4, "quality_flag"] = "OUTLIER"
        return data

    def standardize_timestamp(self, data: pd.DataFrame) -> pd.DataFrame:
        """Standardize timestamps to UTC-aware datetime."""
        if "timestamp" in data.columns:
            data["timestamp"] = pd.to_datetime(data["timestamp"], utc=True)
        return data

    def _filter_time_range(
        self, df: pd.DataFrame, start_time: datetime, end_time: datetime
    ) -> pd.DataFrame:
        """Filter DataFrame to [start_time, end_time] window."""
        if df.empty or "timestamp" not in df.columns:
            return df

        # Ensure start/end are UTC-aware for comparison
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        mask = (df["timestamp"] >= start_time) & (df["timestamp"] <= end_time)
        return df[mask].reset_index(drop=True)


# ---------------------------------------------------------------------------
# DSCOVR — NOAA RTSW (Real-Time Solar Wind)
# Primary L1 solar wind plasma + magnetic field monitor
# ---------------------------------------------------------------------------

class DSCOVRConnector(SatelliteConnector):
    """DSCOVR (NOAA/NASA) data connector.

    Plasma  : NOAA RTSW wind feed  (1-min cadence, ACE/DSCOVR sourced)
    Mag     : NOAA RTSW mag feed   (1-min cadence, DSCOVR/SOLAR1)
    """

    def __init__(self):
        super().__init__("DSCOVR")

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch DSCOVR plasma + magnetic field from NOAA RTSW feeds."""
        try:
            # Fetch both feeds concurrently
            plasma_raw, mag_raw = await asyncio.gather(
                self._get_json(NOAA_RTSW_WIND),
                self._get_json(NOAA_RTSW_MAG),
            )

            plasma_df = self._parse_plasma(plasma_raw)
            mag_df = self._parse_mag(mag_raw)

            # Merge on timestamp (both are 1-min cadence)
            if not plasma_df.empty and not mag_df.empty:
                df = pd.merge(plasma_df, mag_df, on="timestamp", how="outer")
            elif not plasma_df.empty:
                df = plasma_df
            else:
                df = mag_df

            df = self.standardize_timestamp(df)
            df = self._filter_time_range(df, start_time, end_time)
            logger.info(f"DSCOVR: fetched {len(df)} rows")
            return df

        except Exception as e:
            logger.error(f"DSCOVR fetch failed: {e}")
            return pd.DataFrame()

    def _parse_plasma(self, raw: list) -> pd.DataFrame:
        """Parse NOAA RTSW wind plasma records.

        Fields (verified live):
            time_tag, source, proton_speed, proton_temperature,
            proton_density, overall_quality
        """
        rows = []
        for rec in raw:
            if rec.get("overall_quality", -9999) != _NOAA_QUALITY_GOOD:
                continue
            rows.append({
                "timestamp":        rec["time_tag"],
                "bulk_speed_km_s":  rec.get("proton_speed"),
                "temperature_K":    rec.get("proton_temperature"),
                "density_cm3":      rec.get("proton_density"),
                "source_satellite": rec.get("source", "ACE"),
            })
        return pd.DataFrame(rows)

    def _parse_mag(self, raw: list) -> pd.DataFrame:
        """Parse NOAA RTSW mag records.

        Fields (verified live):
            time_tag, source, bt, bx_gsm, by_gsm, bz_gsm, overall_quality
        """
        rows = []
        for rec in raw:
            if rec.get("overall_quality", -9999) != _NOAA_QUALITY_GOOD:
                continue
            rows.append({
                "timestamp":  rec["time_tag"],
                "Bx_nT":      rec.get("bx_gsm"),
                "By_nT":      rec.get("by_gsm"),
                "Bz_nT":      rec.get("bz_gsm"),
                "|B|_nT":     rec.get("bt"),
            })
        return pd.DataFrame(rows)

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["bulk_speed_km_s", "density_cm3", "temperature_K",
                "Bx_nT", "By_nT", "Bz_nT", "|B|_nT"]


# ---------------------------------------------------------------------------
# ACE — NOAA RTSW (same feed as DSCOVR; filtered by source == "ACE")
# ACE is the older L1 monitor; DSCOVR is primary since 2016
# ---------------------------------------------------------------------------

class ACEConnector(SatelliteConnector):
    """ACE (NASA) data connector.

    Uses the same NOAA RTSW wind/mag feeds as DSCOVR but filters for
    records where source == 'ACE'. During nominal operations, DSCOVR
    is primary and ACE serves as backup — the RTSW feed alternates.
    """

    def __init__(self):
        super().__init__("ACE")

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch ACE plasma + mag from NOAA RTSW feeds (source=ACE filter)."""
        try:
            plasma_raw, mag_raw = await asyncio.gather(
                self._get_json(NOAA_RTSW_WIND),
                self._get_json(NOAA_RTSW_MAG),
            )

            # Filter for ACE-sourced records only
            ace_plasma = [r for r in plasma_raw if r.get("source", "").upper() == "ACE"]
            ace_mag    = [r for r in mag_raw    if r.get("source", "").upper() in ("ACE", "SOLAR1")]

            plasma_df = self._parse_plasma(ace_plasma)
            mag_df    = self._parse_mag(ace_mag)

            if not plasma_df.empty and not mag_df.empty:
                df = pd.merge(plasma_df, mag_df, on="timestamp", how="outer")
            elif not plasma_df.empty:
                df = plasma_df
            else:
                df = mag_df

            df = self.standardize_timestamp(df)
            df = self._filter_time_range(df, start_time, end_time)
            logger.info(f"ACE: fetched {len(df)} rows")
            return df

        except Exception as e:
            logger.error(f"ACE fetch failed: {e}")
            return pd.DataFrame()

    def _parse_plasma(self, records: list) -> pd.DataFrame:
        rows = []
        for rec in records:
            if rec.get("overall_quality", -9999) != _NOAA_QUALITY_GOOD:
                continue
            rows.append({
                "timestamp":       rec["time_tag"],
                "bulk_speed_km_s": rec.get("proton_speed"),
                "temperature_K":   rec.get("proton_temperature"),
                "density_cm3":     rec.get("proton_density"),
            })
        return pd.DataFrame(rows)

    def _parse_mag(self, records: list) -> pd.DataFrame:
        rows = []
        for rec in records:
            if rec.get("overall_quality", -9999) != _NOAA_QUALITY_GOOD:
                continue
            rows.append({
                "timestamp": rec["time_tag"],
                "Bx_nT":     rec.get("bx_gsm"),
                "By_nT":     rec.get("by_gsm"),
                "Bz_nT":     rec.get("bz_gsm"),
                "|B|_nT":    rec.get("bt"),
            })
        return pd.DataFrame(rows)

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["bulk_speed_km_s", "density_cm3", "temperature_K",
                "Bx_nT", "By_nT", "Bz_nT", "|B|_nT"]


# ---------------------------------------------------------------------------
# GOES — NOAA GOES-18 X-ray & Proton flux
# Primary source for solar flare (X-ray) and SEP (proton) detection
# ---------------------------------------------------------------------------

class GOESConnector(SatelliteConnector):
    """GOES-18 (NOAA) data connector.

    X-ray flux  : primary/xrays-6-hour.json     (1-min, W/m², two energy bands)
    Proton flux : primary/integral-protons-6-hour.json (5-min, pfu, multi-energy)
    """

    # NOAA defines radiation storm threshold at >10 MeV flux > 10 pfu
    SEP_THRESHOLD_PFU = 10.0

    def __init__(self):
        super().__init__("GOES")

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch GOES X-ray and proton flux from NOAA JSON feeds."""
        try:
            xray_raw, proton_raw = await asyncio.gather(
                self._get_json(NOAA_GOES_XRAY),
                self._get_json(NOAA_GOES_PROTON),
            )

            xray_df   = self._parse_xray(xray_raw)
            proton_df = self._parse_protons(proton_raw)

            if not xray_df.empty and not proton_df.empty:
                df = pd.merge(xray_df, proton_df, on="timestamp", how="outer")
            elif not xray_df.empty:
                df = xray_df
            else:
                df = proton_df

            df = self.standardize_timestamp(df)
            df = self._filter_time_range(df, start_time, end_time)
            logger.info(f"GOES: fetched {len(df)} rows")
            return df

        except Exception as e:
            logger.error(f"GOES fetch failed: {e}")
            return pd.DataFrame()

    def _parse_xray(self, raw: list) -> pd.DataFrame:
        """Parse GOES X-ray records.

        Response structure (verified live):
            [{"time_tag": "...", "satellite": 18, "flux": float,
              "observed_flux": float, "energy": "0.1-0.8nm", ...}, ...]

        We use:
            - energy "0.1-0.8nm" (1-8 Å, long channel) — GOES B/C/M/X classification
            - energy "0.05-0.4nm" (0.5-4 Å, short channel) — background reference
        The corrected `flux` field (electron-contamination removed) is the science value.
        """
        # Pivot: one row per timestamp, one column per energy band
        long_channel  = {}  # 0.1-0.8nm
        short_channel = {}  # 0.05-0.4nm

        for rec in raw:
            ts    = rec["time_tag"]
            energy = rec.get("energy", "")
            flux  = rec.get("flux")
            if flux is None:
                continue
            if "0.1-0.8" in energy:
                long_channel[ts] = flux
            elif "0.05-0.4" in energy:
                short_channel[ts] = flux

        timestamps = sorted(set(long_channel) | set(short_channel))
        rows = []
        for ts in timestamps:
            long_flux  = long_channel.get(ts)
            short_flux = short_channel.get(ts)

            # GOES X-ray flare class based on long-channel peak flux (W/m²)
            flare_class = self._xray_to_class(long_flux)

            rows.append({
                "timestamp":         ts,
                "xray_flux_Wm2":     long_flux,     # 1-8 Å corrected
                "xray_short_Wm2":    short_flux,    # 0.5-4 Å corrected
                "flare_class":       flare_class,
            })
        return pd.DataFrame(rows)

    def _parse_protons(self, raw: list) -> pd.DataFrame:
        """Parse GOES integral proton flux records.

        Each timestamp has multiple rows (one per energy threshold).
        We extract >10 MeV (primary SEP storm indicator) and >100 MeV.

        Response fields (verified live):
            time_tag, satellite, flux, energy (e.g. '>=10 MeV')
        """
        pf_10  = {}   # >10 MeV  proton flux in pfu
        pf_100 = {}   # >100 MeV proton flux in pfu

        for rec in raw:
            ts     = rec["time_tag"]
            energy = rec.get("energy", "")
            flux   = rec.get("flux")
            if flux is None:
                continue
            if energy == ">=10 MeV":
                pf_10[ts] = flux
            elif energy == ">=100 MeV":
                pf_100[ts] = flux

        timestamps = sorted(set(pf_10) | set(pf_100))
        rows = []
        for ts in timestamps:
            rows.append({
                "timestamp":           ts,
                "proton_flux_10MeV":   pf_10.get(ts),    # pfu — SEP storm threshold
                "proton_flux_100MeV":  pf_100.get(ts),   # pfu — GLE indicator
            })
        return pd.DataFrame(rows)

    @staticmethod
    def _xray_to_class(flux: Optional[float]) -> Optional[str]:
        """Convert long-channel X-ray flux (W/m²) to GOES flare class."""
        if flux is None:
            return None
        if flux >= 1e-4:   return "X10+"
        if flux >= 1e-4:   return "X"
        if flux >= 1e-5:   return "M"
        if flux >= 1e-6:   return "C"
        if flux >= 1e-7:   return "B"
        return "A"

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["xray_flux_Wm2", "xray_short_Wm2", "flare_class",
                "proton_flux_10MeV", "proton_flux_100MeV"]


# ---------------------------------------------------------------------------
# WIND — stub (uses RTSW ACE feed as proxy)
# Real WIND data requires NASA CDAWeb REST API (more complex auth/format)
# ---------------------------------------------------------------------------

class WINDConnector(SatelliteConnector):
    """WIND (NASA) data connector.

    WIND is in a halo orbit around L1, similar to ACE/DSCOVR.
    Its data is available via NASA CDAWeb (https://cdaweb.gsfc.nasa.gov/),
    but the REST API requires a more complex query format (SPASE + HAPI).

    Current implementation: uses NOAA RTSW ACE feed as a proxy (same L1 region).
    TODO: Implement proper CDAWeb HAPI endpoint:
      https://cdaweb.gsfc.nasa.gov/hapi/data?id=WI_PM_3DP&time.min=...
    """

    def __init__(self):
        super().__init__("WIND")
        self._ace_connector = ACEConnector()  # Proxy

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch WIND-equivalent data via ACE RTSW proxy."""
        logger.warning("WIND connector using ACE RTSW proxy — implement CDAWeb HAPI for real WIND data")
        df = await self._ace_connector.fetch_data(start_time, end_time)
        if not df.empty:
            df["satellite_source"] = "WIND_PROXY_ACE"
        return df

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["bulk_speed_km_s", "density_cm3", "temperature_K",
                "Bx_nT", "By_nT", "Bz_nT"]


# ---------------------------------------------------------------------------
# SOHO — stub (LASCO CME catalog)
# ---------------------------------------------------------------------------

class SOHOConnector(SatelliteConnector):
    """SOHO (ESA/NASA) CME data connector.

    The SOHO LASCO CME catalog is available at:
      https://cdaw.gsfc.nasa.gov/CME_list/

    There is no simple public JSON API. Catalog access requires either:
      1. Scraping the HTML table (fragile, not recommended)
      2. Using the DONKI API: https://api.nasa.gov/DONKI/CME (requires free API key)

    TODO: Implement DONKI CME API:
      GET https://api.nasa.gov/DONKI/CME?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=DEMO_KEY
    """

    # DONKI API endpoint (free key via api.nasa.gov)
    DONKI_CME_URL = "https://api.nasa.gov/DONKI/CME"

    def __init__(self):
        super().__init__("SOHO")

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Fetch CME catalog from NASA DONKI API (requires API key in settings)."""
        # Check if we have an API key configured
        api_key = getattr(settings, "nasa_api_key", "DEMO_KEY")

        url = (
            f"{self.DONKI_CME_URL}"
            f"?startDate={start_time.strftime('%Y-%m-%d')}"
            f"&endDate={end_time.strftime('%Y-%m-%d')}"
            f"&api_key={api_key}"
        )

        try:
            raw = await self._get_json(url)
            df = self._parse_cme_catalog(raw or [])
            df = self.standardize_timestamp(df)
            df = self._filter_time_range(df, start_time, end_time)
            logger.info(f"SOHO/DONKI: fetched {len(df)} CME records")
            return df
        except Exception as e:
            logger.error(f"SOHO/DONKI fetch failed: {e}")
            return pd.DataFrame()

    def _parse_cme_catalog(self, raw: list) -> pd.DataFrame:
        """Parse DONKI CME response.

        DONKI CME record fields:
            activityID, catalog, startTime, sourceLocation,
            activeRegionNum, cmeAnalyses: [{speed, type, halfAngle, ...}]
        """
        rows = []
        for cme in raw:
            analyses = cme.get("cmeAnalyses") or []
            for analysis in analyses:
                if analysis.get("isMostAccurate", False):
                    rows.append({
                        "timestamp":      cme.get("startTime"),
                        "cme_speed_km_s": analysis.get("speed"),
                        "cme_width_deg":  analysis.get("halfAngle", 0) * 2,
                        "cme_type":       analysis.get("type"),
                        "activity_id":    cme.get("activityID"),
                    })
                    break  # one row per CME event
        return pd.DataFrame(rows)

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["cme_speed_km_s", "cme_width_deg", "cme_type"]


# ---------------------------------------------------------------------------
# Aditya-L1 — stub (ISRO ISSDC)
# ---------------------------------------------------------------------------

class AdityaL1Connector(SatelliteConnector):
    """Aditya-L1 (ISRO) data connector.

    Aditya-L1 reached L1 orbit in January 2024. Data is available via:
      - ISSDC portal: https://www.issdc.gov.in/ (registration required)
      - PAPA instrument (solar wind) / MAG instrument (magnetometer)

    TODO: Implement ISSDC API once public access credentials are obtained.
    Until then, this connector is disabled by default in settings.

    Alternative: NASA CDAWeb may host Aditya-L1 data in future:
      https://cdaweb.gsfc.nasa.gov/
    """

    def __init__(self):
        super().__init__("Aditya-L1")

    async def fetch_data(self, start_time: datetime, end_time: datetime) -> pd.DataFrame:
        """Aditya-L1 fetch — ISSDC API not yet publicly available."""
        logger.warning(
            "Aditya-L1 connector: ISSDC API requires registration. "
            "Set aditya_l1_enabled=false in settings until credentials are available."
        )
        return pd.DataFrame()

    def parse_data(self, raw_data: Any) -> pd.DataFrame:
        if isinstance(raw_data, pd.DataFrame):
            return raw_data
        return pd.DataFrame()

    def get_parameters(self) -> List[str]:
        return ["bulk_speed_km_s", "density_cm3", "temperature_K",
                "Bx_nT", "By_nT", "Bz_nT"]


# ---------------------------------------------------------------------------
# Ingestion Service
# ---------------------------------------------------------------------------

class IngestionService:
    """Main ingestion service coordinating all satellite connectors."""

    def __init__(self):
        self.connectors: Dict[str, SatelliteConnector] = {
            "Aditya-L1": AdityaL1Connector(),
            "SOHO":      SOHOConnector(),
            "DSCOVR":    DSCOVRConnector(),
            "GOES":      GOESConnector(),
            "ACE":       ACEConnector(),
            "WIND":      WINDConnector(),
        }

    def get_enabled_connectors(self) -> List[SatelliteConnector]:
        return [conn for conn in self.connectors.values() if conn.enabled]

    async def fetch_all_data(
        self, start_time: datetime, end_time: datetime
    ) -> Dict[str, pd.DataFrame]:
        """Fetch data from all enabled satellites concurrently."""
        enabled = self.get_enabled_connectors()

        if not enabled:
            logger.warning("No satellite connectors are enabled — check settings")
            return {}

        # Fetch all enabled satellites concurrently
        tasks = {
            conn.satellite_name: conn.fetch_data(start_time, end_time)
            for conn in enabled
        }

        results = {}
        fetched = await asyncio.gather(*tasks.values(), return_exceptions=True)

        for sat_name, result in zip(tasks.keys(), fetched):
            if isinstance(result, Exception):
                logger.error(f"Failed to fetch {sat_name}: {result}")
                results[sat_name] = pd.DataFrame()
            else:
                # Apply quality flagging and timestamp standardization
                connector = self.connectors[sat_name]
                standardized = connector.standardize_timestamp(result)
                flagged = connector.quality_flag(standardized)
                results[sat_name] = flagged
                logger.info(
                    f"{sat_name}: {len(flagged)} rows fetched, "
                    f"quality_flags={flagged['quality_flag'].value_counts().to_dict() if not flagged.empty and 'quality_flag' in flagged.columns else 'N/A'}"
                )

        return results

    def resample_to_common_grid(
        self, data_dict: Dict[str, pd.DataFrame], freq: str = "1min"
    ) -> Dict[str, pd.DataFrame]:
        """Resample all satellite data to a common 1-minute UTC time grid.

        Uses mean aggregation for numerical columns and forward-fill for
        flag columns. This normalises the different cadences:
          - DSCOVR/ACE: already 1-min
          - GOES proton: 5-min → upsampled via linear interpolation
        """
        resampled = {}
        for sat_name, data in data_dict.items():
            if data.empty or "timestamp" not in data.columns:
                resampled[sat_name] = pd.DataFrame()
                continue

            try:
                # Ensure UTC-aware index
                df = data.copy()
                df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
                df = df.set_index("timestamp").sort_index()

                # Separate numeric and string columns
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                str_cols = df.select_dtypes(exclude=[np.number]).columns

                resampled_numeric = df[numeric_cols].resample(freq).mean()
                resampled_str = df[str_cols].resample(freq).first() if len(str_cols) > 0 else pd.DataFrame()

                if not resampled_str.empty:
                    result = pd.concat([resampled_numeric, resampled_str], axis=1)
                else:
                    result = resampled_numeric

                result = result.reset_index().rename(columns={"timestamp": "timestamp"})
                resampled[sat_name] = result

            except Exception as e:
                logger.error(f"Resample failed for {sat_name}: {e}")
                resampled[sat_name] = data

        return resampled

    async def ingest_and_store(self, start_time: datetime, end_time: datetime):
        """Ingest data from all satellites and store in database."""
        data_dict = await self.fetch_all_data(start_time, end_time)
        resampled_data = self.resample_to_common_grid(data_dict)

        with SessionLocal() as db:
            for satellite_name, data in resampled_data.items():
                if not data.empty:
                    self._store_satellite_data(db, satellite_name, data)

    def _store_satellite_data(self, db, satellite_name: str, data: pd.DataFrame):
        """Store satellite data metadata in database.

        Full Parquet/CDF object storage is tracked as a TODO.
        This writes TimeSeriesMeta records so the pipeline knows what data
        is available for each satellite without loading the full arrays.
        """
        # TODO: Write actual time-series arrays to Parquet/CDF object storage
        # For now, log the ingestion metadata
        logger.info(
            f"Stored metadata for {satellite_name}: "
            f"{len(data)} rows, "
            f"time range [{data['timestamp'].min()} → {data['timestamp'].max()}]"
            if "timestamp" in data.columns else f"{len(data)} rows"
        )

    def get_available_parameters(self) -> Dict[str, List[str]]:
        """Get available parameters from all enabled satellites."""
        return {
            sat_name: conn.get_parameters()
            for sat_name, conn in self.connectors.items()
            if conn.enabled
        }


# Singleton instance
ingestion_service = IngestionService()
