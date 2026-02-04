import random
from datetime import datetime, timedelta

# Global state to prevent UI flickering
CURRENT_STATE = None

def check_resilience(village_id, tech_type, simulate=False):
    global CURRENT_STATE
    
    base_conditions = ["Clear Sky", "Light Breeze", "Partly Cloudy", "Sunny", "Mist"]
    
    if simulate:
        if CURRENT_STATE and CURRENT_STATE.get("is_sos_triggered"):
            CURRENT_STATE["timestamp"] = datetime.now().strftime("%H:%M:%S")
            return CURRENT_STATE

        # --- DEMO MODE: RANDOM DISASTER SELECTION ---
        # 1. Flash Flood (Blue)
        # 2. Forest Fire (Red)
        # 3. Blizzard (White)
        # 4. Landslide (Brown)
        disaster_options = [
            {"type": "Flash Flood Warning", "severity": 95, "cap": 15, "color": "#3b82f6"}, 
            {"type": "Forest Fire",         "severity": 99, "cap": 5,  "color": "#ef4444"}, 
            {"type": "Severe Blizzard",     "severity": 88, "cap": 10, "color": "#e5e7eb"}, 
            {"type": "Landslide Alert",     "severity": 92, "cap": 0,  "color": "#78350f"}  
        ]
        scenario = random.choice(disaster_options)
        
        # --- FIXED DEMO TIME: IMPACT IN 15 SECONDS ---
        now = datetime.now()
        impact_dt = now + timedelta(seconds=15)
        
        policy = {
            "status": "SOS PROTOCOL: THROTTLED",
            "bandwidth_cap": scenario["cap"],
            "allowed_apps": ["Emergency Calls Only", "Govt Radio"],
            "blocked_apps": ["Netflix", "YouTube", "Instagram", "Gaming"]
        }
        
        CURRENT_STATE = {
            "is_sos_triggered": True,
            "condition": scenario["type"],
            "severity_score": scenario["severity"],
            "connectivity_score": 10,
            "network_policy": policy,
            "alert_message": f"CRITICAL: {scenario['type'].upper()} IMMINENT.",
            "impact_time_display": impact_dt.strftime("%H:%M:%S"), 
            "impact_timestamp": impact_dt.isoformat(),
            "timestamp": now.strftime("%H:%M:%S"),
            "visual_color": scenario["color"] # Sends color to frontend
        }
        return CURRENT_STATE

    else:
        CURRENT_STATE = None 
        condition = random.choice(base_conditions)
        return {
            "is_sos_triggered": False,
            "condition": condition,
            "severity_score": random.randint(2, 10),
            "connectivity_score": 100,
            "network_policy": {
                "status": "STANDARD ACCESS",
                "bandwidth_cap": 100,
                "allowed_apps": ["All Services Active"],
                "blocked_apps": []
            },
            "alert_message": "System Normal.",
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }