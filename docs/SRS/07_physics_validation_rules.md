# 7. Physics Validation Rules

**Helios Intelligence / Solar Sentinel AI**  
**Version:** 1.0  
**Module:** 9 — Physics Validation Engine

---

## 7.1 Purpose

This document defines the complete set of physics validation rules (PHY-01 to PHY-52) used by the Physics Validation Engine to assess the physical plausibility of AI predictions. These rules act as a gatekeeper before any automated decision support actions.

**Validation Levels:**
- **PASS**: All rules within acceptable physical bounds
- **SOFT_FAIL**: Minor violations, predictions downgraded but not blocked
- **HARD_FAIL**: Major physical impossibilities, automation disabled

---

## 7.2 Rule Categories

| Category | Rule Range | Focus |
|----------|------------|-------|
| Solar Wind Parameters | PHY-01 to PHY-12 | Speed, density, temperature, dynamic pressure |
| Magnetic Field | PHY-13 to PHY-22 | IMF components, magnitude, orientation |
| CME Properties | PHY-23 to PHY-32 | Speed, angular width, mass, direction |
| Solar Flare Parameters | PHY-33 to PHY-38 | X-ray flux, duration, classification |
| Plasma Physics | PHY-39 to PHY-44 | Plasma beta, Alfvén speed, Mach number |
| Temporal Consistency | PHY-45 to PHY-48 | Gradients, rates of change |
| Cross-Parameter Consistency | PHY-49 to PHY-52 | Relationships between parameters |

---

## 7.3 Solar Wind Parameters (PHY-01 to PHY-12)

### PHY-01: Solar Wind Speed Limits
**Parameter:** Bulk solar wind speed  
**Physical Range:** 250 km/s ≤ v ≤ 3000 km/s  
**Severity:** HARD  
**Check:** `if v < 250 or v > 3000: HARD_FAIL`  
**Rationale:** Below 250 km/s is unusually slow; above 3000 km/s exceeds observed limits

### PHY-02: Solar Wind Density Limits
**Parameter:** Proton density  
**Physical Range:** 0.1 cm⁻³ ≤ n ≤ 100 cm⁻³  
**Severity:** HARD  
**Check:** `if n < 0.1 or n > 100: HARD_FAIL`  
**Rationale:** Below 0.1 is effectively vacuum; above 100 is physically implausible

### PHY-03: Dynamic Pressure Limits
**Parameter:** Dynamic ram pressure Pd = n·v²  
**Physical Range:** 0.1 nPa ≤ Pd ≤ 15 nPa  
**Severity:** HARD  
**Check:** `if Pd < 0.1 or Pd > 15: HARD_FAIL`  
**Rationale:** Extreme values indicate measurement errors or impossible conditions

### PHY-04: Solar Wind Temperature Limits
**Parameter:** Proton temperature  
**Physical Range:** 10⁴ K ≤ T ≤ 10⁷ K  
**Severity:** HARD  
**Check:** `if T < 1e4 or T > 1e7: HARD_FAIL`  
**Rationale:** Solar wind temperature range based on observations

### PHY-05: Speed-Temperature Consistency
**Parameter:** Relationship between speed and temperature  
**Physical Range:** T should correlate with v (high speed → high T)  
**Severity:** SOFT  
**Check:** `if v > 600 and T < 1e5: SOFT_FAIL`  
**Rationale:** Fast solar wind typically has higher temperature

### PHY-06: Density-Speed Anti-Correlation
**Parameter:** Density vs speed relationship  
**Physical Range:** High speed typically has lower density  
**Severity:** SOFT  
**Check:** `if v > 700 and n > 20: SOFT_FAIL`  
**Rationale:** Fast wind from coronal holes is typically tenuous

### PHY-07: Mach Number Limits
**Parameter:** Solar wind Mach number M = v/cs  
**Physical Range:** 3 ≤ M ≤ 20  
**Severity:** SOFT  
**Check:** `if M < 3 or M > 20: SOFT_FAIL`  
**Rationale:** Solar wind is supersonic but not extremely relativistic

### PHY-08: Alfvén Speed Limits
**Parameter:** Alfvén speed vA = B/√(μ₀ρ)  
**Physical Range:** 20 km/s ≤ vA ≤ 200 km/s  
**Severity:** SOFT  
**Check:** `if vA < 20 or vA > 200: SOFT_FAIL`  
**Rationale:** Typical Alfvén speeds in solar wind

