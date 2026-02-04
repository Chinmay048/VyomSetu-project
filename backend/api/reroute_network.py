from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import sys
import os

# Add parent directory to path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import RerouteRequest, get_dist_km

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/reroute-network")
async def reroute_network(data: RerouteRequest):
    dead_node = next((t for t in data.towers if t["id"] == data.dead_node_id), None)
    if not dead_node:
        return {"error": "Node not found"}
    
    active_towers = [t for t in data.towers if t["id"] != data.dead_node_id]
    new_links = []
    
    if active_towers:
        nearest_neighbor = min(active_towers, key=lambda t: get_dist_km(t["lat"], t["lng"], dead_node["lat"], dead_node["lng"]))
        new_links.append({
            "from": [nearest_neighbor["lat"], nearest_neighbor["lng"]],
            "to": [dead_node["lat"], dead_node["lng"]]
        })
    
    return {
        "status": "REROUTED",
        "new_links": new_links
    }
