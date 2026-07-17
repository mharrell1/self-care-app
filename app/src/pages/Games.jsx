import React, { useState } from 'react';
import CookingGame from '../components/Games/CookingGame';
import BathingGame from '../components/Games/BathingGame';
import FishingGame from '../components/Games/FishingGame';

export default function Games() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame === 'cooking') {
    return <CookingGame onExit={() => setActiveGame(null)} />;
  }

  if (activeGame === 'bathing') {
    return <BathingGame onExit={() => setActiveGame(null)} />;
  }
  
  if (activeGame === 'fishing') {
    return <FishingGame onExit={() => setActiveGame(null)} />;
  }

  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '2rem' }}>Mini Games</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
        <button className="btn" onClick={() => setActiveGame('cooking')}>
          Cooking Mama (Froggy Edition)
        </button>
        <button className="btn" onClick={() => setActiveGame('bathing')}>
          Bathe Froggy
        </button>
        <button className="btn" onClick={() => setActiveGame('fishing')}>
          Fishing
        </button>
        <button className="btn" style={{ backgroundColor: '#ddd' }} disabled>
          Lilypad Jump (Coming Soon)
        </button>
      </div>
    </div>
  );
}
