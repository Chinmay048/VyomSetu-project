import React from 'react';
import { 
  Globe, ShieldAlert, Zap, ArrowRight, Activity, 
  Map, Server, Cpu, CheckCircle 
} from 'lucide-react';

export default function LandingPage({ onLaunch }) {
  return (
    <div style={{ width: '100%', position: 'relative', color: 'white', fontFamily: '"Inter", sans-serif' }}>
      
      {/* BACKGROUND EFFECTS (FIXED POSITION) */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', animation: 'pulse 8s infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', animation: 'pulse 10s infinite reverse' }}></div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } 100% { transform: scale(1); opacity: 0.5; } }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); transition: all 0.3s ease; }
        .glass-card:hover { transform: translateY(-5px); border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .hero-text { background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s ease; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
        .btn-primary:hover { transform: scale(1.05); box-shadow: 0 0 40px rgba(16, 185, 129, 0.5); }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="VyomSetu" style={{ height: '42px', width: 'auto' }} />
          <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>VyomSetu <span style={{ opacity: 0.5, fontWeight: '400' }}>GridOS</span></div>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: '500', color: '#a1a1aa' }}>
          <span>Mission</span>
          <span>Technology</span>
          <span>Impact</span>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '12px', fontWeight: '700', marginBottom: '24px', animation: 'fadeIn 0.6s ease-out' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
          SYSTEM ONLINE: HIMALAYAN SECTOR
        </div>
        
        <h1 className="hero-text" style={{ fontSize: '64px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px', animation: 'fadeIn 0.8s ease-out' }}>
          Resilient Connectivity for <br/> the Unconnected World.
        </h1>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6', animation: 'fadeIn 1s ease-out' }}>
          VyomSetu uses geospatial AI to plan, protect, and heal communication networks in extreme terrains. From planning fiber routes to deploying autonomous drones.
        </p>

        <button 
          onClick={onLaunch}
          className="btn-primary"
          style={{ padding: '16px 40px', borderRadius: '12px', border: 'none', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', animation: 'fadeIn 1.2s ease-out' }}
        >
          LAUNCH MISSION CONTROL <ArrowRight size={20}/>
        </button>
      </div>

      {/* FEATURE GRID */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', animation: 'fadeIn 1.4s ease-out' }}>
        
        {/* Card 1 */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Map size={24}/>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Smart Planning</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
            AI-driven terrain analysis selects the optimal mix of Fiber, Microwave, and Satellite tech to reduce CAPEX by up to 60%.
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <ShieldAlert size={24}/>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Storm Shield</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
            Predictive disaster modeling that triggers preemptive QoS protocols and prepares emergency drone fleets.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Activity size={24}/>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Self-Healing Mesh</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
            Autonomous rerouting logic that detects node failure and patches connectivity in milliseconds.
          </p>
        </div>

      </div>

      {/* FOOTER STATS */}
      <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 0', textAlign: 'center', background: '#09090b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', color: '#64748b' }}>
          <div><div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>3</div><div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>VILLAGES DEPLOYED</div></div>
          <div><div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>₹21.5L</div><div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>COST SAVED</div></div>
          <div><div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>99.9%</div><div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>UPTIME GOAL</div></div>
        </div>
      </div>

    </div>
  );
}