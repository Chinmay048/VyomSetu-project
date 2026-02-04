import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { jsPDF } from "jspdf"; // --- ADDED IMPORT ---
import { 
  Wifi, PenTool, Globe, Anchor, 
  ShieldAlert, Activity, Radio, 
  TrendingUp, FileText, Plane, Mountain, Signal, 
  MapPin, RefreshCw, Cpu, Zap, AlertTriangle, CheckCircle, Info, ShieldCheck,
  Heart, GraduationCap, Users, Building, ArrowRight, Download, BarChart3
} from 'lucide-react';

import StormShieldPanel from './StormShieldPanel';
import SelfHealingPanel from './SelfHealingPanel';

const styles = `
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .glass-panel { background: rgba(13, 13, 15, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); }
  .btn-hover { transition: all 0.2s ease; } .btn-hover:hover { transform: translateY(-1px); filter: brightness(1.1); }
  .terminal-text { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
  .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
  select, option { background-color: #09090b !important; color: white !important; }
`;

const VILLAGES = [
  { id: 'chitkul', name: 'Chitkul (Snow/Remote)', lat: 31.3526, lng: 78.4379, terrain: 'snow' },
  { id: 'kalpa', name: 'Kalpa (Rocky/Mountain)', lat: 31.5372, lng: 78.2562, terrain: 'rocky' },
  { id: 'langza', name: 'Langza (Valley/Flat)', lat: 32.2656, lng: 78.0643, terrain: 'valley' }
];

const SOCIAL_METRICS = {
    'chitkul': { pop: "1,240", hospitals: 1, schools: 2, label: "Digital Classroom Enabled" },
    'kalpa':   { pop: "3,850", hospitals: 2, schools: 4, label: "Tele-Medicine Hub Ready" },
    'langza':  { pop: "480",   hospitals: 1, schools: 1, label: "Emergency SOS Link Active" }
};

const getTerrainDesc = (type) => {
    switch(type) {
        case 'snow': return "Signal attenuation due to heavy snow requires L-Band Satellite Mesh (Non-LoS).";
        case 'rocky': return "High-altitude bedrock prevents trenching. Microwave Backhaul is optimal.";
        case 'valley': return "Flat variance allows efficient Optical Fiber (GPON) trenching.";
        default: return "Standard terrain configuration.";
    }
};

function MapController({ village }) {
  const map = useMap();
  useEffect(() => { map.flyTo([village.lat, village.lng], 15, { duration: 2.5, easeLinearity: 0.25 }); }, [village.id]);
  return null;
}

function DrawHandler({ mode, onMapClick }) {
  useMapEvents({ click(e) { if (mode !== 'view') onMapClick(e.latlng); } });
  return null;
}

