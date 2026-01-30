from pydantic import BaseModel
import random
from datetime import datetime

class NetworkPolicy(BaseModel):
    status: str
    bandwidth_cap: int
    allowed_apps: list
    blocked_apps: list
    priority_msg: str

class WeatherResponse(BaseModel):
    village_id: str
    condition: str
    temp: str
    severity_score: int
    is_sos_triggered: bool
    resilience_score: int
    alert_message: str
    network_policy: NetworkPolicy
    timestamp: str 

SCENARIOS = {
    "chitkul": {"real": {"cond": "Clear", "sev": 10}, "sim": {"cond": "Blizzard", "sev": 90}},
    "kalpa":   {"real": {"cond": "Cloudy", "sev": 30}, "sim": {"cond": "High Winds", "sev": 75}},
    "langza":  {"real": {"cond": "Sunny", "sev": 0},  "sim": {"cond": "Storm", "sev": 60}}
}

def get_qos_policy(severity: int) -> NetworkPolicy:
    if severity < 40:
        return NetworkPolicy(
            status="OPTIMAL",
            bandwidth_cap=100,
            allowed_apps=["Voice", "4K Video", "Social Media", "Gaming"],
            blocked_apps=[],
            priority_msg="Standard Routing Active."
        )
    elif severity < 80:
        return NetworkPolicy(
            status="THROTTLED",
            bandwidth_cap=50,
            allowed_apps=["Voice", "WhatsApp", "Browsing"],
            blocked_apps=["Netflix", "Gaming", "Downloads"],
            priority_msg="⚠ High Latency detected. Non-essential traffic shaped."
        )
    else:
        return NetworkPolicy(
            status="CRITICAL / SOS",
            bandwidth_cap=10,
            allowed_apps=["SOS Calls", "Medical Data", "Govt Alerts"],
            blocked_apps=["ALL ENTERTAINMENT", "Social Media", "Video"],
            priority_msg="⛔ LIFE-LINE PROTOCOL. BANDWIDTH LOCKED FOR EMERGENCIES."
        )

def check_resilience(village_id: str, tech_type: str, simulate: bool = False) -> WeatherResponse:
    mode_key = "sim" if simulate else "real"
    base = SCENARIOS.get(village_id, SCENARIOS["chitkul"])[mode_key]
    
    # VOLATILITY FIX: Make it jump around more during simulation
    if simulate:
        jitter = random.randint(-25, 20) # Big swings
        severity = min(100, max(10, base["sev"] + jitter))
        # Randomly flip condition text for drama
        conditions = ["Heavy Snow", "Whiteout", "Blizzard", "Gale Winds"] if base["cond"] == "Blizzard" else [base["cond"]]
        curr_cond = random.choice(conditions)
    else:
        severity = base["sev"]
        curr_cond = base["cond"]

    # Tech Resilience Logic
    resilience = 100
    if "Satellite" in tech_type:
        resilience = 95 if severity > 80 else 100
    elif "Microwave" in tech_type:
        resilience = max(0, 100 - (severity * 1.2)) # Fades fast
    elif "Fiber" in tech_type:
        resilience = 100 if severity < 85 else 40 # Snap risk

    sos = severity > 80 or resilience < 40
    policy = get_qos_policy(severity)
    
    alert = "All Systems Nominal"
    if sos: alert = f"CRITICAL ALERT: {curr_cond} exceeding safety limits."

    return WeatherResponse(
        village_id=village_id,
        condition=curr_cond,
        temp=f"{random.randint(-15, -5)}°C" if village_id=="chitkul" else "12°C",
        severity_score=severity,
        is_sos_triggered=sos,
        resilience_score=int(resilience),
        alert_message=alert,
        network_policy=policy,
        timestamp=datetime.now().strftime("%H:%M:%S")
    )