### PHY-09: Plasma Beta Limits
**Parameter:** Plasma beta β = plasma pressure / magnetic pressure  
**Physical Range:** 0.1 ≤ β ≤ 10  
**Severity:** SOFT  
**Check:** `if β < 0.1 or β > 10: SOFT_FAIL`  
**Rationale:** Solar wind plasma beta typically in this range

### PHY-10: Specific Entropy Limits
**Parameter:** Specific entropy S = T/n^(γ-1)  
**Physical Range:** 10⁸ K·cm³ ≤ S ≤ 10¹⁰ K·cm³  
**Severity:** SOFT  
**Check:** `if S < 1e8 or S > 1e10: SOFT_FAIL`  
**Rationale:** Entropy range for solar wind plasma

### PHY-11: Oxygen Ion Fraction
**Parameter:** O⁺⁷/O⁺⁶ ratio (temperature proxy)  
**Physical Range:** 0.01 ≤ O⁺⁷/O⁺⁶ ≤ 10  
**Severity:** SOFT  
**Check:** `if ratio < 0.01 or ratio > 10: SOFT_FAIL`  
**Rationale:** Charge state ratios indicate coronal temperature

### PHY-12: Helium Abundance
**Parameter:** He/H ratio  
**Physical Range:** 0.01 ≤ He/H ≤ 0.10  
**Severity:** SOFT  
**Check:** `if He_H < 0.01 or He_H > 0.10: SOFT_FAIL`  
**Rationale:** Typical helium abundance in solar wind

---

## 7.4 Magnetic Field Rules (PHY-13 to PHY-22)

### PHY-13: IMF Magnitude Limits
**Parameter:** |B| = √(Bx² + By² + Bz²)  
**Physical Range:** 1 nT ≤ |B| ≤ 100 nT  
**Severity:** HARD  
**Check:** `if |B| < 1 or |B| > 100: HARD_FAIL`  
**Rationale:** IMF magnitude range at L1

### PHY-14: IMF Bz Component Limits
**Parameter:** Bz (GSM coordinate)  
**Physical Range:** -50 nT ≤ Bz ≤ +50 nT  
**Severity:** HARD  
**Check:** `if Bz < -50 or Bz > 50: HARD_FAIL`  
**Rationale:** Extreme Bz values are rare and suspect

### PHY-15: IMF Bx Component Limits
**Parameter:** Bx (GSM coordinate)  
**Physical Range:** -30 nT ≤ Bx ≤ +30 nT  
**Severity:** SOFT  
**Check:** `if Bx < -30 or Bx > 30: SOFT_FAIL`  
**Rationale:** Bx typically smaller than total field

### PHY-16: IMF By Component Limits
**Parameter:** By (GSM coordinate)  
**Physical Range:** -30 nT ≤ By ≤ +30 nT  
**Severity:** SOFT  
**Check:** `if By < -30 or By > 30: SOFT_FAIL`  
**Rationale:** By typically smaller than total field

### PHY-17: Clock Angle Limits
**Parameter:** Clock angle θ = arctan(By/Bz)  
**Physical Range:** 0° ≤ θ ≤ 360°  
**Severity:** SOFT  
**Check:** `if θ < 0 or θ > 360: SOFT_FAIL`  
**Rationale:** Clock angle must be valid

### PHY-18: Cone Angle Limits
**Parameter:** Cone angle φ = arccos(Bx/|B|)  
**Physical Range:** 0° ≤ φ ≤ 180°  
**Severity:** SOFT  
**Check:** `if φ < 0 or φ > 180: SOFT_FAIL`  
**Rationale:** Cone angle must be valid

### PHY-19: Magnetic Field Variance
**Parameter:** σB over 1-hour window  
**Physical Range:** σB ≤ 20 nT  
**Severity:** SOFT  
**Check:** `if σB > 20: SOFT_FAIL`  
**Rationale:** Extreme turbulence may indicate data issues

### PHY-20: IMF Polarity Changes
**Parameter:** Number of Bz sign changes per hour  
**Physical Range:** ≤ 10 changes/hour  
**Severity:** SOFT  
**Check:** `if changes > 10: SOFT_FAIL`  
**Rationale:** Excessive flipping may indicate noise

