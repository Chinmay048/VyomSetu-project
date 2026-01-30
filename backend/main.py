from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
import random

# --- IMPORT PHASE 2 MODULE ---
import weather 

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

class Point(BaseModel):
    lat: float
    lng: float

class PlanningRequest(BaseModel):
    polygons: List[List[Point]] 
    critical_nodes: List[Point]
    terrain_type: str = "valley" 

# --- TECH MATRIX ---
TECH_MATRIX = {
    "flat":   {"tech": "Macro Tower (700MHz)", "range": 10.0, "cost": 50000},
    "hilly":  {"tech": "High-Site Macro",      "range": 4.0,  "cost": 80000},
    "forest": {"tech": "Telescopic Mast",      "range": 3.0,  "cost": 60000},
    "valley": {"tech": "Small Cell / Micro",   "range": 0.8,  "cost": 20000},
    "snow":   {"tech": "High-Site Macro",      "range": 4.0,  "cost": 2500000} 
}

# --- GEOMETRY HELPERS ---
def get_dist_km(lat1, lng1, lat2, lng2):
    return math.sqrt(((lat1-lat2)*110.9)**2 + ((lng1-lng2)*95.5)**2)

def is_inside(lat, lng, poly):
    if len(poly) < 3: return False
    n = len(poly)
    inside = False
    p1x, p1y = poly[0].lat, poly[0].lng
    for i in range(n + 1):
        p2x, p2y = poly[i % n].lat, poly[i % n].lng
        if lng > min(p1y, p2y):
            if lng <= max(p1y, p2y):
                if lat <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lng - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lat <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def get_centroid(poly):
    if not poly: return None
    lat = sum(p.lat for p in poly) / len(poly)
    lng = sum(p.lng for p in poly) / len(poly)
    return {"lat": lat, "lng": lng}

# --- SIMULATION POINTS ---
class SimNode:
    def __init__(self, lat, lng, is_critical=False, name="Area Point"):
        self.lat = lat
        self.lng = lng
        self.is_critical = is_critical
        self.name = name
        self.covered = False

def generate_multi_polygon_grid(polygons, critical_nodes):
    nodes = []
    # 1. Critical Nodes
    for i, c in enumerate(critical_nodes):
        nodes.append(SimNode(c.lat, c.lng, is_critical=True, name=f"Critical #{i+1}"))
    
    # 2. Grid for Polygons (Plus Centroids)
    for poly in polygons:
        if len(poly) > 2:
            # Always add centroid (Guarantees we have a "center" candidate)
            cent = get_centroid(poly)
            if cent:
                nodes.append(SimNode(cent["lat"], cent["lng"], is_critical=False))

            lats = [p.lat for p in poly]
            lngs = [p.lng for p in poly]
            # Adaptive Step: Smaller area = Finer grid
            step = 0.0005 
            curr_lat = min(lats)
            while curr_lat < max(lats):
                curr_lng = min(lngs)
                while curr_lng < max(lngs):
                    if is_inside(curr_lat, curr_lng, poly):
                        nodes.append(SimNode(curr_lat, curr_lng, is_critical=False))
                    curr_lng += step
                curr_lat += step
    return nodes

