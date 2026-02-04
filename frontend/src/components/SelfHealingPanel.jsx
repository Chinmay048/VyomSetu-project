import React, { useState } from 'react';
import axios from 'axios';
import { Activity, AlertOctagon, RefreshCw } from 'lucide-react';

export default function SelfHealingPanel({ result, onKillNode, onReroute }) {
    const [selectedNode, setSelectedNode] = useState("");
    const [healingStatus, setHealingStatus] = useState("IDLE");
    const [logs, setLogs] = useState([]);

    const handleKill = async () => {
        if (!selectedNode) return;
        setHealingStatus("HEALING");
        
        onKillNode(selectedNode); 
        
        try {
            const res = await axios.post('https://vyomsetu-backend.vercel.app/reroute-network', {
                towers: result.towers,
                dead_node_id: selectedNode
            });
            
            setTimeout(() => {
                setHealingStatus("HEALED");
                setLogs(prev => [`NODE ${selectedNode} FAILED`, `REROUTING MESH...`, `PATH RESTORED VIA NEIGHBORS`, ...prev]);
                if (res.data.new_links && onReroute) {
                    onReroute(res.data.new_links);
                }
            }, 1500);
            
        } catch (err) { 
            console.error(err);
            setHealingStatus("ERROR"); 
        }
    };

    if (!result) return null;

    return (
        <div className="animate-slide-up" style={{ width: '100%' }}>
            
            {/* CONTROL UNIT */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)', 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid rgba(239, 68, 68, 0.15)',
                marginBottom: '12px',
                boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.05)'
            }}>
                <div style={{fontSize:'10px', fontWeight:'800', color:'#fca5a5', marginBottom:'12px', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'6px', letterSpacing:'1px'}}>
                    <AlertOctagon size={12}/> Resilience Test
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                    <select 
                        onChange={(e) => { setSelectedNode(e.target.value); setHealingStatus("IDLE"); }} 
                        style={{
                            flex:1, padding:'10px 12px', background:'#09090b', 
                            border:'1px solid #27272a', borderRadius:'8px', 
                            color:'white', fontSize:'12px', outline:'none', cursor:'pointer',
                            fontFamily: 'inherit'
                        }}
                    >
                        <option value="">Select Node to Fail...</option>
                        {result.towers.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                    </select>
                    <button 
                        onClick={handleKill} 
                        disabled={!selectedNode || healingStatus === "HEALING"} 
                        className="btn-hover"
                        style={{
                            padding:'10px 20px', 
                            background: healingStatus === "HEALING" ? '#27272a' : '#ef4444', 
                            border:'none', borderRadius:'8px', 
                            color: healingStatus === "HEALING" ? '#71717a' : 'white', 
                            fontWeight:'700', fontSize:'11px', cursor:'pointer',
                            boxShadow: healingStatus === "HEALING" ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        {healingStatus === "HEALING" ? <RefreshCw size={14} className="animate-spin"/> : "KILL"}
                    </button>
                </div>
            </div>

            {/* LIVE TERMINAL */}
            {healingStatus !== "IDLE" && (
                <div className="terminal-text" style={{
                    background:'#000000', padding:'14px', borderRadius:'10px', 
                    fontSize:'10px', color: healingStatus==="HEALED"?'#34d399':'#fca5a5', 
                    border:'1px solid rgba(255,255,255,0.08)', marginBottom:'16px', 
                    maxHeight:'80px', overflowY:'auto', boxShadow:'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    {healingStatus === "HEALING" ? 
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Activity size={12} className="animate-spin"/> SYSTEM ALERT: NODE FAILURE DETECTED...</div> 
                        : logs.map((l, i) => <div key={i} style={{marginBottom:'4px', opacity: 1 - (i * 0.2)}}>{`> ${l}`}</div>)
                    }
                </div>
            )}
        </div>
    );
}