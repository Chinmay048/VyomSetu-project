import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Wifi, Plus, PenTool, Globe, CheckCircle, Calculator, X, Cpu, Anchor, 
  CloudRain, ShieldAlert, Activity, Radio, Lock, Unlock, 
  TrendingUp, FileText, Plane, ArrowRight, Zap, Mountain, Signal, DollarSign 
} from 'lucide-react';

const VILLAGES = [
  { id: 'chitkul', name: 'Chitkul (Snow/Remote)', lat: 31.3526, lng: 78.4379, terrain: 'snow' },
  { id: 'kalpa', name: 'Kalpa (Rocky/Mountain)', lat: 31.5372, lng: 78.2562, terrain: 'rocky' },
  { id: 'langza', name: 'Langza (Valley/Flat)', lat: 32.2656, lng: 78.0643, terrain: 'valley' }
];

function MapController({ village }) {
  const map = useMap();
  useEffect(() => { map.flyTo([village.lat, village.lng], 15, { duration: 2 }); }, [village.id]);
  return null;
}

function DrawHandler({ mode, onMapClick }) {
  useMapEvents({ click(e) { if (mode !== 'view') onMapClick(e.latlng); } });
  return null;
}

export default function Dashboard() {
  const [activePhase, setActivePhase] = useState(1);
  const [selectedVillage, setSelectedVillage] = useState(VILLAGES[0]);
  const [mode, setMode] = useState('view');
  
  // MULTI-POLYGON STATE
  const [polygons, setPolygons] = useState([]); 
  const [currentPoly, setCurrentPoly] = useState([]); 
  
  const [hospitals, setHospitals] = useState([]);
  const [result, setResult] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState([]); 
  const [dronePath, setDronePath] = useState([]);

  useEffect(() => {
    let interval;
    if (activePhase === 2 && result && isSimulating) {
        interval = setInterval(() => checkStormShield(true), 1500); 
    } else if (activePhase === 2 && result && !isSimulating) {
        checkStormShield(false);
    }
    return () => clearInterval(interval);
  }, [activePhase, isSimulating, result]);

  const handleMapClick = (latlng) => {
    if (mode === 'hospital') {
      setHospitals([...hospitals, { lat: latlng.lat, lng: latlng.lng }]);
      setMode('view');
    } 
    else if (mode === 'draw') {
      if (currentPoly.length > 2) {
        const start = currentPoly[0];
        const dist = Math.sqrt(Math.pow(latlng.lat - start.lat, 2) + Math.pow(latlng.lng - start.lng, 2));
        if (dist < 0.001) { 
            // Close Loop: Add to finished polygons
            setPolygons([...polygons, currentPoly]);
            setCurrentPoly([]); 
            return; 
        }
      }
      setCurrentPoly([...currentPoly, { lat: latlng.lat, lng: latlng.lng }]);
    }
  };

  const calculatePlan = async () => {
    if (polygons.length === 0 && currentPoly.length === 0) return;
    setLoading(true);
    
    // Combine finished and current
    const finalPolygons = [...polygons];
    if (currentPoly.length > 2) finalPolygons.push(currentPoly);

    try {
      const res = await axios.post('http://127.0.0.1:8000/calculate-plan', { 
        polygons: finalPolygons, 
        critical_nodes: hospitals, 
        terrain_type: selectedVillage.terrain 
      });
      setResult(res.data);
      if (res.data.towers.length > 1) {
          const hub = res.data.towers.find(t => t.type === 'anchor') || res.data.towers[0];
          const end = res.data.towers[res.data.towers.length - 1];
          setDronePath([[hub.lat, hub.lng], [end.lat, end.lng]]);
      }
    } catch (err) { alert("Backend Offline!"); }
    setLoading(false);
  };

  const checkStormShield = async (simulate) => {
    try {
        if (!result || !result.terrain_breakdown) return;
        const res = await axios.get(`http://127.0.0.1:8000/weather-resilience/${selectedVillage.id}/${result.terrain_breakdown.tech}?simulate=${simulate}`);
        setWeatherData(res.data);
        const newLog = `[${res.data.timestamp}] SIGNAL: ${res.data.resilience_score}% | PKT_LOSS: ${100-res.data.resilience_score}%`;
        setLogs(prev => [newLog, ...prev].slice(0, 4));
    } catch(err) { }
  };

  const clearAll = () => {
    setPolygons([]); setCurrentPoly([]); setResult(null); setMode('view'); setHospitals([]); setWeatherData(null);
  };

  const getLegacyCost = () => {
      if (!result) return 0;
      return (result.kpis.total_towers * 2500000); 
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', color: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* NAVBAR */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64px', zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding:'0 24px' }}>
         <div style={{fontSize:'18px', fontWeight:'bold', color:'white', display:'flex', alignItems:'center', gap:'10px'}}>
            <Globe size={20} color="#3b82f6"/> VyomSetu <span style={{opacity:0.6}}>GridOS</span>
         </div>
         <div style={{display:'flex', gap:'20px'}}>
            <button onClick={() => setActivePhase(1)} style={{ background:'transparent', border:'none', color: activePhase===1 ? '#3b82f6' : '#a1a1aa', borderBottom: activePhase===1 ? '2px solid #3b82f6' : 'none', padding:'10px', cursor:'pointer', fontWeight:'600'}}>Phase 1: Planning</button>
            <button onClick={() => setActivePhase(2)} style={{ background:'transparent', border:'none', color: activePhase===2 ? '#f59e0b' : '#a1a1aa', borderBottom: activePhase===2 ? '2px solid #f59e0b' : 'none', padding:'10px', cursor:'pointer', fontWeight:'600'}}>Phase 2: StormShield</button>
            <button onClick={() => setActivePhase(3)} style={{ background:'transparent', border:'none', color: activePhase===3 ? '#10b981' : '#a1a1aa', borderBottom: activePhase===3 ? '2px solid #10b981' : 'none', padding:'10px', cursor:'pointer', fontWeight:'600'}}>Phase 3: Impact</button>
         </div>
      </nav>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <MapContainer center={[selectedVillage.lat, selectedVillage.lng]} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri' />
          <MapController village={selectedVillage} />
          <DrawHandler mode={mode} onMapClick={handleMapClick} />

          {/* RENDER ALL POLYGONS */}
          {polygons.map((poly, i) => (
             <Polygon key={i} positions={poly} pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.15 }} />
          ))}
          {/* CURRENT DRAWING */}
          {currentPoly.length > 0 && <Polyline positions={currentPoly} pathOptions={{ color: '#fbbf24', weight: 3, dashArray: '6, 6' }} />}
          
          {activePhase === 3 && dronePath.length > 0 && ( <Polyline positions={dronePath} pathOptions={{ color: '#10b981', weight: 2, dashArray: '10, 10' }} /> )}

          {hospitals.map((h, i) => (
             <CircleMarker key={`h-${i}`} center={[h.lat, h.lng]} radius={10} pathOptions={{ color: 'white', weight:2, fillColor: '#ef4444', fillOpacity: 1 }}>
                <Popup>Critical Anchor Target</Popup>
             </CircleMarker>
          ))}

          {result && result.links && result.links.map((link, i) => (
             <Polyline key={`link-${i}`} positions={[link.from, link.to]} pathOptions={{ color: '#fbbf24', weight: 2, dashArray: '5, 5', opacity: 0.8 }} />
          ))}

          {result && result.towers.map((t, i) => (
             <React.Fragment key={`t-${i}`}>
                <CircleMarker center={[t.lat, t.lng]} radius={t.type==='anchor' ? 60 : 40} pathOptions={{ color: t.type==='anchor' ? '#3b82f6' : '#10b981', weight: 1, fillOpacity: 0.2, dashArray: '4,4' }} />
                <CircleMarker center={[t.lat, t.lng]} radius={6} pathOptions={{ color: 'white', weight:1, fillColor: t.type==='anchor'?'#3b82f6':'#10b981', fillOpacity: 1 }} zIndexOffset={1000}>
                   <Popup><strong>{t.type.toUpperCase()}</strong><br/>{t.tech}</Popup>
                </CircleMarker>
             </React.Fragment>
          ))}
        </MapContainer>

        {/* --- PHASE 1 PANEL --- */}
        {activePhase === 1 && (
            <div style={{ position: 'absolute', top: '80px', left: '24px', width: '400px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{background: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px'}}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#71717a', marginBottom: '8px', display:'flex', justifyContent:'space-between' }}>
                      <span>TARGET SECTOR</span>
                      <span style={{cursor:'pointer', color:'#ef4444'}} onClick={clearAll}>RESET MAP</span>
                  </div>
                  <select onChange={(e) => { setSelectedVillage(VILLAGES.find(vil => vil.id === e.target.value)); clearAll(); }} style={{ width: '100%', padding: '12px', background: '#18181b', color: 'white', border: '1px solid #27272a', borderRadius: '8px', fontWeight: 'bold', marginBottom:'12px' }}>
                      {VILLAGES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button onClick={() => { setMode('draw'); setCurrentPoly([]); }} style={{ padding: '12px', borderRadius: '8px', border: mode === 'draw' ? '1px solid #3b82f6' : '1px solid #3f3f46', background: mode === 'draw' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: mode === 'draw' ? '#60a5fa' : 'white', display: 'flex', alignItems: 'center', justifyContent:'center', gap:'6px', cursor:'pointer' }}><PenTool size={16} /> Draw Region</button>
                    <button onClick={() => setMode('hospital')} style={{ padding: '12px', borderRadius: '8px', border: mode === 'hospital' ? '1px solid #ef4444' : '1px solid #3f3f46', background: mode === 'hospital' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: mode === 'hospital' ? '#fca5a5' : 'white', display: 'flex', alignItems: 'center', justifyContent:'center', gap:'6px', cursor:'pointer' }}><Anchor size={16} /> Add Anchor</button>
                  </div>
                  <button onClick={calculatePlan} disabled={loading} style={{ marginTop: '12px', width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? "OPTIMIZING..." : "CALCULATE PLAN"}</button>
              </div>

              {result && (
                  <div className="animate-fade-in-up" style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                          <div style={{background:'rgba(0,0,0,0.8)', padding:'10px', borderRadius:'8px', textAlign:'center', border:'1px solid #3b82f6'}}>
                              <div style={{fontSize:'18px', fontWeight:'bold', color:'#60a5fa'}}>{result.terrain_breakdown.radius} <span style={{fontSize:'12px'}}>km</span></div>
                              <div style={{fontSize:'9px', color:'#93c5fd', fontWeight:'bold'}}>EFF. RADIUS</div>
                          </div>
                          <div style={{background:'rgba(0,0,0,0.8)', padding:'10px', borderRadius:'8px', textAlign:'center', border:'1px solid #10b981'}}>
                              <div style={{fontSize:'18px', fontWeight:'bold', color:'#34d399'}}>{(result.kpis.area / (result.kpis.total_towers || 1)).toFixed(2)}</div>
                              <div style={{fontSize:'9px', color:'#6ee7b7', fontWeight:'bold'}}>KM² / NODE</div>
                          </div>
                          <div style={{background:'rgba(0,0,0,0.8)', padding:'10px', borderRadius:'8px', textAlign:'center', border:'1px solid #333'}}>
                              <div style={{fontSize:'18px', fontWeight:'bold', color:'white'}}>{result.kpis.total_towers}</div>
                              <div style={{fontSize:'9px', color:'#a1a1aa'}}>ACTIVE</div>
                          </div>
                      </div>

                      <div style={{ background: 'rgba(30, 58, 138, 0.4)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(4px)' }}>
                          <div style={{fontSize:'10px', fontWeight:'bold', color:'#93c5fd', marginBottom:'12px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px'}}><Cpu size={14}/> Engineering</div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
                              <div style={{background:'rgba(0,0,0,0.3)', padding:'8px', borderRadius:'8px'}}>
                                  <div style={{fontSize:'10px', color:'#94a3b8'}}>TERRAIN</div>
                                  <div style={{fontSize:'13px', fontWeight:'bold', color:'white', display:'flex', alignItems:'center', gap:'6px', textTransform:'capitalize'}}><Mountain size={14} color="#60a5fa"/> {selectedVillage.terrain}</div>
                              </div>
                              <div style={{background:'rgba(0,0,0,0.3)', padding:'8px', borderRadius:'8px'}}>
                                  <div style={{fontSize:'10px', color:'#94a3b8'}}>BACKBONE</div>
                                  <div style={{fontSize:'13px', fontWeight:'bold', color:'white', display:'flex', alignItems:'center', gap:'6px'}}><Signal size={14} color="#60a5fa"/> {result.terrain_breakdown.tech.split(' ')[0]}</div>
                              </div>
                          </div>
                      </div>

                      <div style={{ background: 'rgba(6, 78, 59, 0.4)', border: '1px solid #059669', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(4px)' }}>
                          <div style={{fontSize:'10px', fontWeight:'bold', color:'#6ee7b7', marginBottom:'12px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px'}}><Activity size={14}/> Cost Analysis</div>
                          <div style={{background:'#064e3b', padding:'12px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #059669'}}>
                              <div style={{fontSize:'11px', color:'#a7f3d0', fontWeight:'600'}}>TOTAL BUDGET</div>
                              <div style={{fontSize:'18px', fontWeight:'800', color:'#fbbf24', fontFamily:'monospace'}}>₹{(result.kpis.capex / 100000).toFixed(2)} L</div>
                          </div>
                      </div>
                      
                      <div style={{background:'black', padding:'10px', borderRadius:'8px', fontFamily:'monospace', fontSize:'10px', color:'#34d399', height:'80px', overflowY:'scroll', border:'1px solid #333'}}>
                           {result.logs.map((log, i) => <div key={i} style={{marginBottom:'2px'}}>{`> ${log}`}</div>)}
                      </div>
                  </div>
              )}
            </div>
        )}

        {/* --- PHASE 2 PANEL --- */}
        {activePhase === 2 && (
            <div style={{ position: 'absolute', top: '90px', left: '24px', width: '400px', zIndex: 1000, background: weatherData?.is_sos_triggered ? 'rgba(69, 10, 10, 0.95)' : 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: weatherData?.is_sos_triggered ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'background 0.5s' }}>
               <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'10px', color: weatherData?.is_sos_triggered ? 'white' : '#f59e0b', fontWeight:'bold', fontSize:'18px'}}>
                      <ShieldAlert size={24}/> StormShield
                   </div>
                   {result && (
                       <button onClick={() => setIsSimulating(!isSimulating)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: isSimulating ? (weatherData?.is_sos_triggered ? 'white' : '#f59e0b') : 'rgba(255,255,255,0.1)', color: isSimulating ? (weatherData?.is_sos_triggered ? '#ef4444' : 'black') : (weatherData?.is_sos_triggered ? 'white' : '#f59e0b'), fontSize:'11px', fontWeight:'800', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px', transition: 'all 0.3s ease', boxShadow: isSimulating ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none' }}>
                          <Activity size={14} className={isSimulating ? "animate-pulse" : ""}/>
                          {isSimulating ? "LIVE FEED" : "TEST MODE"}
                       </button>
                   )}
               </div>
               {!result && <div style={{color:'#f87171', fontSize:'12px'}}>⚠ Initialize Network in Phase 1 first.</div>}
               {weatherData && (
                   <div className="animate-fade-in" style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.1)', padding:'16px', borderRadius:'12px'}}>
                           <div><div style={{fontSize:'10px', opacity:0.7}}>CONDITION</div><div style={{fontSize:'18px', fontWeight:'bold'}}>{weatherData.condition}</div></div>
                           <div style={{textAlign:'right'}}><div style={{fontSize:'24px', fontWeight:'bold'}}>{weatherData.severity_score}%</div><div style={{fontSize:'10px', opacity:0.7}}>SEVERITY</div></div>
                       </div>
                       <div style={{background:'rgba(0,0,0,0.3)', padding:'16px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)'}}>
                           <div style={{fontSize:'11px', fontWeight:'bold', color:'#a1a1aa', marginBottom:'10px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px'}}><Radio size={14}/> Traffic Shaping Policy</div>
                           <div style={{marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                               <span style={{padding:'4px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold', background: weatherData.is_sos_triggered ? '#ef4444' : '#064e3b', color:'white'}}>{weatherData.network_policy.status}</span>
                               <span style={{fontSize:'11px', color:'#a1a1aa'}}>{weatherData.network_policy.bandwidth_cap}% Cap</span>
                           </div>
                           <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                               <div style={{background:'rgba(16, 185, 129, 0.1)', padding:'8px', borderRadius:'6px'}}><div style={{fontSize:'10px', color:'#34d399', fontWeight:'bold', marginBottom:'4px'}}>✔ ALLOWED</div>{weatherData.network_policy.allowed_apps.slice(0,3).map(app => <div key={app} style={{fontSize:'11px', opacity:0.8}}>• {app}</div>)}</div>
                               <div style={{background:'rgba(239, 68, 68, 0.1)', padding:'8px', borderRadius:'6px'}}><div style={{fontSize:'10px', color:'#f87171', fontWeight:'bold', marginBottom:'4px'}}>✖ BLOCKED</div>{weatherData.network_policy.blocked_apps.length > 0 ? weatherData.network_policy.blocked_apps.slice(0,3).map(app => <div key={app} style={{fontSize:'11px', opacity:0.8}}>• {app}</div>) : <div style={{fontSize:'10px', opacity:0.5}}>None</div>}</div>
                           </div>
                       </div>
                       <div style={{background:'black', padding:'10px', borderRadius:'8px', fontFamily:'monospace', fontSize:'10px', color:'#34d399', height:'80px', overflow:'hidden', border:'1px solid #333'}}>{logs.map((log, i) => <div key={i} style={{opacity: 1 - (i*0.2)}}>{log}</div>)}</div>
                       {weatherData.is_sos_triggered && <div className="animate-pulse" style={{padding:'12px', background:'#7f1d1d', border:'1px solid #ef4444', borderRadius:'8px', color:'white', textAlign:'center', fontWeight:'bold', fontSize:'13px'}}>⚠ {weatherData.alert_message}</div>}
                   </div>
               )}
            </div>
        )}

        {/* --- PHASE 3 PANEL --- */}
        {activePhase === 3 && (
            <div style={{ position: 'absolute', top: '90px', left: '24px', width: '400px', zIndex: 1000, background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#10b981', fontWeight:'bold', fontSize:'18px'}}><TrendingUp size={24}/> Impact Analysis</div>
                {!result ? (<div style={{color:'#f87171', fontSize:'12px'}}>⚠ Initialize Network in Phase 1 first.</div>) : (
                    <>
                        <div style={{background:'rgba(255,255,255,0.05)', padding:'20px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)'}}>
                            <div style={{fontSize:'11px', color:'#a1a1aa', marginBottom:'10px'}}>PROJECTED CAPEX COMPARISON</div>
                            <div style={{display:'flex', alignItems:'flex-end', gap:'10px', marginBottom:'10px'}}>
                                <div style={{flex:1}}><div style={{height:'40px', background:'#3f3f46', borderRadius:'4px', width:'100%'}}></div><div style={{fontSize:'10px', marginTop:'6px'}}>Standard</div><div style={{fontSize:'12px', fontWeight:'bold'}}>₹{(getLegacyCost()/100000).toFixed(1)}L</div></div>
                                <div style={{flex:1}}><div style={{height:'15px', background:'#10b981', borderRadius:'4px', width:'100%', marginTop:'25px'}}></div><div style={{fontSize:'10px', marginTop:'6px', color:'#10b981'}}>VyomSetu</div><div style={{fontSize:'12px', fontWeight:'bold', color:'#10b981'}}>₹{(result.kpis.capex/100000).toFixed(1)}L</div></div>
                            </div>
                            <div style={{padding:'10px', background:'rgba(16, 185, 129, 0.1)', borderRadius:'8px', color:'#34d399', fontSize:'13px', textAlign:'center', fontWeight:'bold'}}>SAVINGS: ₹{((getLegacyCost() - result.kpis.capex)/100000).toFixed(1)} Lakhs (65%)</div>
                        </div>
                        <div style={{background:'rgba(0,0,0,0.3)', padding:'16px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)'}}>
                            <div style={{fontSize:'11px', fontWeight:'bold', color:'#a1a1aa', marginBottom:'12px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px'}}><Plane size={14}/> Medical Drone Corridor</div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'8px'}}><span>Est. Road Time</span><span style={{color:'#f87171'}}>4 Hours</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:'bold'}}><span>Drone Flight Time</span><span style={{color:'#34d399'}}>14 Mins</span></div>
                        </div>
                        <button onClick={() => alert("DPR Sent")} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: 'none', background: '#047857', color: 'white', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}><FileText size={18}/> EXPORT GOVT PROPOSAL</button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}