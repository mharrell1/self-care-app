import React from 'react';

export default function FrogAvatar({ gameState }) {
  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
    const itemNames = items.filter(i => typeof i === 'string');
    if (itemNames.includes('partyhat')) return '/assets/mugugins_partyhat_sticker_v2.png?v=20260722_15';
    if (itemNames.includes('necklace')) return '/assets/frog_necklace.png?v=20260722_15';
    return '/assets/frog_dressup_base.png';
  };

  const getClothingStyle = (item) => {
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    switch (item) {
      case 'iridescent_bow':
        return { ...baseStyle, width: '30%' };
      case 'pink_dress':
        return { ...baseStyle, width: '126.6%' };
      case 'blue_dress':
        return { ...baseStyle, width: '146.6%' };
      case 'frog_shirt':
        return { ...baseStyle, width: '86.6%' };
      case 'holographic_handbag':
        return { ...baseStyle, width: '30%' };
      case 'pink_heart_purse':
        return { ...baseStyle, width: '30%' };
      case 'pink_sunglasses':
        return { ...baseStyle, width: '40%' };
      default:
        return { ...baseStyle, width: '66.6%' };
    }
  };

  const items = gameState.equippedItems || (gameState.equippedItem && gameState.equippedItem !== 'base' ? [gameState.equippedItem] : []);

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