# --- THE GEOMETRIC "SLIDING" OPTIMIZER ---
def optimize_network(nodes, polygons, terrain_type):
    towers = []
    logs = []
    specs = TECH_MATRIX.get(terrain_type, TECH_MATRIX["valley"])
    radius = specs["range"]
    
    logs.append(f"INIT: Geometric Analysis (R={radius}km)...")

    # PHASE A: ANCHOR OPTIMIZATION (The "Slide" Logic)
    criticals = [n for n in nodes if n.is_critical]
    
    tower_id = 1
    
    for crit in criticals:
        if crit.covered: continue
        
        # Find the CLOSEST Polygon
        best_poly = None
        min_poly_dist = float('inf')
        target_centroid = None
        
        for poly in polygons:
            if len(poly) < 3: continue
            cent = get_centroid(poly)
            dist = get_dist_km(crit.lat, crit.lng, cent["lat"], cent["lng"])
            if dist < min_poly_dist:
                min_poly_dist = dist
                best_poly = poly
                target_centroid = cent
        
        final_lat, final_lng = crit.lat, crit.lng
        
        # LOGIC:
        if target_centroid:
            dist_to_center = min_poly_dist
            
            # Case 1: Center is within range -> PLACE AT CENTER
            if dist_to_center <= (radius * 0.95):
                final_lat = target_centroid["lat"]
                final_lng = target_centroid["lng"]
                logs.append(f"GEOMETRY: Anchor {crit.name} allows Center Placement. Optimal.")
            
            # Case 2: Center is too far -> SLIDE towards Anchor
            else:
                # Vector Math: Move from Anchor towards Center by exactly 'Radius' distance
                ratio = (radius * 0.95) / dist_to_center
                final_lat = crit.lat + (target_centroid["lat"] - crit.lat) * ratio
                final_lng = crit.lng + (target_centroid["lng"] - crit.lng) * ratio
                logs.append(f"GEOMETRY: Center too far ({dist_to_center:.2f}km). Slid tower to edge of range.")

        # Place Tower
        towers.append({
            "id": f"TWR-{tower_id:02d}",
            "lat": final_lat, "lng": final_lng,
            "type": "anchor",
            "range": radius,
            "cost": specs["cost"],
            "tech": specs["tech"]
        })
        tower_id += 1
        
        # Mark covered (Anchor ensures itself is covered by math, but check grid)
        for n in nodes:
            if get_dist_km(final_lat, final_lng, n.lat, n.lng) <= radius:
                n.covered = True
        # Force anchor covered (rounding errors)
        crit.covered = True

    # PHASE B: FILL GAPS
    while True:
        uncovered = [n for n in nodes if not n.is_critical and not n.covered]
        # Stop if 95% covered
        total_area_points = len([n for n in nodes if not n.is_critical])
        if not uncovered or (total_area_points > 0 and len(uncovered)/total_area_points < 0.05):
            break
            
        # Find best spot from uncovered nodes
        candidates = uncovered
        if len(candidates) > 50: candidates = random.sample(candidates, 50)
        
        best_cand = None
        max_cover = -1
        
        for cand in candidates:
            hits = 0
            for n in uncovered:
                if get_dist_km(cand.lat, cand.lng, n.lat, n.lng) <= radius:
                    hits += 1
            if hits > max_cover:
                max_cover = hits
                best_cand = cand
        
        if best_cand and max_cover > 0:
            towers.append({
                "id": f"TWR-{tower_id:02d}",
                "lat": best_cand.lat, "lng": best_cand.lng,
                "type": "fill",
                "range": radius,
                "cost": specs["cost"],
                "tech": specs["tech"]
            })
            tower_id += 1
            logs.append(f"FILL: Added tower covering {max_cover} points.")
            
            for n in nodes:
                if get_dist_km(best_cand.lat, best_cand.lng, n.lat, n.lng) <= radius:
                    n.covered = True
        else:
            break

    return towers, logs, nodes

@app.post("/calculate-plan")
async def calculate_plan(data: PlanningRequest):
    nodes = generate_multi_polygon_grid(data.polygons, data.critical_nodes)
    towers, logs, processed_nodes = optimize_network(nodes, data.polygons, data.terrain_type)
    
    # Visual Links
    links = []
    critical_analysis = []
    
    for n in processed_nodes:
        if n.is_critical:
            # Find closest tower
            closest = None
            min_d = float('inf')
            for t in towers:
                d = get_dist_km(t["lat"], t["lng"], n.lat, n.lng)
                if d <= (t["range"] * 1.1): # Small display buffer
                    if d < min_d:
                        min_d = d
                        closest = t
            
            if closest:
                links.append({"from": [n.lat, n.lng], "to": [closest["lat"], closest["lng"]]})
                critical_analysis.append({
                    "name": n.name,
                    "tower_id": closest["id"],
                    "distance": f"{min_d:.2f} km",
                    "signal": "Excellent"
                })
            else:
                 critical_analysis.append({"name": n.name, "tower_id": "NONE", "distance": "-", "signal": "No Signal"})

    total_cost = sum(t["cost"] for t in towers)
    
    return {
        "kpis": {
            "total_towers": len(towers),
            "anchor_towers": sum(1 for t in towers if t["type"] == "anchor"),
            "fill_towers": sum(1 for t in towers if t["type"] == "fill"),
            "capex": total_cost,
            "area": len(nodes) * 0.01 
        },
        "critical_analysis": critical_analysis,
        "terrain_breakdown": {
            "zone": data.terrain_type,
            "tech": towers[0]["tech"] if towers else "N/A",
            "radius": towers[0]["range"] if towers else 0,
            "unit_cost": towers[0]["cost"] if towers else 0
        },
        "links": links,
        "logs": logs,
        "towers": towers
    }

@app.get("/weather-resilience/{village_id}/{tech_type}")
async def get_weather_resilience(village_id: str, tech_type: str, simulate: bool = False):
    return weather.check_resilience(village_id, tech_type, simulate)