export default function Dashboard() {
  const [activePhase, setActivePhase] = useState(1);
  const [selectedVillage, setSelectedVillage] = useState(VILLAGES[2]); 
  const [mode, setMode] = useState('view');
  
  const [polygons, setPolygons] = useState([]); 
  const [currentPoly, setCurrentPoly] = useState([]); 
  const [hospitals, setHospitals] = useState([]);
  const [result, setResult] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const [deadNodeId, setDeadNodeId] = useState(null); 
  const [reroutedLinks, setReroutedLinks] = useState([]); 

  // --- PHASE 2 STATES ---
  const [disasterActive, setDisasterActive] = useState(false);
  const [disasterInfo, setDisasterInfo] = useState(null);
  const [isDroneArmed, setIsDroneArmed] = useState(false);
  const [dronePos, setDronePos] = useState(null);
  const [effectRadius, setEffectRadius] = useState(0);
  const [isRestored, setIsRestored] = useState(false);

  // ANIMATION LOOP
  useEffect(() => {
    if (disasterActive && result && result.towers.length > 1) {
        const expandEffect = setInterval(() => {
            setEffectRadius(prev => Math.min(prev + 15, 800));
        }, 50);

        if (isDroneArmed && !isRestored) {
            const startNode = result.towers.find(t => t.type === 'master_hub') || result.towers[0];
            const endNode = result.towers[result.towers.length - 1]; 
            
            let progress = 0;
            const flightDelay = setTimeout(() => {
                const fly = setInterval(() => {
                    progress += 0.015; 
                    if (progress >= 1) {
                        setDronePos([endNode.lat, endNode.lng]);
                        setIsRestored(true); 
                        clearInterval(fly);
                    } else {
                        const lat = startNode.lat + (endNode.lat - startNode.lat) * progress;
                        const lng = startNode.lng + (endNode.lng - startNode.lng) * progress;
                        setDronePos([lat, lng]);
                    }
                }, 3);
            }, 1000);
            return () => { clearTimeout(flightDelay); clearInterval(expandEffect); };
        }
        return () => clearInterval(expandEffect);
    } else {
        setDronePos(null);
        setEffectRadius(0);
        setIsRestored(false);
        setIsDroneArmed(false);
    }
  }, [disasterActive, isDroneArmed, result]);

  const handleMapClick = (latlng) => {
    if (mode === 'hospital') {
      setHospitals([...hospitals, { lat: latlng.lat, lng: latlng.lng }]);
      setMode('view');
    } else if (mode === 'draw') {
      if (currentPoly.length > 2) {
        const start = currentPoly[0];
        const dist = Math.sqrt(Math.pow(latlng.lat - start.lat, 2) + Math.pow(latlng.lng - start.lng, 2));
        if (dist < 0.001) { setPolygons([...polygons, currentPoly]); setCurrentPoly([]); return; }
      }
      setCurrentPoly([...currentPoly, { lat: latlng.lat, lng: latlng.lng }]);
    }
  };

  const calculatePlan = async () => {
    if (polygons.length === 0 && currentPoly.length === 0) return;
    setLoading(true); setDeadNodeId(null); setReroutedLinks([]); 
    const finalPolygons = [...polygons];
    if (currentPoly.length > 2) finalPolygons.push(currentPoly);
    try {
      const res = await axios.post('https://vyomsetu-backend.vercel.app/calculate-plan', { polygons: finalPolygons, critical_nodes: hospitals, terrain_type: selectedVillage.terrain });
      setTimeout(() => { setResult(res.data); setLoading(false); }, 800);
    } catch (err) { alert("Backend Offline!"); setLoading(false); }
  };

  // --- NEW: PDF GENERATOR FUNCTION ---
  const generatePDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const vyomCost = result.kpis.capex;
    const legacyCost = result.kpis.legacy_capex || (vyomCost * 1.65);
    const savings = legacyCost - vyomCost;
    const metrics = SOCIAL_METRICS[selectedVillage.id] || SOCIAL_METRICS['chitkul'];

    // Header
    doc.setFillColor(15, 23, 42); // Dark Blue
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(16, 185, 129); // Vyom Green
    doc.setFontSize(22);
    doc.text("VyomSetu GridOS", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("Detailed Project Report (DPR) - Network Resilience", 20, 30);

    // 1. Project Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("1. Project Scope", 20, 60);
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Region: ${selectedVillage.name}`, 20, 70);
    doc.text(`Terrain Topology: ${selectedVillage.terrain.toUpperCase()}`, 20, 78);
    doc.text(`Technology Deployed: ${result.terrain_breakdown.tech}`, 20, 86);
    doc.text(`Coverage Area: ${result.kpis.area.toFixed(2)} km sq`, 20, 94);

    // 2. Financials
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("2. Cost Benefit Analysis", 20, 110);
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Legacy Infrastructure CapEx: INR ${(legacyCost/100000).toFixed(2)} Lakhs`, 20, 120);
    doc.text(`VyomSetu Optimized CapEx: INR ${(vyomCost/100000).toFixed(2)} Lakhs`, 20, 128);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text(`NET SAVINGS: INR ${(savings/100000).toFixed(2)} Lakhs`, 20, 140);
    doc.setFont(undefined, 'normal');

    // 3. Social Impact
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("3. Social Return on Investment (ROI)", 20, 160);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(12);
    doc.text(`Population Covered: ${metrics.pop}`, 20, 170);
    doc.text(`Critical Access: ${metrics.hospitals} Hospitals, ${metrics.schools} Schools`, 20, 178);
    doc.text(`Strategic Impact: ${metrics.label}`, 20, 186);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Generated by VyomSetu AI | Confidential Government Document", 105, 280, null, null, "center");

    doc.save(`VyomSetu_DPR_${selectedVillage.id}.pdf`);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#09090b', color: 'white', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }}>
      <style>{styles}</style>
      
      <nav style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1000px', height: '60px', zIndex: 1000, borderRadius: '16px' }} className="glass-panel">
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 24px' }}>
             <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <img src="/logo.png" alt="VyomSetu" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
                <div style={{fontSize:'16px', fontWeight:'700', letterSpacing:'-0.5px', lineHeight:'1'}}>VyomSetu <br/> <span style={{opacity:0.5, fontWeight:'400', fontSize:'11px'}}>GridOS</span></div>
             </div>
             <div style={{display:'flex', background:'rgba(255,255,255,0.05)', padding:'4px', borderRadius:'10px', gap:'4px'}}>
                {[ {id: 1, label: "Phase 1", icon: PenTool}, {id: 2, label: "Phase 2", icon: ShieldAlert}, {id: 3, label: "Phase 3", icon: TrendingUp} ].map(tab => {
                    const isActive = activePhase === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActivePhase(tab.id)} style={{ background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', border:'none', color: isActive ? 'white' : '#a1a1aa', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'12px', transition: 'all 0.2s', display:'flex', alignItems:'center', gap:'6px' }}>
                            <tab.icon size={14} color={isActive ? (tab.id===2?'#f59e0b':tab.id===3?'#10b981':'#3b82f6') : '#71717a'}/> {tab.label}
                        </button>
                    )
                })}
             </div>
         </div>
      </nav>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <MapContainer center={[selectedVillage.lat, selectedVillage.lng]} zoom={15} style={{ width: '100%', height: '100%', background:'#050505' }} zoomControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri' opacity={0.75} />
          <MapController village={selectedVillage} />
          <DrawHandler mode={mode} onMapClick={handleMapClick} />
          {polygons.map((poly, i) => <Polygon key={i} positions={poly} pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.2, dashArray: '5,5' }} />)}
          {currentPoly.length > 0 && <Polyline positions={currentPoly} pathOptions={{ color: '#fbbf24', weight: 2, dashArray: '4, 4' }} />}
          {hospitals.map((h, i) => ( <CircleMarker key={`h-${i}`} center={[h.lat, h.lng]} radius={8} pathOptions={{ color: 'white', weight:2, fillColor: '#ef4444', fillOpacity: 1 }}> <Popup><strong>Anchor Node</strong></Popup> </CircleMarker> ))}
          
          {result && result.links && result.links.map((link, i) => ( <Polyline key={`link-${i}`} positions={[link.from, link.to]} pathOptions={{ color: '#fbbf24', weight: 1, opacity: 0.2 }} /> ))}
          {reroutedLinks.map((link, i) => ( <Polyline key={`reroute-${i}`} positions={[link.from, link.to]} pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8, 8', opacity: 1 }} /> ))}

          {/* VISUALS */}
          {disasterActive && result && result.towers.length > 0 && (
              <>
                <CircleMarker center={[result.towers[result.towers.length-1].lat, result.towers[result.towers.length-1].lng]} radius={effectRadius / 10} pathOptions={{ fillColor: disasterInfo?.visual_color || '#ef4444', color: disasterInfo?.visual_color || '#ef4444', weight: 1, fillOpacity: 0.3 }} />
                {dronePos && ( <CircleMarker center={dronePos} radius={6} pathOptions={{ color: 'white', weight: 2, fillColor: '#fbbf24', fillOpacity: 1 }}> <Tooltip permanent direction="top" offset={[0,-10]}>Drone</Tooltip> </CircleMarker> )}
              </>
          )}

          {/* TOWERS */}
          {result && result.towers.map((t, i) => {
             const isFloodVictim = disasterActive && i === result.towers.length - 1;
             const isDead = (t.id === deadNodeId) || (isFloodVictim && !isRestored);
             return (
                 <React.Fragment key={`t-${i}`}>
                    <CircleMarker center={[t.lat, t.lng]} radius={t.type==='master_hub' ? 60 : 30} pathOptions={{ color: isDead ? '#ef4444' : (isRestored && isFloodVictim ? '#34d399' : (t.type==='master_hub' ? '#3b82f6' : '#10b981')), weight: 1, fillOpacity: 0.1, dashArray: '4,4' }} />
                    <CircleMarker center={[t.lat, t.lng]} radius={5} pathOptions={{ color: 'white', weight:1, fillColor: isDead ? '#ef4444' : (isRestored && isFloodVictim ? '#34d399' : (t.type==='master_hub'?'#3b82f6':'#10b981')), fillOpacity: 1 }}>
                       <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={isDead || (isRestored && isFloodVictim)}>
                           <span style={{fontWeight:'bold', fontSize:'11px'}}>{isRestored && isFloodVictim ? "CONNECTED" : (isFloodVictim ? "BLACKOUT" : t.id)}</span>
                       </Tooltip>
                    </CircleMarker>
                 </React.Fragment>
             )
          })}
        </MapContainer>

        {/* PHASE 1 */}
        {activePhase === 1 && (
            <div style={{ position: 'absolute', top: '100px', left: '24px', width: '360px', zIndex: 1000 }} className="animate-slide-up">
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a1a1aa', letterSpacing:'1px', textTransform:'uppercase' }}>Target Sector</div>
                      <div style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(16, 185, 129, 0.1)', padding:'4px 8px', borderRadius:'12px', border:'1px solid rgba(16, 185, 129, 0.2)'}}><div className="status-dot"></div><span style={{fontSize:'10px', color:'#34d399', fontWeight:'700'}}>ONLINE</span></div>
                  </div>
                  <div style={{position:'relative', marginBottom:'20px'}}>
                      <MapPin size={16} color="#3b82f6" style={{position:'absolute', left:'14px', top:'14px', zIndex:10}}/>
                      <select onChange={(e) => { setSelectedVillage(VILLAGES.find(vil => vil.id === e.target.value)); }} style={{ width: '100%', padding: '14px 14px 14px 40px', background: '#09090b', color: 'white', border: '1px solid #27272a', borderRadius: '10px', fontSize:'13px', fontWeight:'500', outline:'none', cursor:'pointer', appearance:'none' }} value={selectedVillage.id}>
                          {VILLAGES.map(v => <option key={v.id} value={v.id} style={{background:'#09090b', color:'white'}}>{v.name}</option>)}
                      </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom:'24px' }}>
                    <button onClick={() => { setMode('draw'); setCurrentPoly([]); }} className="btn-hover" style={{ padding: '16px', borderRadius: '12px', border: mode === 'draw' ? '1px solid #3b82f6' : '1px solid #27272a', background: mode === 'draw' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', color: mode === 'draw' ? '#60a5fa' : '#a1a1aa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap:'8px', cursor:'pointer' }}><PenTool size={20} /> <span style={{fontSize:'12px', fontWeight:'600'}}>Draw Zone</span></button>
                    <button onClick={() => setMode('hospital')} className="btn-hover" style={{ padding: '16px', borderRadius: '12px', border: mode === 'hospital' ? '1px solid #ef4444' : '1px solid #27272a', background: mode === 'hospital' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)', color: mode === 'hospital' ? '#f87171' : '#a1a1aa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap:'8px', cursor:'pointer' }}><Anchor size={20} /> <span style={{fontSize:'12px', fontWeight:'600'}}>Set Anchor</span></button>
                  </div>
                  <button onClick={calculatePlan} disabled={loading} className="btn-hover" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: loading ? '#27272a' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: loading ? '#71717a' : 'white', fontWeight: '700', fontSize:'13px', cursor: loading ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', letterSpacing:'0.5px' }}>{loading ? <Activity size={16} className="animate-spin"/> : <Cpu size={16}/>}{loading ? "CALCULATING..." : "INITIATE OPTIMIZATION"}</button>
              </div>
              {result && (
                  <div className="animate-slide-up" style={{ marginTop: '16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                          {[ { val: result.terrain_breakdown.radius, label: "RANGE (KM)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" }, { val: result.kpis.area.toFixed(2), label: "AREA (KM²)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" }, { val: result.kpis.total_towers, label: "NODES", color: "#ffffff", border: "rgba(255, 255, 255, 0.1)" } ].map((stat, i) => ( <div key={i} className="glass-panel" style={{ padding:'12px', borderRadius:'12px', textAlign:'center', borderColor: stat.border }}><div style={{fontSize:'18px', fontWeight:'800', color: stat.color}}>{stat.val}</div><div style={{fontSize:'9px', color:'#a1a1aa', fontWeight:'700', marginTop:'4px'}}>{stat.label}</div></div> ))}
                      </div>
                      <div className="glass-panel" style={{ padding:'16px', borderRadius:'12px' }}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Mountain size={14} color="#60a5fa"/> <span style={{fontSize:'13px', fontWeight:'600', textTransform:'capitalize'}}>{selectedVillage.terrain} Terrain Analysis</span></div></div>
                          <div style={{fontSize:'11px', color:'#94a3b8', lineHeight:'1.5', marginBottom:'12px', fontStyle:'italic'}}>"{getTerrainDesc(selectedVillage.terrain)}"</div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Signal size={14} color="#10b981"/> <span style={{fontSize:'13px', fontWeight:'600', color:'#10b981'}}>{result.terrain_breakdown.tech}</span></div><div style={{fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(16, 185, 129, 0.1)', color:'#10b981', fontWeight:'700'}}>AUTO-SELECTED</div></div>
                      </div>
                      <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.6) 0%, rgba(6, 95, 70, 0.4) 100%)', padding:'20px', borderRadius:'12px', borderColor:'rgba(16, 185, 129, 0.3)' }}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}><div><div style={{fontSize:'11px', color:'#6ee7b7', fontWeight:'700', letterSpacing:'0.5px'}}>TOTAL PROJECT BUDGET</div><div style={{fontSize:'10px', color:'#a7f3d0', opacity:0.7, marginTop:'2px'}}>Hardware + Deployment</div></div><div style={{fontSize:'22px', fontWeight:'800', color:'white'}}>₹{(result.kpis.capex / 100000).toFixed(2)} L</div></div>
                          <div style={{fontSize:'9px', color:'#6ee7b7', opacity:0.6, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'8px', display:'flex', alignItems:'center', gap:'4px'}}><Info size={10}/><span>Formula: ({result.kpis.total_towers} Nodes × Unit Cost) + Base Infra</span></div>
                      </div>
                  </div>
              )}
            </div>
        )}

        {/* PHASE 2 */}
        {activePhase === 2 && (
            <StormShieldPanel result={result} selectedVillage={selectedVillage} onDisasterStart={(active, info) => { setDisasterActive(active); setDisasterInfo(info); }} onDroneArm={(armed) => setIsDroneArmed(armed)} />
        )}

        {/* --- PHASE 3: IMPACT ANALYSIS (RIGHT PANEL + PDF FIX) --- */}
        {activePhase === 3 && (
            <>
                {/* LEFT: NETWORK RESILIENCE */}
                <div style={{ position: 'absolute', top: '100px', left: '24px', width: '360px', zIndex: 1000 }} className="animate-slide-up">
                    <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#10b981', fontWeight:'700', fontSize:'16px', marginBottom:'20px'}}>
                            <ShieldCheck size={20}/> NETWORK RESILIENCE
                        </div>
                        
                        {!result ? (
                            <div style={{color:'#fca5a5', fontSize:'12px', background:'rgba(239, 68, 68, 0.1)', padding:'12px', borderRadius:'8px', textAlign:'center'}}>⚠ Initialize Network first.</div>
                        ) : (
                            <SelfHealingPanel result={result} onKillNode={(id) => setDeadNodeId(id)} onReroute={(links) => setReroutedLinks(links)} />
                        )}
                    </div>
                </div>

                {/* RIGHT: IMPACT REPORT & EXPORT */}
                {result && (
                    <div style={{ position: 'absolute', top: '100px', right: '24px', width: '360px', zIndex: 1000 }} className="animate-slide-up">
                        <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#60a5fa', fontWeight:'700', fontSize:'16px'}}>
                                    <BarChart3 size={20}/> PROJECT IMPACT
                                </div>
                            </div>

                            {(() => {
                                const vyomCost = result.kpis.capex || 0;
                                const standardCost = result.kpis.legacy_capex || (vyomCost * 1.65);
                                const savings = standardCost - vyomCost;
                                const metrics = SOCIAL_METRICS[selectedVillage.id] || SOCIAL_METRICS['chitkul'];

                                return (
                                    <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                                        {/* Economics */}
                                        <div style={{background:'rgba(255,255,255,0.03)', padding:'16px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)'}}>
                                            <div style={{fontSize:'10px', color:'#a1a1aa', fontWeight:'700', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px'}}><TrendingUp size={14}/> ECONOMIC SAVINGS</div>
                                            <div style={{marginBottom:'12px'}}>
                                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'4px', color:'#a1a1aa'}}><span>Legacy</span><span>₹{(standardCost/100000).toFixed(1)}L</span></div>
                                                <div style={{height:'4px', background:'rgba(255,255,255,0.1)', borderRadius:'2px', marginBottom:'8px'}}><div style={{width:'100%', height:'100%', background:'#52525b', borderRadius:'2px'}}></div></div>
                                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'4px', color:'#10b981', fontWeight:'700'}}><span>VyomSetu</span><span>₹{(vyomCost/100000).toFixed(1)}L</span></div>
                                                <div style={{height:'4px', background:'rgba(16, 185, 129, 0.15)', borderRadius:'2px'}}>
                                                    <div style={{width:`${Math.min((vyomCost/standardCost)*100, 100)}%`, height:'100%', background:'#10b981', borderRadius:'2px', transition: 'width 1s'}}></div>
                                                </div>
                                            </div>
                                            <div style={{textAlign:'right', fontSize:'14px', fontWeight:'700', color:'#34d399'}}>
                                                SAVED ₹{(savings/100000).toFixed(1)}L
                                            </div>
                                        </div>

                                        {/* Social Stats */}
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                                            <div style={{background:'rgba(59, 130, 246, 0.1)', padding:'12px', borderRadius:'10px', border:'1px solid rgba(59, 130, 246, 0.2)'}}>
                                                <div style={{fontSize:'10px', color:'#93c5fd', marginBottom:'4px', display:'flex', alignItems:'center', gap:'4px'}}><Users size={12}/> POPULATION</div>
                                                <div style={{fontSize:'16px', fontWeight:'800', color:'white'}}>{metrics.pop}</div>
                                            </div>
                                            <div style={{background:'rgba(59, 130, 246, 0.1)', padding:'12px', borderRadius:'10px', border:'1px solid rgba(59, 130, 246, 0.2)'}}>
                                                <div style={{fontSize:'10px', color:'#93c5fd', marginBottom:'4px', display:'flex', alignItems:'center', gap:'4px'}}><Building size={12}/> FACILITIES</div>
                                                <div style={{fontSize:'16px', fontWeight:'800', color:'white'}}>{metrics.hospitals}H / {metrics.schools}S</div>
                                            </div>
                                        </div>

                                        {/* Education Badge */}
                                        <div style={{fontSize:'11px', color:'#c084fc', display:'flex', alignItems:'center', gap:'8px', padding:'10px', background:'rgba(192, 132, 252, 0.1)', borderRadius:'8px', border:'1px solid rgba(192, 132, 252, 0.2)'}}>
                                            <GraduationCap size={16}/> {metrics.label}
                                        </div>

                                        {/* --- REAL EXPORT FUNCTION --- */}
                                        <div style={{display:'flex', justifyContent:'flex-end', marginTop:'8px'}}>
                                            <button onClick={generatePDF} className="btn-hover" style={{ padding: '12px 20px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', fontWeight: '700', fontSize:'12px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}>
                                                <Download size={16}/> EXPORT REPORT
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}