### PHY-21: Parker Spiral Angle
**Parameter:** Expected spiral angle at 1 AU  
**Physical Range:** 40° ≤ θspiral ≤ 50°  
**Severity:** SOFT  
**Check:** `if |θobserved - θexpected| > 30°: SOFT_FAIL`  
**Rationale:** IMF should follow Parker spiral within reason

### PHY-22: Magnetic Pressure Limits
**Parameter:** Pmag = B²/(2μ₀)  
**Physical Range:** 0.01 nPa ≤ Pmag ≤ 5 nPa  
**Severity:** SOFT  
**Check:** `if Pmag < 0.01 or Pmag > 5: SOFT_FAIL`  
**Rationale:** Magnetic pressure range at L1

---

## 7.5 CME Properties (PHY-23 to PHY-32)

### PHY-23: CME Speed Limits
**Parameter:** Linear CME speed from coronagraph  
**Physical Range:** 100 km/s ≤ vCME ≤ 3000 km/s  
**Severity:** HARD  
**Check:** `if vCME < 100 or vCME > 3000: HARD_FAIL`  
**Rationale:** CME speed limits based on observations

### PHY-24: CME Angular Width Limits
**Parameter:** Angular width from coronagraph  
**Physical Range:** 10° ≤ width ≤ 360°  
**Severity:** HARD  
**Check:** `if width < 10 or width > 360: HARD_FAIL`  
**Rationale:** CME angular width range

### PHY-25: Halo CME Definition
**Parameter:** Halo CME classification  
**Physical Range:** width ≥ 120° for halo  
**Severity:** SOFT  
**Check:** `if classified_halo and width < 120: SOFT_FAIL`  
**Rationale:** Halo CMEs must meet angular width criteria

### PHY-26: CME Mass Limits
**Parameter:** CME mass from coronagraph  
**Physical Range:** 10¹² g ≤ mass ≤ 10¹⁶ g  
**Severity:** HARD  
**Check:** `if mass < 1e12 or mass > 1e16: HARD_FAIL`  
**Rationale:** CME mass range based on observations

### PHY-27: CME Kinetic Energy Limits
**Parameter:** E = 0.5·m·v²  
**Physical Range:** 10²⁹ erg ≤ E ≤ 10³³ erg  
**Severity:** HARD  
**Check:** `if E < 1e29 or E > 1e33: HARD_FAIL`  
**Rationale:** CME kinetic energy range

### PHY-28: CME Direction Limits
**Parameter:** Source longitude  
**Physical Range:** -90° ≤ longitude ≤ +90° (Earth-directed)  
**Severity:** SOFT  
**Check:** `if |longitude| > 90 and earth_directed: SOFT_FAIL`  
**Rationale:** Earth-directed CMEs should originate near disk center

### PHY-29: CME Acceleration Limits
**Parameter:** CME acceleration in corona  
**Physical Range:** -1000 m/s² ≤ a ≤ +2000 m/s²  
**Severity:** SOFT  
**Check:** `if a < -1000 or a > 2000: SOFT_FAIL`  
**Rationale:** CME acceleration range in corona

### PHY-30: CME Transit Time Limits
**Parameter:** Sun-Earth transit time  
**Physical Range:** 12 hours ≤ ttransit ≤ 120 hours  
**Severity:** HARD  
**Check:** `if ttransit < 12 or ttransit > 120: HARD_FAIL`  
**Rationale:** CME transit time range to Earth

### PHY-31: CME Impact Speed Limits
**Parameter:** Predicted impact speed at Earth  
**Physical Range:** 300 km/s ≤ vimpact ≤ 2500 km/s  
**Severity:** SOFT  
**Check:** `if vimpact < 300 or vimpact > 2500: SOFT_FAIL`  
**Rationale:** Impact speed should be within solar wind range

### PHY-32: CME-ICME Continuity
**Parameter:** Consistency between CME and ICME observations  
**Physical Range:** Speed change ≤ 500 km/s  
**Severity:** SOFT  
**Check:** `if |vCME - vICME| > 500: SOFT_FAIL`  
**Rationale:** CME and ICME speeds should be reasonably consistent

---

## 7.6 Solar Flare Parameters (PHY-33 to PHY-38)

