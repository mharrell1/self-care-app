import React from 'react';
import { useGame } from '../context/GameContext';

export default function PetView() {
  const { gameState, updateGameState } = useGame();
  
  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
    if (items.includes('partyhat')) return '/assets/frog_partyhat.png';
    if (items.includes('necklace')) return '/assets/frog_necklace.png';
    return '/assets/frog_dressup_base.png';
  };

  const getClothingStyle = (item) => {
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10 };
    switch (item) {
      case 'iridescent_bow':
        return { ...baseStyle, top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '45px' };
      case 'pink_dress':
        return { ...baseStyle, top: '72%', left: '50%', transform: 'translate(-50%, -50%)', width: '165px' };
      case 'blue_dress':
        return { ...baseStyle, top: '88%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px' };
      case 'frog_shirt':
        return { ...baseStyle, top: '72%', left: '50%', transform: 'translate(-50%, -50%)', width: '130px' };
      case 'holographic_handbag':
        return { ...baseStyle, top: '50%', left: '15%', width: '45px' };
      case 'pink_heart_purse':
        return { ...baseStyle, top: '50%', left: '60%', width: '45px' };
      case 'pink_sunglasses':
        return { ...baseStyle, top: '8%', left: '50%', transform: 'translate(-50%, -50%)', width: '60px' };
      default:
        return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px' };
    }
  };

  const setBaseFrog = (base) => {
    let currentEquipped = gameState.equippedItems || [];
    currentEquipped = currentEquipped.filter(i => i !== 'partyhat' && i !== 'necklace');
    if (base !== 'base') {
      currentEquipped.push(base);
    }
    updateGameState({ equippedItems: currentEquipped });
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
      <div style={{
        backgroundColor: '#fff',
        border: '3px solid var(--window-border-dark)',
        borderRadius: '10px',
        padding: '0.5rem',
        display: 'inline-block',
        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative', display: 'inline-block', width: '150px', height: '150px' }}>
          <img 
            src={getFrogImage()} 
            alt={gameState.petName} 
            style={{ width: '150px', height: '150px', objectFit: 'contain' }}
          />
          {(gameState.equippedItems || (gameState.equippedItem && gameState.equippedItem !== 'base' ? [gameState.equippedItem] : [])).map(item => {
            if (['partyhat', 'necklace'].includes(item)) return null; // These are handled by getFrogImage
            return (
              <img 
                key={item}
                src={`/assets/clothing/${item}.png`} 
                alt={item} 
                style={getClothingStyle(item)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Frog Version:</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setBaseFrog('base')} style={btnStyle}>Default</button>
          <button onClick={() => setBaseFrog('partyhat')} style={btnStyle}>Party Hat</button>
          <button onClick={() => setBaseFrog('necklace')} style={btnStyle}>Necklace</button>
        </div>
      </div>

      <h2 style={{ color: 'var(--primary-color)', textShadow: '1px 1px 0px #fff', marginTop: '1rem' }}>
        {gameState.petName}
      </h2>
      
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid var(--window-border)',
        borderRadius: '5px',
        padding: '0.5rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Happiness:</span>
          <span style={{ fontWeight: 'bold', color: gameState.happiness > 50 ? 'green' : 'red' }}>
            {gameState.happiness}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Hunger:</span>
          <span style={{ fontWeight: 'bold', color: gameState.hunger > 50 ? 'green' : 'red' }}>
            {gameState.hunger}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cleanliness:</span>
          <span style={{ fontWeight: 'bold', color: gameState.cleanliness > 50 ? 'green' : 'red' }}>
            {gameState.cleanliness}%
          </span>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  backgroundColor: 'var(--primary-light)',
  border: '2px solid var(--window-border-dark)',
  borderRadius: '5px',
  padding: '0.2rem 0.5rem',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: 'var(--text-color)',
  boxShadow: '1px 1px 0px rgba(0,0,0,0.2)'
};
