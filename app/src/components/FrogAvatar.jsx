import React from 'react';
import { getFrogBaseImage } from '../utils/frogAssets';

export default function FrogAvatar({ gameState }) {
  const isFullyDrained = (gameState.happiness ?? 50) <= 0 || (gameState.hunger ?? 50) <= 0 || (gameState.cleanliness ?? 50) <= 0;

  const getFrogImage = () => {
    return getFrogBaseImage(gameState);
  };

  const getClothingStyle = (item) => {
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    switch (item) {
      case 'iridescent_bow':
        return { ...baseStyle, width: '33%' };
      case 'pink_dress':
        return { ...baseStyle, width: '139.3%' };
      case 'blue_dress':
        return { ...baseStyle, width: '161.3%' };
      case 'frog_shirt':
        return { ...baseStyle, width: '86.6%' };
      case 'holographic_handbag':
        return { ...baseStyle, width: '33%' };
      case 'pink_heart_purse':
        return { ...baseStyle, width: '33%' };
      case 'pink_sunglasses':
        return { ...baseStyle, width: '44%' };
      default:
        return { ...baseStyle, width: '66.6%' };
    }
  };

  const items = isFullyDrained
    ? []
    : (gameState.equippedItems || (gameState.equippedItem && gameState.equippedItem !== 'base' ? [gameState.equippedItem] : []));

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}>
      <img 
        src={getFrogImage()} 
        alt={gameState.petName || 'Frog'} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        draggable={false}
      />
      {items.map(item => {
          const itemName = typeof item === 'object' ? item.name : item;
          if (['partyhat', 'necklace'].includes(itemName)) return null; 
          
          const isCustomPos = typeof item === 'object';
          const customStyle = isCustomPos ? { top: item.top, left: item.left } : {};
          
          return (
            <img 
              key={itemName}
              src={`/assets/clothing/${itemName}.png`} 
              alt={itemName} 
              style={{...getClothingStyle(itemName), ...customStyle}}
              draggable={false}
            />
          );
      })}
    </div>
  );
}
