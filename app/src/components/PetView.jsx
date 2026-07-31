import React from 'react';
import { useGame } from '../context/GameContext';
import { FROG_VERSIONS } from '../utils/frogAssets';

import FrogAvatar from './FrogAvatar';

export function getUpcomingHoliday(date = new Date()) {
  const year = date.getFullYear();
  const nowTime = date.getTime();

  const candidates = [
    { key: 'easter', label: 'Easter', date: new Date(year, 3, 12) },
    { key: 'halloween', label: 'Halloween', date: new Date(year, 9, 31) },
    { key: 'thanksgiving', label: 'Thanksgiving', date: new Date(year, 10, 26) },
    { key: 'christmas', label: 'Christmas', date: new Date(year, 11, 25) }
  ];

  candidates.forEach(c => {
    const endOfDay = new Date(c.date);
    endOfDay.setDate(endOfDay.getDate() + 2);
    if (nowTime > endOfDay.getTime()) {
      c.date.setFullYear(year + 1);
    }
  });

  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return candidates[0];
}

export default function PetView() {
  const { gameState, updateGameState, heartKey } = useGame();
  const isSleeping = Boolean(gameState?.isSleeping);
  const isVacation = Boolean(gameState?.isVacation);

  const selectedBg = gameState?.selectedBackground || (isSleeping ? 'bedtime' : isVacation ? 'beach' : 'default');

  let activeBg = selectedBg;
  if (activeBg === 'seasonal') {
    activeBg = getUpcomingHoliday().key;
  }

  let containerBgImage = 'none';
  let containerBgColor = '#fff';

  switch (activeBg) {
    case 'bedtime':
      containerBgImage = "url('/assets/bedtime_bg.jpg')";
      containerBgColor = '#2c1654';
      break;
    case 'beach':
      containerBgImage = "url('/assets/beach.jpg')";
      containerBgColor = '#ffe0b2';
      break;
    case 'jungle':
      containerBgImage = "url('/assets/jungle.jpg')";
      containerBgColor = '#1b5e20';
      break;
    case 'ocean':
      containerBgImage = "url('/assets/ocean.jpg')";
      containerBgColor = '#01579b';
      break;
    case 'purple_sky':
      containerBgImage = "url('/assets/purple_sky.jpg')";
      containerBgColor = '#4a148c';
      break;
    case 'rainbow':
      containerBgImage = "url('/assets/rainbow.jpg')";
      containerBgColor = '#fce4ec';
      break;
    case 'halloween':
      containerBgImage = "url('/assets/halloween.jpg')";
      containerBgColor = '#311b92';
      break;
    case 'christmas':
      containerBgImage = "url('/assets/christmas.jpg')";
      containerBgColor = '#0d47a1';
      break;
    case 'easter':
      containerBgImage = "url('/assets/easter.jpg')";
      containerBgColor = '#e8f5e9';
      break;
    case 'thanksgiving':
      containerBgImage = "url('/assets/thanksgiving.jpg')";
      containerBgColor = '#fff3e0';
      break;
    case 'custom':
      containerBgImage = gameState?.customBackground ? `url('${gameState.customBackground}')` : 'none';
      containerBgColor = '#e0e0e0';
      break;
    default:
      containerBgImage = 'none';
      containerBgColor = '#fff';
      break;
  }
  
  const equipped = gameState?.equippedItems || [];
  const equippedNames = equipped.map(i => typeof i === 'object' ? i.name : i);
  
  let containerWidth = 150;
  let containerHeight = 150;

  if (equippedNames.includes('blue_dress')) {
    containerHeight = 290;
  } else if (equippedNames.includes('pink_dress')) {
    containerHeight = 195;
  } else if (equippedNames.includes('frog_shirt')) {
    containerHeight = 165;
  }

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
      <style>{`
        @keyframes floatPixelHeart {
          0% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 2px) scale(1.1);
          }
          75% {
            opacity: 1;
            transform: translate(-50%, -18px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -32px) scale(0.85);
          }
        }
      `}</style>
      <div style={{
        backgroundColor: containerBgColor,
        backgroundImage: containerBgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '3px solid var(--window-border-dark)',
        borderRadius: '10px',
        padding: '0.5rem',
        display: 'inline-block',
        boxShadow: (isSleeping || isVacation) ? '0 0 15px rgba(0,0,0,0.3), inset 0 0 12px rgba(0,0,0,0.4)' : 'inset 2px 2px 5px rgba(0,0,0,0.1)',
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        boxSizing: 'content-box',
        position: 'relative',
        overflow: 'hidden',
        transition: 'height 0.35s ease, background-color 0.35s ease'
      }}>
        <div style={{
          width: '150px',
          height: '150px',
          position: 'relative',
          margin: '0 auto',
          transform: isSleeping ? 'rotate(-6deg)' : 'none',
          transition: 'transform 0.3s ease'
        }}>
          {heartKey > 0 && (
            <img
              key={heartKey}
              src="/assets/pixel_heart_clean.png"
              alt="Pixel Heart"
              className="pixel-heart-pop"
            />
          )}
          <FrogAvatar gameState={gameState} />
        </div>



        {isVacation && !isSleeping && (
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(230, 81, 0, 0.85)',
            color: '#fff',
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #ffe082',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            On Vacation
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Frog Version:</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {FROG_VERSIONS.map(ver => {
            const isSelected = (gameState?.frogVersion || 'base') === ver.id;
            return (
              <button
                key={ver.id}
                className="btn"
                onClick={() => updateGameState({ frogVersion: ver.id })}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '1.1rem',
                  backgroundColor: isSelected ? 'var(--window-title-bg)' : 'var(--button-bg)',
                  color: isSelected ? 'var(--window-title-text)' : 'var(--text-primary)',
                  borderTopColor: isSelected ? 'var(--button-border-dark)' : 'var(--button-border-light)',
                  borderLeftColor: isSelected ? 'var(--button-border-dark)' : 'var(--button-border-light)',
                  borderBottomColor: isSelected ? 'var(--button-border-light)' : 'var(--button-border-dark)',
                  borderRightColor: isSelected ? 'var(--button-border-light)' : 'var(--button-border-dark)',
                  boxShadow: isSelected ? 'none' : '2px 2px 0px rgba(0,0,0,0.15)'
                }}
              >
                {ver.name}
              </button>
            );
          })}
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
