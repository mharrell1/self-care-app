import React from 'react';
import { useGame } from '../context/GameContext';

export default function PetView() {
  const { gameState } = useGame();
  
  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    if (gameState.equippedItem === 'partyhat') return '/assets/frog_partyhat.png';
    if (gameState.equippedItem === 'necklace') return '/assets/frog_necklace.png';
    return '/assets/frog_base.png';
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
      <div style={{
        backgroundColor: '#fff',
        border: '3px solid var(--window-border-dark)',
        borderRadius: '10px',
        padding: '1rem',
        display: 'inline-block',
        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1)'
      }}>
        <img 
          src={getFrogImage()} 
          alt={gameState.petName} 
          style={{ width: '250px', height: '250px', objectFit: 'contain' }}
        />
      </div>
      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--header-font)', fontSize: '1rem', color: 'var(--window-border-dark)' }}>
        {gameState.petName}
      </div>
      <div style={{ marginTop: '0.5rem', fontFamily: 'var(--header-font)', fontSize: '0.8rem' }}>
        Status: {gameState.hunger < 30 ? 'Hungry :(' : 'Happy!'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
        <span>Coins: {gameState.coins}</span>
        <span>Hunger: {gameState.hunger}/100</span>
        <span>Happiness: {gameState.happiness}/100</span>
        <span>Cleanliness: {gameState.cleanliness}/100</span>
      </div>
    </div>
  );
}
