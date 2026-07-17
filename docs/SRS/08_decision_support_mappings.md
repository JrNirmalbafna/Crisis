# 8. Decision Support Mappings

**Helios Intelligence / Solar Sentinel AI**  
**Version:** 1.0  
**Module:** 10 — Scientific Decision Support

---

## 8.1 Purpose

This document defines stakeholder mappings, action thresholds, and decision rules for the Scientific Decision Support System (DSS). The DSS translates physics-validated predictions into stakeholder-specific actionable recommendations.

**Key Principle:** Only physics-validated predictions (PASS or SOFT_FAIL with automation allowed) generate automated recommendations.

---

## 8.2 Stakeholder Categories

| Stakeholder | Target System | Priority | Automation Level |
|-------------|---------------|----------|------------------|
| **Satellite Operators** | satellite_ops | High | Full automation |
| **Power Grid Operators** | power_grid | Critical | Full automation |
| **Astronauts/Space Stations** | astronauts | Critical | Advisory + automation |
| **Ground Stations** | ground_station | Medium | Partial automation |
| **Scientific Review** | scientist_review | Low | Advisory only |

---

## 8.3 Satellite Operators

### Thresholds

| Parameter | Warning | Critical | Action |
|-----------|---------|----------|--------|
| **Solar Wind Speed** | > 600 km/s | > 800 km/s | Increase monitoring, prepare for drag |
| **Dynamic Pressure** | > 5 nPa | > 10 nPa | Orbit adjustment planning |
| **IMF Bz (Southward)** | < -10 nT | < -20 nT | Prepare for geomagnetic storm |
| **CME Impact Probability** | > 50% | > 80% | Safe mode preparation |
| **Radiation Dose** | > 0.1 Gy/day | > 0.5 Gy/day | Safe mode, crew protection |

### Action Mappings

| Event Type | Severity | Recommended Action | Priority |
|------------|----------|-------------------|----------|
| **CME Impact** | HIGH | Initiate safe mode, secure external instruments | HIGH |
| **Geomagnetic Storm** | MEDIUM | Increase attitude control monitoring | MEDIUM |
| **Radiation Storm** | CRITICAL | Safe mode, suspend EVA, crew shelter | CRITICAL |
| **High Solar Wind** | LOW | Monitor orbital decay rate | LOW |

### Justification Template

```
CME impact predicted in [T] hours with [P]% probability.
Expected dynamic pressure: [X] nPa.
Recommendation: [ACTION] to mitigate [RISK].
Physics validation: [STATUS] (confidence: [C]).
```

---

## 8.4 Power Grid Operators

### Thresholds

| Parameter | Warning | Critical | Action |
|-----------|---------|----------|--------|
| **Geomagnetic Kp Index** | > 5 | > 7 | GIC monitoring, load balancing |
| **Dst Index** | < -50 nT | < -100 nT | Transformer protection |
| **IMF Bz (Southward)** | < -15 nT | < -30 nT | GIC alert |
| **CME Impact Probability** | > 60% | > 90% | Emergency protocols |
| **GIC Forecast** | > 5 A | > 20 A | Transformer derating |

### Action Mappings

| Event Type | Severity | Recommended Action | Priority |
|------------|----------|-------------------|----------|
| **Geomagnetic Storm** | HIGH | Activate GIC monitoring, prepare load shedding | HIGH |
| **Extreme GIC** | CRITICAL | Emergency transformer protection, grid isolation | CRITICAL |
| **CME Impact** | MEDIUM | Pre-position repair crews, alert control centers | MEDIUM |
| **Radiation Storm** | LOW | Monitor satellite communication links | LOW |

### Justification Template

```
Geomagnetic storm expected with Kp=[K], Dst=[D] nT.
GIC forecast: [G] A at key transformers.
Recommendation: [ACTION] to prevent grid instability.
Physics validation: [STATUS] (confidence: [C]).
```

---

