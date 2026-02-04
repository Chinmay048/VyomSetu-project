import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    ShieldAlert, Activity, Radio, Lock, Unlock, CloudRain, 
    AlertTriangle, Wifi, Zap, Send, Clock, CheckCircle, Flame, Snowflake, Mountain 
} from 'lucide-react';

export default function StormShieldPanel({ result, selectedVillage, onDisasterStart, onDroneArm }) {
    const [weatherData, setWeatherData] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [logs, setLogs] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [displayTime, setDisplayTime] = useState("");
    const [hasImpacted, setHasImpacted] = useState(false);
    
    // STATES: PREPARING -> READY (at 10s) -> ARMED (User Clicked)
    const [droneState, setDroneState] = useState("PREPARING"); 
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Reset
    useEffect(() => {
        if (!isSimulating) {
            setDisplayTime("");
            setTimeLeft(null);
            setHasImpacted(false);
            setDroneState("PREPARING");
            if(onDisasterStart) onDisasterStart(false, null);
        }
    }, [isSimulating]);

    // COUNTDOWN LOGIC
    useEffect(() => {
        if (weatherData?.impact_timestamp && isSimulating) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const target = new Date(weatherData.impact_timestamp).getTime();
                const diff = target - now;
                const secondsLeft = Math.floor(diff / 1000);

                setTimeLeft(secondsLeft);

                // --- LOGIC: ENABLE BUTTON AT 10 SECONDS ---
                if (secondsLeft <= 10 && secondsLeft > 0 && droneState === "PREPARING") {
                    setDroneState("READY");
                    setLogs(prev => [`[SYSTEM] DRONE FLIGHT SYSTEMS ONLINE. READY TO LAUNCH.`, ...prev]);
                }

                // --- LOGIC: IMPACT AT 0 SECONDS ---
                if (diff <= 0) {
                    setDisplayTime("00:00");
                    if (!hasImpacted) {
                        setHasImpacted(true);
                        setLogs(prev => [`[CRITICAL] IMPACT CONFIRMED. NODE FAILURE DETECTED.`, ...prev]);
                        // Trigger Map Animation (pass the specific disaster info)
                        if(onDisasterStart) onDisasterStart(true, weatherData);
                    }
                } else {
                    setDisplayTime(`00:${secondsLeft.toString().padStart(2, '0')}`);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, [weatherData, isSimulating, hasImpacted, droneState]);

    // HANDLER: ARM THE DRONE
    const handleArmDrone = () => {
        setDroneState("ARMED");
        setLogs(prev => [`[SYSTEM] DRONE SQUADRON ARMED. AUTO-DEPLOY ON IMPACT.`, ...prev]);
        if (onDroneArm) onDroneArm(true); 
    };

    // POLLING
    useEffect(() => {
        let interval;
        if (result) {
            checkStormShield(isSimulating);
            interval = setInterval(() => {
                checkStormShield(isSimulating);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isSimulating, result, selectedVillage]);

    const checkStormShield = async (simulate) => {
        try {
            if (!result || !result.terrain_breakdown) return;
            const techType = encodeURIComponent(result.terrain_breakdown.tech);
            const res = await axios.get(`http://127.0.0.1:8000/weather-resilience/${selectedVillage.id}?tech_type=${techType}&simulate=${simulate}`);
            
            if (!weatherData || weatherData.timestamp !== res.data.timestamp) {
                setWeatherData(res.data);
                const time = new Date().toLocaleTimeString('en-US', { hour12: false });
                if(!hasImpacted) setLogs(prev => [`[${time}] ${res.data.condition.toUpperCase()} DETECTED`, ...prev].slice(0, 6));
            }
        } catch(err) { console.error(err); }
    };

    // Helper for Icon
    const getIcon = (type) => {
        if (!type) return <CloudRain size={14}/>;
        if (type.includes("Fire")) return <Flame size={14}/>;
        if (type.includes("Blizzard")) return <Snowflake size={14}/>;
        if (type.includes("Landslide")) return <Mountain size={14}/>;
        return <CloudRain size={14}/>;
    }

    if (!result) return null;

    return (
        <div className="animate-slide-up" style={{ position: 'absolute', top: '100px', left: '24px', width: '380px', zIndex: 1000 }}>
           <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px', background: weatherData?.is_sos_triggered ? 'rgba(69, 10, 10, 0.95)' : undefined, borderColor: weatherData?.is_sos_triggered ? '#ef4444' : undefined, transition: 'all 0.5s ease', boxShadow: weatherData?.is_sos_triggered ? '0 0 40px rgba(239, 68, 68, 0.4)' : undefined }}>
               
               <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'10px', color: weatherData?.is_sos_triggered ? '#fca5a5' : '#f59e0b', fontWeight:'800', fontSize:'16px', letterSpacing:'0.5px'}}>
                      <ShieldAlert size={20}/> STORM SHIELD AI
                   </div>
                   <button onClick={() => setIsSimulating(!isSimulating)} className="btn-hover" style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', background: isSimulating ? 'white' : 'rgba(255,255,255,0.1)', color: isSimulating ? 'black' : 'white', fontSize:'11px', fontWeight:'800', cursor: 'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                      <Activity size={12} className={isSimulating ? "animate-spin" : ""} />
                      {isSimulating ? "LIVE DEMO" : "START TEST"}
                   </button>
               </div>

               {weatherData && (
                   <div className="animate-slide-up" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                           <div className="glass-panel" style={{padding:'12px', borderRadius:'12px', textAlign:'center', borderColor:'rgba(255,255,255,0.1)'}}><div style={{fontSize:'10px', opacity:0.6, fontWeight:'700', marginBottom:'4px'}}>CONDITION</div><div style={{fontSize:'13px', fontWeight:'700', color:'white', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>{getIcon(weatherData.condition)} {weatherData.condition.split(' ')[0]}</div></div>
                           <div className="glass-panel" style={{padding:'12px', borderRadius:'12px', textAlign:'center', borderColor:'rgba(255,255,255,0.1)'}}><div style={{fontSize:'10px', opacity:0.6, fontWeight:'700', marginBottom:'4px'}}>SEVERITY</div><div style={{fontSize:'18px', fontWeight:'800', color: weatherData.severity_score > 70 ? '#ef4444' : '#10b981'}}>{weatherData.severity_score}%</div></div>
                       </div>

                       <div className="terminal-text" style={{background:'#09090b', padding:'12px', borderRadius:'12px', fontSize:'10px', color: hasImpacted ? '#ef4444' : '#10b981', height:'80px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', lineHeight:'1.6', boxShadow:'inset 0 2px 10px rgba(0,0,0,0.5)'}}>{logs.map((log, i) => <div key={i} style={{opacity: 1 - (i*0.15)}}>{`> ${log}`}</div>)}<div ref={logsEndRef} /></div>
                       
                       {weatherData.is_sos_triggered && (
                           <div className="animate-slide-up">
                               {/* Alert Box */}
                               <div style={{padding:'12px', background: hasImpacted ? '#b91c1c' : 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)', borderRadius:'8px', color:'white', textAlign:'center', fontWeight:'800', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 20px rgba(239, 68, 68, 0.5)', marginBottom:'12px', animation: hasImpacted ? 'none' : 'pulse-red 1s infinite'}}>
                                   <AlertTriangle size={16} fill="white"/> 
                                   <div>{hasImpacted ? "CRITICAL FAILURE DETECTED" : `IMPACT IN: ${displayTime}`}</div>
                               </div>

                               {/* --- SMART BUTTON --- */}
                               <button 
                                   onClick={handleArmDrone}
                                   disabled={droneState === "PREPARING" || droneState === "ARMED"}
                                   className="btn-hover"
                                   style={{
                                       width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                                       // Grey -> Green (Ready) -> Blue (Armed)
                                       background: droneState === "PREPARING" ? '#374151' : (droneState === "READY" ? '#10b981' : '#3b82f6'),
                                       color: droneState === "PREPARING" ? '#9ca3af' : 'white', 
                                       fontWeight: '800', fontSize:'12px', 
                                       cursor: droneState === "READY" ? 'pointer' : 'default',
                                       display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                                       boxShadow: droneState === "READY" ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                                       transition: 'all 0.3s ease'
                                   }}
                               >
                                   {droneState === "PREPARING" && <Clock size={16} className="animate-pulse"/>}
                                   {droneState === "READY" && <Send size={16} className="animate-bounce"/>}
                                   {droneState === "ARMED" && <CheckCircle size={16}/>}
                                   
                                   {droneState === "PREPARING" ? `PREPARING DRONE (${displayTime})` : 
                                    droneState === "READY" ? "DRONE READY - LAUNCH" : "DRONE ARMED - STANDBY"}
                               </button>
                           </div>
                       )}
                   </div>
               )}
           </div>
        </div>
    );
}