### PHY-33: X-ray Flux Limits
**Parameter:** Peak X-ray flux (1-8 Å)  
**Physical Range:** 10⁻⁹ W/m² ≤ flux ≤ 10⁻² W/m²  
**Severity:** HARD  
**Check:** `if flux < 1e-9 or flux > 1e-2: HARD_FAIL`  
**Rationale:** X-ray flux range from background to X-class flares

### PHY-34: Flare Classification Consistency
**Parameter:** Flux vs class match  
**Physical Range:** A-class: <10⁻⁷, B: 10⁻⁷-10⁻⁶, C: 10⁻⁶-10⁻⁵, M: 10⁻⁵-10⁻⁴, X: >10⁻⁴  
**Severity:** SOFT  
**Check:** `if class != expected_from_flux: SOFT_FAIL`  
**Rationale:** Flare classification must match flux

### PHY-35: Flare Duration Limits
**Parameter:** Flare duration (FWHM)  
**Physical Range:** 1 minute ≤ duration ≤ 4 hours  
**Severity:** SOFT  
**Check:** `if duration < 60 or duration > 14400: SOFT_FAIL`  
**Rationale:** Flare duration range

### PHY-36: Flare Rise Time Limits
**Parameter:** Rise time to peak  
**Physical Range:** 10 seconds ≤ trise ≤ 30 minutes  
**Severity:** SOFT  
**Check:** `if trise < 10 or trise > 1800: SOFT_FAIL`  
**Rationale:** Flare rise time range

### PHY-37: Flare Decay Time Limits
**Parameter:** Decay time from peak  
**Physical Range:** 1 minute ≤ tdecay ≤ 3 hours  
**Severity:** SOFT  
**Check:** `if tdecay < 60 or tdecay > 10800: SOFT_FAIL`  
**Rationale:** Flare decay time range

### PHY-38: Flare Temperature Limits
**Parameter:** Differential emission measure (DEM) temperature  
**Physical Range:** 10⁶ K ≤ Tflare ≤ 10⁸ K  
**Severity:** SOFT  
**Check:** `if Tflare < 1e6 or Tflare > 1e8: SOFT_FAIL`  
**Rationale:** Flare plasma temperature range

---

## 7.7 Plasma Physics (PHY-39 to PHY-44)

### PHY-39: Plasma Beta Consistency
**Parameter:** β = nkT/(B²/2μ₀)  
**Physical Range:** 0.01 ≤ β ≤ 100  
**Severity:** SOFT  
**Check:** `if β < 0.01 or β > 100: SOFT_FAIL`  
**Rationale:** Plasma beta should be within reasonable bounds

### PHY-40: Alfvén Mach Number
**Parameter:** MA = v/vA  
**Physical Range:** 1 ≤ MA ≤ 30  
**Severity:** SOFT  
**Check:** `if MA < 1 or MA > 30: SOFT_FAIL`  
**Rationale:** Solar wind is super-Alfvénic

### PHY-41: Sonic Mach Number
**Parameter:** Ms = v/cs  
**Physical Range:** 2 ≤ Ms ≤ 25  
**Severity:** SOFT  
**Check:** `if Ms < 2 or Ms > 25: SOFT_FAIL`  
**Rationale:** Solar wind is supersonic

### PHY-42: Gyroradius Limits
**Parameter:** Proton gyroradius rg = mv⊥/(qB)  
**Physical Range:** 1 km ≤ rg ≤ 1000 km  
**Severity:** SOFT  
**Check:** `if rg < 1 or rg > 1000: SOFT_FAIL`  
**Rationale:** Proton gyroradius in solar wind

### PHY-43: Gyrofrequency Limits
**Parameter:** Proton gyrofrequency Ω = qB/m  
**Physical Range:** 0.01 Hz ≤ Ω ≤ 1 Hz  
**Severity:** SOFT  
**Check:** `if Ω < 0.01 or Ω > 1: SOFT_FAIL`  
**Rationale:** Proton gyrofrequency in IMF

### PHY-44: Debye Length Limits
**Parameter:** Debye length λD = √(ε₀kT/ne²)  
**Physical Range:** 1 m ≤ λD ≤ 100 m  
**Severity:** SOFT  
**Check:** `if λD < 1 or λD > 100: SOFT_FAIL`  
**Rationale:** Debye length in solar wind plasma

---