## 8.5 Astronauts/Space Stations

### Thresholds

| Parameter | Warning | Critical | Action |
|-----------|---------|----------|--------|
| **Radiation Dose Rate** | > 0.5 mSv/h | > 2 mSv/h | Shelter in storm shelter |
| **SEP Event** | > 10 pfu | > 100 pfu | EVA cancellation, shelter |
| **CME Impact Probability** | > 40% | > 70% | Review shelter protocols |
| **Solar Flare (X-class)** | Any X-class | M5+ | EVA cancellation, monitoring |
| **Communication Outage Risk** | > 30% | > 60% | Pre-position critical data |

### Action Mappings

| Event Type | Severity | Recommended Action | Priority |
|------------|----------|-------------------|----------|
| **Radiation Storm** | CRITICAL | Immediate shelter, suspend all external activities | CRITICAL |
| **SEP Event** | CRITICAL | EVA cancellation, crew shelter, radiation monitoring | CRITICAL |
| **X-class Flare** | HIGH | EVA cancellation, increase radiation monitoring | HIGH |
| **Communication Risk** | MEDIUM | Pre-position critical data, backup comms | MEDIUM |

### Justification Template

```
Radiation alert: dose rate [D] mSv/h, SEP flux [F] pfu.
Crew exposure risk: [R] mSv in next [T] hours.
Recommendation: [ACTION] for crew protection.
Physics validation: [STATUS] (confidence: [C]).
```

---

## 8.6 Ground Stations

### Thresholds

| Parameter | Warning | Critical | Action |
|-----------|---------|----------|--------|
| **Ionospheric Disturbance** | TEC > 20% | TEC > 50% | Frequency adjustment |
| **Scintillation Index** | S4 > 0.5 | S4 > 0.8 | Signal diversity |
| **Communication Outage Risk** | > 20% | > 50% | Backup antenna activation |
| **CME Impact Probability** | > 30% | > 60% | Schedule critical passes |

### Action Mappings

| Event Type | Severity | Recommended Action | Priority |
|------------|----------|-------------------|----------|
| **Ionospheric Storm** | MEDIUM | Adjust frequencies, increase power | MEDIUM |
| **Scintillation Event** | MEDIUM | Enable signal diversity, error correction | MEDIUM |
| **Communication Outage Risk** | HIGH | Activate backup systems, reschedule passes | HIGH |
| **CME Impact** | LOW | Monitor signal quality, prepare contingencies | LOW |

### Justification Template

```
Ionospheric disturbance: TEC increase [T]%, scintillation S4=[S].
Communication risk: [R]% for next [H] hours.
Recommendation: [ACTION] to maintain link reliability.
Physics validation: [STATUS] (confidence: [C]).
```

---

## 8.7 Scientific Review

### Thresholds

| Parameter | Warning | Critical | Action |
|-----------|---------|----------|--------|
| **Unusual Event** | Any anomaly | Any anomaly | Scientific review request |
| **Physics SOFT_FAIL** | Any SOFT_FAIL | Any SOFT_FAIL | Review violated rules |
| **Model Disagreement** | Agreement < 0.7 | Agreement < 0.5 | Model review |
| **New Phenomenon** | Unknown pattern | Unknown pattern | Research investigation |

### Action Mappings

| Event Type | Severity | Recommended Action | Priority |
|------------|----------|-------------------|----------|
| **Physics SOFT_FAIL** | MEDIUM | Review violated rules, assess impact | MEDIUM |
| **Model Disagreement** | LOW | Review model performance, recalibrate | LOW |
| **Unusual Event** | HIGH | Scientific investigation, documentation | HIGH |
| **New Phenomenon** | CRITICAL | Research study, publication | CRITICAL |

### Justification Template

```
Event [E] requires scientific review.
Physics validation: [STATUS] with [N] violated rules.
Model agreement: [A].
Recommendation: [ACTION] for scientific assessment.
```

---

## 8.8 Priority Level Definitions

