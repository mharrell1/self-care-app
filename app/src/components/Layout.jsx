import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const FROG_AFFIRMATIONS = [
  "Even on rainy days, a frog knows how to leap with joy!",
  "Take it one lilypad hop at a time—you are making progress!",
  "It is totally un-frog-gettable how amazing and strong you are!",
  "Rest on your lilypad today. You don't always have to be leaping!",
  "Your kindness is toad-ally magical and brightens the whole pond!",
  "You are ribbit-ing with potential and capable of great things!",
  "Drink your water, breathe deeply, and enjoy calm pond waters.",
  "Small hops every day add up to giant leaps over time!",
  "Bask in the warm sun and be proud of how far you've come.",
  "You are deserving of love, peace, and plenty of cozy pond moments.",
  "Never let anyone dull your shine—you are a masterpiece in this pond!",
  "Keep your head above water and remember you've got this!",
  "A quiet pond brings clarity. Give yourself time to relax.",
  "You are toad-ally awesome, just by being yourself!",
  "Hop into today with confidence and a gentle smile.",
  "Surround yourself with cozy waters and uplifting thoughts.",
  "Every lilypad is a new opportunity to rest and recharge.",
  "You bring balance and harmony to your little corner of the world.",
  "No matter how murky the water gets, your inner light shines bright.",
  "Be patient with your growth—tadpoles take time to blossom into frogs!",
  "Your heart is full of wonder, strength, and endless warmth.",
  "Enjoy the sweet sound of rain and let your worries wash away.",
  "You are strong enough to splash through any obstacle today.",
  "Take a deep breath and listen to the soothing rhythm of nature.",
  "Your resilience is un-frog-gettable. Keep hopping forward!",
  "Pond life is sweet when you take time to care for your heart.",
  "Celebrate your progress today—every hop counts!",
  "You are a precious part of this pond. Never forget your worth.",
  "Embrace your unique splash—the world needs your light!",
  "Croak your truth with confidence and live authentically!"
];

function getDailyFrogAffirmation() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FROG_AFFIRMATIONS.length;
  return FROG_AFFIRMATIONS[index];
}

function Layout() {
  const location = useLocation();
  const { gameState, handleLogout } = useGame();
  const [showAffirmationModal, setShowAffirmationModal] = useState(false);

  useEffect(() => {
    // Only show the affirmation popup on the Dashboard (home route)
    if (location.pathname !== '/') return;
    const d = new Date();
    const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const lastSeen = localStorage.getItem('frog_affirmation_seen_date');
    if (lastSeen !== todayISO) {
      setShowAffirmationModal(true);
    }
  }, [location.pathname]);

  const handleCloseAffirmation = () => {
    const d = new Date();
    const todayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem('frog_affirmation_seen_date', todayISO);
    setShowAffirmationModal(false);
  };

  useEffect(() => {
    if (gameState?.themeColor) {
      document.body.className = `theme-${gameState.themeColor}`;
    }
  }, [gameState?.themeColor]);

  const getWindowTitle = () => {
    switch (location.pathname) {
      case '/': return 'Frogagotchi';
      case '/journal': return 'Secret Journal.exe';
      case '/games': return 'Mini Games Collection';
      case '/selfcare': return 'Self Care Zone';
      case '/dressup': return 'Dress Up.exe';
      case '/photos': return 'Photo Booth.exe';
      case '/stats': return 'Activity & Stats';
      default: return 'Frogagotchi App';
    }
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/selfcare', label: 'Care' },
    { path: '/dressup', label: 'Dress Up' },
    { path: '/photos', label: 'Photos' },
    { path: '/journal', label: 'Journal' },
    { path: '/games', label: 'Games' },
    { path: '/stats', label: 'Stats' }
  ];

  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '820px', margin: '0 auto' }}>
      <div className="window-header">
        <span>{getWindowTitle()}</span>
        <div>
          <button onClick={handleLogout} style={{ cursor: 'pointer', margin: '0 5px', background: 'none', border: 'none', color: 'inherit', font: 'inherit' }}>Log Out</button>
          <span style={{ cursor: 'pointer', margin: '0 5px' }}>_</span>
          <span style={{ cursor: 'pointer', margin: '0 5px' }}>□</span>
          <span style={{ cursor: 'pointer', margin: '0 5px' }}>X</span>
        </div>
      </div>
      <div className="window-content" style={{ flexGrow: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      
      {/* Clean Mobile Responsive Navigation Tab Bar */}
      <div className="window-footer" style={{ 
        borderTop: '2px solid var(--window-border-dark)', 
        padding: '0.4rem 0.2rem', 
        display: 'flex', 
        justify: 'space-between',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: 'var(--window-title-bg)',
        overflow: 'hidden'
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className="btn"
              style={{
                flex: '1 1 0px',
                minWidth: '0',
                padding: '0.35rem 0.1rem',
                fontSize: 'clamp(0.68rem, 2.4vw, 0.95rem)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                backgroundColor: isActive ? 'var(--button-active)' : 'var(--button-bg)',
                boxShadow: isActive ? 'inset 1px 1px 0px rgba(0,0,0,0.2)' : undefined,
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* DAILY FROGGY AFFIRMATION POPUP MODAL (First App Launch of Each Day) */}
      {showAffirmationModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '1rem'
        }}>
          <div className="window" style={{
            backgroundColor: '#fff',
            border: '3px solid var(--window-border-dark)',
            borderRadius: '8px',
            maxWidth: '360px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div className="window-header" style={{
              backgroundColor: 'var(--window-title-bg)',
              color: 'var(--window-title-text)',
              padding: '0.4rem 0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <span>Daily Froggy Affirmation</span>
              <button 
                onClick={handleCloseAffirmation}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
              >
                X
              </button>
            </div>

            <div style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
              <img 
                src="/assets/pixel_frog_marker.png" 
                alt="Frog Affirmation" 
                style={{ width: '48px', height: '48px', marginBottom: '0.75rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              />
              <div style={{ fontFamily: 'var(--header-font)', fontSize: '0.75rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                Today's Frog Thought
              </div>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                "{getDailyFrogAffirmation()}"
              </p>
              <button 
                className="btn" 
                onClick={handleCloseAffirmation}
                style={{ padding: '0.35rem 1.4rem', fontSize: '0.95rem', fontWeight: 'bold', backgroundColor: 'var(--button-bg)' }}
              >
                Ribbit! 🐸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
