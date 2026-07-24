import React from 'react';
import { useGame } from '../context/GameContext';

import FrogAvatar from './FrogAvatar';

export default function PetView() {
  const { gameState, updateGameState } = useGame();
  const isSleeping = Boolean(gameState?.isSleeping);
  
  const setBaseFrog = (base) => {
    let currentEquipped = gameState.equippedItems || [];
    currentEquipped = currentEquipped.filter(i => {
      return typeof i === 'string' && i !== 'partyhat' && i !== 'necklace';
    });
    if (base !== 'base') {
      currentEquipped.push(base);
    }
    updateGameState({ equippedItems: currentEquipped });
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
      <div style={{
        backgroundColor: isSleeping ? '#2c1654' : '#fff',
        backgroundImage: isSleeping ? "url('/assets/bedtime_bg.jpg')" : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '3px solid var(--window-border-dark)',
        borderRadius: '10px',
        padding: '0.5rem',
        display: 'inline-block',
        boxShadow: isSleeping ? '0 0 15px rgba(106, 27, 154, 0.4), inset 0 0 12px rgba(0,0,0,0.6)' : 'inset 2px 2px 5px rgba(0,0,0,0.1)',
        width: '150px',
        height: '150px',
        boxSizing: 'content-box',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          transform: isSleeping ? 'rotate(-6deg) scale(0.92)' : 'none',
          transition: 'transform 0.3s ease'
        }}>
          <FrogAvatar gameState={gameState} />
        </div>

        {isSleeping && (
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30, 15, 50, 0.85)',
            color: '#e1bee7',
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #ab47bc',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            Sleeping in Bed
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>Frog Version:</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setBaseFrog('base')} style={btnStyle}>Default</button>
          <button onClick={() => setBaseFrog('partyhat')} style={btnStyle}>Party Hat</button>
          <button onClick={() => setBaseFrog('necklace')} style={btnStyle}>Necklace</button>
        </div>
      </div>

      <h2 style={{ color: 'var(--primary-color)', textShadow: '1px 1px 0px #fff', marginTop: '0.5rem' }}>
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
          <span>Health:</span>
          <span style={{ fontWeight: 'bold', color: (gameState?.health ?? 100) > 50 ? 'green' : 'red' }}>
            {gameState?.health ?? 100}%
          </span>
        </div>
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderTop: '2px dashed var(--window-border-light)', 
          paddingTop: '0.5rem',
          marginTop: '0.5rem'
        }}>
          <span style={{ fontWeight: 'bold' }}>Coins:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#b57c00', 
            backgroundColor: '#fffde7', 
            border: '1.5px solid #b57c00', 
            borderRadius: '4px',
            padding: '1px 6px',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            {gameState.coins}
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