## 7.8 Temporal Consistency (PHY-45 to PHY-48)

### PHY-45: Speed Gradient Limits
**Parameter:** dv/dt over 1 hour  
**Physical Range:** |dv/dt| ≤ 100 km/s/hour  
**Severity:** SOFT  
**Check:** `if |dv/dt| > 100: SOFT_FAIL`  
**Rationale:** Solar wind speed changes gradually

### PHY-46: Density Gradient Limits
**Parameter:** dn/dt over 1 hour  
**Physical Range:** |dn/dt| ≤ 20 cm⁻³/hour  
**Severity:** SOFT  
**Check:** `if |dn/dt| > 20: SOFT_FAIL`  
**Rationale:** Density changes should be gradual

### PHY-47: Temperature Gradient Limits
**Parameter:** dT/dt over 1 hour  
**Physical Range:** |dT/dt| ≤ 10⁶ K/hour  
**Severity:** SOFT  
**Check:** `if |dT/dt| > 1e6: SOFT_FAIL`  
**Rationale:** Temperature changes should be gradual

### PHY-48: IMF Gradient Limits
**Parameter:** dB/dt over 1 hour  
**Physical Range:** |dB/dt| ≤ 10 nT/hour  
**Severity:** SOFT  
**Check:** `if |dB/dt| > 10: SOFT_FAIL`  
**Rationale:** Magnetic field changes should be gradual

---

## 7.9 Cross-Parameter Consistency (PHY-49 to PHY-52)

### PHY-49: Dynamic Pressure Consistency
**Parameter:** Pd from different satellite pairs  
**Physical Range:** |Pd1 - Pd2| / Pd_avg ≤ 0.5  
**Severity:** SOFT  
**Check:** `if relative_difference > 0.5: SOFT_FAIL`  
**Rationale:** Dynamic pressure should be consistent across satellites

### PHY-50: Speed-Pressure Correlation
**Parameter:** Correlation between speed and pressure  
**Physical Range:** High speed → moderate pressure  
**Severity:** SOFT  
**Check:** `if v > 800 and Pd < 0.5: SOFT_FAIL`  
**Rationale:** Fast wind should have measurable dynamic pressure

### PHY-51: IMF-Speed Correlation
**Parameter:** Correlation between |B| and v  
**Physical Range:** |B| typically 3-10 nT for normal wind  
**Severity:** SOFT  
**Check:** `if v > 1000 and |B| < 2: SOFT_FAIL`  
**Rationale:** Fast wind typically has stronger IMF

### PHY-52: Multi-Satellite Consistency
**Parameter:** Cross-satellite parameter agreement  
**Physical Range:** Z-score ≤ 3 for each parameter  
**Severity:** SOFT  
**Check:** `if |z| > 3 for any satellite: SOFT_FAIL`  
**Rationale:** Satellites should agree within statistical limits

---

## 7.10 Rule Implementation

### Severity Levels

| Severity | Automation Allowed | Action |
|----------|-------------------|--------|
| **HARD** | false | Block automated DSS, advisory-only mode |
| **SOFT** | true (with multiplier) | Downgrade confidence, apply multiplier < 1.0 |
| **PASS** | true | Normal operation |

### Confidence Multiplier

For SOFT_FAIL violations:
```
confidence_multiplier = 1.0 - (0.1 × number_of_soft_fails)
```

Minimum multiplier: 0.5 (even with many SOFT fails, some weight retained)

### Validation Output Structure

```json
{
  "validation_status": "PASS|SOFT_FAIL|HARD_FAIL",
  "violated_rules": [
    {
      "id": "PHY-03",
      "severity": "HARD",
      "parameter": "dynamic_pressure",
      "observed": 28.0,
      "limit": "15.0",
      "message": "Dynamic pressure exceeds plausible range"
    }
  ],
  "confidence_multiplier": 0.8,
  "automation_allowed": true,
  "checked_at": "2026-07-17T10:00:00Z",
  "comments": "2 soft failures on plasma parameters"
}
```

---

## 7.11 References

- NASA Space Physics Data Facility (SPDF) data quality standards
- NOAA Space Weather Prediction Center validation criteria
- ESA Solar and Heliospheric Observatory (SOHO) data quality flags
- International Space Environment Service (ISES) guidelines
- Published solar wind parameter studies (e.g., Schwenn 2006)
