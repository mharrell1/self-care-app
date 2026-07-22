import React from 'react';

export default function FrogAvatar({ gameState }) {
  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
    const itemNames = items.filter(i => typeof i === 'string');
    if (itemNames.includes('partyhat')) return '/assets/frog_partyhat.png?v=20260722_01';
    if (itemNames.includes('necklace')) return '/assets/frog_necklace.png?v=20260722_01';
    return '/assets/frog_dressup_base.png';
  };

  const getClothingStyle = (item) => {
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    switch (item) {
      case 'iridescent_bow':
        return { ...baseStyle, width: '45px' };
      case 'pink_dress':
        return { ...baseStyle, width: '190px' };
      case 'blue_dress':
        return { ...baseStyle, width: '220px' };
      case 'frog_shirt':
        return { ...baseStyle, width: '130px' };
      case 'holographic_handbag':
        return { ...baseStyle, width: '45px' };
      case 'pink_heart_purse':
        return { ...baseStyle, width: '45px' };
      case 'pink_sunglasses':
        return { ...baseStyle, width: '60px' };
      default:
        return { ...baseStyle, width: '100px' };
    }
  };

  const items = gameState.equippedItems || (gameState.equippedItem && gameState.equippedItem !== 'base' ? [gameState.equippedItem] : []);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '150px', height: '150px' }}>
      <img 
        src={getFrogImage()} 
        alt={gameState.petName || 'Frog'} 
        style={{ width: '150px', height: '150px', objectFit: 'contain' }}
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
