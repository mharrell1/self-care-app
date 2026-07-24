import React, { useState } from 'react';
import PetView from '../components/PetView';
import { useGame } from '../context/GameContext';

export default function Dashboard() {
  const { gameState, updateGameState } = useGame();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleFeed = () => {
    if (gameState.coins >= 10 && gameState.hunger < 100) {
      updateGameState({
        coins: gameState.coins - 10,
        hunger: Math.min(100, gameState.hunger + 20)
      });
    }
  };

  const handlePlay = () => {
    if (gameState.happiness < 100) {
      updateGameState({
        happiness: Math.min(100, gameState.happiness + 10),
        hunger: Math.max(0, gameState.hunger - 5)
      });
    }
  };

  const handleDrinkWater = () => {
    const todayStr = new Date().toLocaleDateString();
    let currentCount = gameState.waterCount || 0;
    if (gameState.lastWaterDate !== todayStr) {
      currentCount = 0;
    }
    updateGameState({
      waterCount: currentCount + 1,
      lastWaterDate: todayStr,
      cleanliness: Math.min(100, (gameState.cleanliness ?? 50) + 10),
      happiness: Math.min(100, (gameState.happiness ?? 50) + 5)
    });
  };

  return (
    <div>
      <PetView />
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          onClick={handleFeed}
          disabled={gameState.coins < 10 || gameState.hunger >= 100}
        >
          Feed (10 Coins)
        </button>
        <button 
          className="btn" 
          onClick={handlePlay}
          disabled={gameState.happiness >= 100}
        >
          Play (Free)
        </button>
        <button 
          className="btn" 
          onClick={handleDrinkWater}
        >
          Drink Water ({gameState.waterCount || 0} Cups)
        </button>
      </div>


      <div style={{ marginTop: '0.5rem', borderTop: '2px dashed var(--window-border-light)', paddingTop: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Settings</h3>
        
        {/* Name Setting */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>Pet Name: </strong>
          {!editingName ? (
            <>
              <span>{gameState.petName}</span>
              <button 
                className="btn" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginLeft: '1rem' }}
                onClick={() => {
                  setNewName(gameState.petName);
                  setEditingName(true);
                }}
              >
                Rename
              </button>
            </>
          ) : (
            <>
              <input 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                style={{ padding: '0.2rem', fontSize: '1rem', width: '150px' }}
                maxLength={15}
              />
              <button 
                className="btn" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}
                onClick={() => {
                  updateGameState({ petName: newName });
                  setEditingName(false);
                }}
              >
                Save
              </button>
            </>
          )}
        </div>

        {/* Theme Setting */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>Theme Color: </strong>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            {['pink', 'purple', 'blue', 'green'].map(color => (
              <button
                key={color}
                className="btn"
                style={{ 
                  backgroundColor: color === 'pink' ? '#f8bbd0' : color === 'purple' ? '#e1bee7' : color === 'blue' ? '#bbdefb' : '#c8e6c9',
                  borderWidth: gameState.themeColor === color ? '4px' : '3px',
                  borderColor: gameState.themeColor === color ? '#000' : 'var(--window-border-dark)'
                }}
                onClick={() => updateGameState({ themeColor: color })}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Developer / Testing Tools */}
        <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--window-border-light)', paddingTop: '0.5rem' }}>
          <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Developer Tools</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              onClick={async () => {
                const backdatedTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
                await updateGameState({ lastInteraction: backdatedTime });
                window.location.reload();
              }}
            >
              Simulate 24h Inactivity
            </button>
            <button 
              className="btn" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              onClick={async () => {
                const backdatedTime = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString();
                await updateGameState({ lastInteraction: backdatedTime });
                window.location.reload();
              }}
            >
              Simulate 48h Inactivity
            </button>
            <button 
              className="btn" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', backgroundColor: '#ffcdd2', color: '#c62828' }}
              onClick={async () => {
                await updateGameState({
                  happiness: 0,
                  hunger: 0,
                  cleanliness: 0
                });
              }}
            >
              Drain Stats to 0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
