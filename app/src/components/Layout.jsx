import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

function Layout() {
  const location = useLocation();
  const { gameState, handleLogout } = useGame();

  useEffect(() => {
    if (gameState?.themeColor) {
      document.body.className = `theme-${gameState.themeColor}`;
    }
  }, [gameState?.themeColor]);

  const getWindowTitle = () => {
    switch (location.pathname) {
      case '/': return 'Froggy Dashboard';
      case '/journal': return 'Secret Journal.exe';
      case '/games': return 'Mini Games Collection';
      case '/selfcare': return 'Self Care Zone';
      case '/dressup': return 'Dress Up.exe';
      case '/photos': return 'Photo Booth.exe';
      default: return 'Froggy App';
    }
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/selfcare', label: 'Care' },
    { path: '/dressup', label: 'Dress Up' },
    { path: '/photos', label: 'Photos' },
    { path: '/journal', label: 'Journal' },
    { path: '/games', label: 'Games' }
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
    </div>
  );
}

export default Layout;
