import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

function App() {
  const [view, setView] = useState('landing'); 

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      background: '#09090b',
      // FIX: Allow scrolling on Landing Page, Lock scrolling on Dashboard
      overflowY: view === 'landing' ? 'auto' : 'hidden',
      overflowX: 'hidden'
    }}>
      
      {view === 'landing' ? (
        <LandingPage onLaunch={() => setView('dashboard')} />
      ) : (
        <Dashboard />
      )}

    </div>
  );
}

export default App;