| Priority | Response Time | Automation | Escalation |
|----------|---------------|------------|------------|
| **CRITICAL** | < 15 minutes | Full auto + alert | Immediate escalation |
| **HIGH** | < 1 hour | Full auto | Escalate if no response |
| **MEDIUM** | < 4 hours | Semi-auto | Monitor response |
| **LOW** | < 24 hours | Advisory | No escalation |

---

## 8.9 Physics Validation to DSS Mapping

| Validation Status | Automation Allowed | DSS Action |
|-------------------|-------------------|------------|
| **PASS** | true | Full automation, normal priority |
| **SOFT_FAIL** | true (multiplier < 1.0) | Reduced automation, lower priority |
| **HARD_FAIL** | false | Advisory only, no automation |

### Confidence Multiplier Impact

```
effective_priority = base_priority × confidence_multiplier
```

Where `confidence_multiplier` is from physics validation (0.5 to 1.0).

**Example:**
- Base priority: HIGH
- Confidence multiplier: 0.7 (2 SOFT fails)
- Effective priority: MEDIUM

---

## 8.10 Event Type to Action Mapping Matrix

| Event Type | Satellite Ops | Power Grid | Astronauts | Ground Station | Scientist |
|------------|---------------|------------|-----------|----------------|-----------|
| **CME Impact** | Safe mode prep | GIC monitoring | Shelter review | Pass scheduling | Review |
| **Geomagnetic Storm** | Attitude monitoring | Load balancing | Monitor dose | Frequency adj | Study |
| **Radiation Storm** | Safe mode | Grid protection | SHELTER | Backup comms | Research |
| **SEP Event** | Safe mode | Grid protection | SHELTER | Backup comms | Research |
| **X-class Flare** | Instrument protection | Monitor | EVA cancel | Monitor | Study |
| **HSS Event** | Drag monitoring | Monitor | Monitor | Monitor | Review |
| **Communication Risk** | Data backup | Comms backup | Data backup | Backup systems | Review |

---

## 8.11 Temporal Validity Rules

| Recommendation Type | Valid From | Valid Until | Refresh |
|---------------------|------------|-------------|---------|
| **CRITICAL** | Immediate | 2 hours | Every 15 min |
| **HIGH** | Immediate | 6 hours | Every 30 min |
| **MEDIUM** | Immediate | 24 hours | Every 2 hours |
| **LOW** | Immediate | 72 hours | Every 12 hours |

---

## 8.12 Implementation Structure

### Database Schema (recommendations table)

```python
target_system: str  # satellite_ops, power_grid, astronauts, ground_station, scientist_review
recommended_action: str  # Specific action from mapping
action_priority: str  # low, medium, high, critical
justification_text: str  # Templated justification
valid_from: datetime
valid_until: datetime
```

### Service Logic

```python
def generate_recommendations(prediction_id: int, physics_result: PhysicsValidationResult):
    if physics_result.validation_status == "HARD_FAIL":
        return advisory_only_recommendation(prediction_id)
    
    event = get_event(prediction_id)
    for stakeholder in settings.dss_stakeholders:
        action = map_event_to_action(event, stakeholder, physics_result)
        priority = calculate_priority(action, physics_result.confidence_multiplier)
        justification = generate_justification(event, action, physics_result)
        
        create_recommendation(
            event_id=event.id,
            prediction_id=prediction_id,
            target_system=stakeholder,
            recommended_action=action,
            action_priority=priority,
            justification_text=justification,
            valid_from=datetime.utcnow(),
            valid_until=calculate_validity(priority)
        )
```

---

## 8.13 References

- NOAA Space Weather Scales (G1-G5 for geomagnetic storms, S1-S5 for radiation storms)
- ICAO Space Weather Advisories for aviation
- NASA Human Space Flight Requirements
- IEEE Power Grid GIC Protection Standards
- ITU-R Ionospheric Propagation Recommendations
