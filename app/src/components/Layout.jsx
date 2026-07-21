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

  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column', height: '750px' }}>
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
      <div className="window-footer" style={{ borderTop: '2px solid var(--window-border-dark)', padding: '0.5rem', display: 'flex', justifyContent: 'space-around', backgroundColor: 'var(--window-title-bg)' }}>
        <Link to="/" className="btn">Home</Link>
        <Link to="/selfcare" className="btn">Care</Link>
        <Link to="/dressup" className="btn">Dress Up</Link>
        <Link to="/photos" className="btn">Photos</Link>
        <Link to="/journal" className="btn">Journal</Link>
        <Link to="/games" className="btn">Games</Link>
      </div>
    </div>
  );
}

export default Layout;
