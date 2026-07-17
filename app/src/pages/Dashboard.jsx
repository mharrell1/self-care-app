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

  return (
    <div>
      <PetView />
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
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
      </div>

      <div style={{ marginTop: '2rem', borderTop: '2px dashed var(--window-border-light)', paddingTop: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '1rem' }}>Dress Up</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['base', 'partyhat', 'necklace'].map(item => {
            const isUnlocked = gameState.unlockedItems.includes(item);
            const isEquipped = gameState.equippedItem === item;
            
            return (
              <div key={item} style={{ 
                border: '2px solid var(--window-border-dark)', 
                padding: '0.5rem', 
                backgroundColor: isEquipped ? 'var(--button-active)' : 'var(--window-bg)' 
              }}>
                <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                  {item === 'base' ? 'No Item' : (item === 'partyhat' ? 'Party Hat + Shirt' : 'Beaded Necklace')}
                </div>
                {isUnlocked ? (
                  <button 
                    className="btn" 
                    style={{ width: '100%' }}
                    onClick={() => updateGameState({ equippedItem: item })}
                    disabled={isEquipped}
                  >
                    {isEquipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button 
                    className="btn" 
                    style={{ width: '100%', backgroundColor: '#ddd' }}
                    onClick={() => {
                      if (gameState.coins >= 50) {
                        updateGameState({
                          coins: gameState.coins - 50,
                          unlockedItems: [...gameState.unlockedItems, item]
                        });
                      }
                    }}
                    disabled={gameState.coins < 50}
                  >
                    Buy (50 Coins)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: '2rem', borderTop: '2px dashed var(--window-border-light)', paddingTop: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '1rem' }}>Settings</h3>
        
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
        <div>
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
      </div>
    </div>
  );
}
