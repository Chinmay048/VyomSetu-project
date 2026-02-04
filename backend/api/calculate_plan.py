from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sys
import os

# Add parent directory to path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import (
    Point, PlanningRequest, TECH_MATRIX, DEFAULT_TECH,
    generate_grid, optimize_network, get_dist_km
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/calculate-plan")
async def calculate_plan(data: PlanningRequest):
    nodes = generate_grid(data.polygons, data.critical_nodes)
    towers, logs, processed_nodes = optimize_network(nodes, data.polygons, data.terrain_type)
    
    links = []
    critical_analysis = []
    
    for n in processed_nodes:
        if n.is_critical:
            closest = None
            min_d = float('inf')
            for t in towers:
                d = get_dist_km(t["lat"], t["lng"], n.lat, n.lng)
                if d <= (t["range"] * 1.05):
                    if d < min_d:
                        min_d = d
                        closest = t
            
            if closest:
                links.append({"from": [n.lat, n.lng], "to": [closest["lat"], closest["lng"]]})
                critical_analysis.append({"name": n.name, "status": "Connected", "dist": f"{min_d:.2f}km"})
            else:
                critical_analysis.append({"name": n.name, "status": "Offline", "dist": "N/A"})

    specs = TECH_MATRIX.get(data.terrain_type, DEFAULT_TECH)
    
    total_cost = sum(t["cost"] for t in towers)
    legacy_total_cost = len(towers) * specs["legacy_cost"]
    
    area = len([n for n in processed_nodes if not n.is_critical]) * 0.008

    return {
        "kpis": {
            "total_towers": len(towers),
            "capex": total_cost,
            "legacy_capex": legacy_total_cost,
            "area": round(area, 2)
        },
        "metrics": {"cost": total_cost, "count": len(towers), "area": round(area, 2), "tech": towers[0]["tech"] if towers else "N/A"},
        "critical_analysis": critical_analysis,
        "terrain_breakdown": {"tech": towers[0]["tech"] if towers else "N/A", "radius": towers[0]["range"] if towers else 0},
        "links": links,
        "logs": logs,
        "towers": towers
    }
