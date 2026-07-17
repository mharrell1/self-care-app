import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

export default function BathingGame({ onExit }) {
  const { gameState, updateGameState } = useGame();
  
  // Phase 0: Dirt scrubbing
  // Phase 1: Click Shampoo
  // Phase 2: Bubbles appear & Click Showerhead
  // Phase 3: Showerhead rinses
  // Phase 4: Clean! Done
  const [phase, setPhase] = useState(0); 
  const [dirtSpots, setDirtSpots] = useState([]);
  const [animating, setAnimating] = useState(false);

  // Use the naked frog image
  const frogImg = '/assets/frog_naked_white_bg.jpeg';

  useEffect(() => {
    // Generate random dirt spots for phase 0
    const numSpots = Math.floor(Math.random() * 5) + 5;
    const spots = [];
    for(let i=0; i<numSpots; i++) {
      spots.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        cleaned: false
      });
    }
    setDirtSpots(spots);
  }, []);

  const handleScrub = (id) => {
    if (phase !== 0) return;
    const updated = dirtSpots.map(s => s.id === id ? { ...s, cleaned: true } : s);
    setDirtSpots(updated);
    
    if (updated.every(s => s.cleaned)) {
      setPhase(1); // Move to shampoo phase
    }
  };

  const handleShampooClick = () => {
    if (phase !== 1 || animating) return;
    setAnimating(true);
    // Simulate squeezing shampoo
    setTimeout(() => {
      setPhase(2);
      setAnimating(false);
    }, 1000);
  };

  const handleShowerheadClick = () => {
    if (phase !== 2 || animating) return;
    setAnimating(true);
    // Simulate washing off bubbles
    setTimeout(() => {
      setPhase(3);
      setAnimating(false);
      setTimeout(() => {
        setPhase(4);
        updateGameState({ 
          cleanliness: 100, 
          happiness: Math.min(100, gameState.happiness + 20),
          coins: gameState.coins + 30 
        });
      }, 1500);
    }, 1500);
  };

  return (
    <div style={{ padding: '1rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn" onClick={onExit}>&lt; Back</button>
        <span>Bathtime.exe</span>
      </div>

      <div style={{ 
        position: 'relative', 
        height: '400px', 
        width: '100%',
        backgroundImage: 'url(/assets/bathroom.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        overflow: 'hidden',
        border: '2px solid var(--window-border-dark)'
      }}>
        
        {/* Instructions */}
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 10, textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>
          {phase === 0 && <h2>Tap the dirt spots!</h2>}
          {phase === 1 && <h2>Click the Shampoo!</h2>}
          {phase === 2 && <h2>Click the Showerhead!</h2>}
          {phase === 4 && <h2>Squeaky Clean! +30 Coins</h2>}
        </div>

        {/* Frog */}
        <img 
          src={'/assets/frog_naked_transparent.png'} 
          alt="Frog" 
          style={{ 
            position: 'absolute', 
            bottom: '10%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '200px',
            height: '250px',
            objectFit: 'contain',
            filter: phase === 4 ? 'brightness(1.2)' : 'none',
            transition: 'filter 1s ease',
            zIndex: 4
          }} 
        />

        {/* Dirt Spots */}
        {phase === 0 && dirtSpots.map(spot => !spot.cleaned && (
          <div 
            key={spot.id}
            onClick={() => handleScrub(spot.id)}
            style={{
              position: 'absolute',
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: '30px',
              height: '30px',
              backgroundColor: 'rgba(101, 67, 33, 0.8)', // dirt color
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 5
            }}
          />
        ))}

        {/* Bubbles */}
        <img 
          src="/assets/bubbles.png"
          className={`${phase === 2 ? 'bubbles-appear' : ''} ${phase >= 3 ? 'bubbles-fade' : ''}`}
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '250px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 5
          }}
        />

        {/* Shampoo Bottle */}
        {phase >= 1 && (
          <img 
            src="/assets/shampoo_transparent.png"
            className={`${animating && phase === 1 ? 'shampoo-squeeze' : ''}`}
            onClick={handleShampooClick}
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '10%',
              width: '100px',
              cursor: phase === 1 ? 'pointer' : 'default',
              opacity: phase >= 2 ? 0 : 1,
              transition: 'opacity 0.5s ease',
              zIndex: 6
            }}
          />
        )}

        {/* Showerhead */}
        {phase >= 2 && (
          <img 
            src="/assets/showerhead_transparent.png"
            className={`${animating && phase === 2 ? 'shower-rinse' : ''}`}
            onClick={handleShowerheadClick}
            style={{
              position: 'absolute',
              top: '10%',
              right: '10%',
              width: '120px',
              cursor: phase === 2 ? 'pointer' : 'default',
              opacity: phase >= 4 ? 0 : 1,
              transition: 'opacity 0.5s ease',
              zIndex: 6
            }}
          />
        )}

      </div>
    </div>
  );
}
