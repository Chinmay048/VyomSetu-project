import React from 'react';
import { Anchor, Activity } from 'lucide-react';

export default function Navbar() {
  return (
    <nav style={{
      height: '60px',
      background: 'rgba(9, 9, 11, 0.95)', // Dark Zinc
      borderBottom: '1px solid #27272a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      color: 'white',
      backdropFilter: 'blur(8px)'
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: '#2563eb', padding: '6px', borderRadius: '6px', display: 'flex' }}>
          <Anchor size={18} color="white" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
          VyomSetu <span style={{ color: '#71717a', fontWeight: 'normal' }}>GridOS</span>
        </div>
      </div>

      {/* Center: Phases */}
      <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#a1a1aa' }}>
        <span style={{ color: 'white', borderBottom: '2px solid #3b82f6', paddingBottom: '18px' }}>Phase 1: Planning</span>
        <span>Phase 2: StormShield</span>
        <span>Phase 3: Impact</span>
      </div>

      {/* Right: Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
        <span style={{ fontSize: '12px', color: '#34d399', fontFamily: 'monospace' }}>SYSTEM ONLINE</span>
      </div>
    </nav>
  );
}