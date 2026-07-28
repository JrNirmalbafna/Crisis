import requests
import json

BASE = "http://localhost:8000/api/v1"

def sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# ─── 1. EVENTS ────────────────────────────────────────────────
sep("1. EVENTS  GET /events/?limit=5&hours=8760")
try:
    r = requests.get(f"{BASE}/events/?limit=5&hours=8760", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        events = r.json()
        print(f"  Count returned: {len(events)}")
        for e in events[:5]:
            meta = e.get("metadata_json") or e.get("metadata") or {}
            print(f"  id={e['id']}  type={e['event_type']}  status={e['status']}  "
                  f"confidence={e.get('detection_confidence')}  "
                  f"speed={meta.get('speed', meta.get('speed_km_s', 'N/A'))}  "
                  f"start={str(e.get('start_time',''))[:16]}")
    else:
        print(f"  ERROR: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 2. FUSION LATEST ─────────────────────────────────────────
sep("2. FUSION  GET /fusion/latest")
try:
    r = requests.get(f"{BASE}/fusion/latest", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        data = r.json()
        if isinstance(data, list):
            print(f"  Snapshot count: {len(data)}")
            for item in data:
                pn  = item.get("parameter_name", "?")
                fv  = item.get("fused_value")
                wj  = item.get("weights_json", {})
                ts  = str(item.get("timestamp",""))[:16]
                print(f"  [{ts}] {pn:30s}  fused={fv}  weights={wj}")
        else:
            print(f"  Response: {json.dumps(data)[:500]}")
    else:
        print(f"  ERROR: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 3. PREDICTIONS CONSENSUS (event 1) ───────────────────────
sep("3. CONSENSUS  GET /predictions/consensus/event/1")
try:
    r = requests.get(f"{BASE}/predictions/consensus/event/1", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        print(json.dumps(r.json(), indent=2)[:800])
    else:
        print(f"  Body: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 4. FEATURE IMPORTANCE ────────────────────────────────────
sep("4. FEATURE IMPORTANCE  GET /predictions/explainability/feature-importance")
try:
    r = requests.get(f"{BASE}/predictions/explainability/feature-importance", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        data = r.json()
        print(f"  Model: {data.get('model_name')}")
        print(f"  Event ID: {data.get('event_id')}")
        print(f"  Timestamp: {data.get('timestamp')}")
        for f in data.get("features", []):
            bar = int(f["importance"] * 40)
            print(f"  {'#'*bar:<40} {f['importance']*100:5.1f}%  {f['feature']}")
    else:
        print(f"  ERROR: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 5. RECOMMENDATIONS (event 1) ─────────────────────────────
sep("5. RECOMMENDATIONS  GET /recommendations/event/1")
try:
    r = requests.get(f"{BASE}/recommendations/event/1", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        print(json.dumps(r.json(), indent=2)[:600])
    else:
        print(f"  Body: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 6. UNCERTAINTY (event 1) ─────────────────────────────────
sep("6. UNCERTAINTY  GET /uncertainty/event/1")
try:
    r = requests.get(f"{BASE}/uncertainty/event/1", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        print(json.dumps(r.json(), indent=2)[:500])
    else:
        print(f"  Body: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 7. SATELLITE HEALTH (via fusion weights) ─────────────────
sep("7. SATELLITE HEALTH  GET /fusion/satellite-health")
try:
    r = requests.get(f"{BASE}/fusion/satellite-health", timeout=5)
    print(f"  HTTP {r.status_code}")
    if r.ok:
        print(json.dumps(r.json(), indent=2)[:600])
    else:
        print(f"  Body: {r.text[:300]}")
except Exception as ex:
    print(f"  EXCEPTION: {ex}")

# ─── 8. NOAA Live Checks ──────────────────────────────────────
sep("8. NOAA LIVE DATA CHECKS")
noaa_endpoints = [
    ("rtsw_wind_1m (latest row)", "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json"),
    ("rtsw_mag_1m  (latest row)", "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"),
    ("planetary_k  (latest row)", "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"),
]
for label, url in noaa_endpoints:
    try:
        r = requests.get(url, timeout=8)
        if r.ok:
            arr = r.json()
            if isinstance(arr, list) and arr:
                last = arr[-1]
                print(f"  {label}: {last}")
            else:
                print(f"  {label}: {str(arr)[:150]}")
        else:
            print(f"  {label}: HTTP {r.status_code}")
    except Exception as ex:
        print(f"  {label}: EXCEPTION {ex}")

print("\n\n=== AUDIT COMPLETE ===")
