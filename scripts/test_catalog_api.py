import urllib.request
import json

url = "http://localhost:8080/api/products"
req = urllib.request.Request(url, headers={"Accept": "application/json"})
with urllib.request.urlopen(req) as resp:
    raw = resp.read().decode('utf-8')
    print("RAW RESPONSE:\n", raw)
    data = json.loads(raw)
    print("\nPARSED KEYS:", data.keys() if isinstance(data, dict) else type(data))
