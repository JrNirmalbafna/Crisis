import requests
import time

time.sleep(10)

r = requests.get("http://localhost:8000/api/v1/fusion/latest", timeout=5)
data = r.json()
if isinstance(data, list) and data:
    print("Fusion snapshot timestamp:", data[0].get("timestamp"))
    for item in data:
        name = item.get("parameter_name", "?")
        val = item.get("fused_value")
        print(f"  {name:30s} = {val}")
else:
    print("Response:", data)
