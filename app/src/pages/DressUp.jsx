import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';

export default function DressUp() {
  const { gameState, updateGameState } = useGame();
  const [draggingItem, setDraggingItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const frogRef = useRef(null);

  const CLOTHING_ITEMS = [
    'holographic_handbag', 'pink_dress', 
    'pink_heart_purse', 'iridescent_bow', 'blue_dress', 'frog_shirt', 'pink_sunglasses'
  ];

  const closetPositions = {
    'iridescent_bow': { top: '22%', left: '55%' },
    'pink_sunglasses': { top: '22%', left: '42%' },
    'blue_dress': { top: '45%', left: '45%' },
    'pink_dress': { top: '42%', left: '51%' },
    'frog_shirt': { top: '38%', left: '57%' },
    'holographic_handbag': { top: '30%', left: '15%' },
    'pink_heart_purse': { top: '50%', left: '82%' }
  };

  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
    if (items.includes('partyhat')) return '/assets/frog_partyhat.png';
    if (items.includes('necklace')) return '/assets/frog_necklace.png';
    return '/assets/frog_dressup_base.png';
  };

  const handlePointerDown = (e, item) => {
    e.preventDefault();
    if (!gameState.unlockedItems.includes(item)) return; 
    setDraggingItem(item);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (draggingItem) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e) => {
    if (draggingItem) {
      if (frogRef.current) {
        const frogRect = frogRef.current.getBoundingClientRect();
        if (
          e.clientX >= frogRect.left && e.clientX <= frogRect.right &&
          e.clientY >= frogRect.top && e.clientY <= frogRect.bottom
        ) {
          // Equip it
          const currentEquipped = gameState.equippedItems || [];
          if (!currentEquipped.includes(draggingItem)) {
            updateGameState({ equippedItems: [...currentEquipped, draggingItem] });
          }
        } else {
          // Unequip it
          const currentEquipped = gameState.equippedItems || [];
          if (currentEquipped.includes(draggingItem)) {
            updateGameState({ equippedItems: currentEquipped.filter(i => i !== draggingItem) });
          }
        }
      }
      setDraggingItem(null);
    }
  };

  const getShelfSize = (item) => {
    switch (item) {
      case 'blue_dress': return '120px';
      case 'pink_dress': return '90px';
      case 'frog_shirt': return '80px';
      case 'holographic_handbag': return '60px';
      case 'pink_heart_purse': return '60px';
      case 'pink_sunglasses': return '60px';
      case 'iridescent_bow': return '50px';
      default: return '60px';
    }
  };

  const getClothingStyle = (item) => {
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10 };
    switch (item) {
      case 'iridescent_bow': return { ...baseStyle, top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '45px' };
      case 'pink_dress': return { ...baseStyle, top: '72%', left: '50%', transform: 'translate(-50%, -50%)', width: '165px' };
      case 'blue_dress': return { ...baseStyle, top: '88%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px' };
      case 'frog_shirt': return { ...baseStyle, top: '72%', left: '50%', transform: 'translate(-50%, -50%)', width: '130px' };
      case 'holographic_handbag': return { ...baseStyle, top: '50%', left: '15%', width: '45px' };
      case 'pink_heart_purse': return { ...baseStyle, top: '50%', left: '60%', width: '45px' };
      case 'pink_sunglasses': return { ...baseStyle, top: '8%', left: '50%', transform: 'translate(-50%, -50%)', width: '60px' };
      default: return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px' };
    }
  };

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        backgroundImage: 'url(/assets/closet_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div 
        ref={frogRef}
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          width: '250px',
          height: '250px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          borderRadius: '10px'
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block', width: '150px', height: '150px', marginBottom: '40px' }}>
          <img 
            src={getFrogImage()} 
            alt="Frog" 
            style={{ width: '150px', height: '150px', objectFit: 'contain' }}
            draggable={false}
          />
          {CLOTHING_ITEMS.map(item => {
            const isEquipped = (gameState.equippedItems || []).includes(item);
            if (!isEquipped || draggingItem === item) return null;
            return (
              <img 
                key={`equipped-${item}`}
                src={`/assets/clothing/${item}.png`} 
                alt={item} 
                style={{...getClothingStyle(item), cursor: 'grab', pointerEvents: 'auto'}}
                onPointerDown={(e) => handlePointerDown(e, item)}
                draggable={false}
              />
            );
          })}
        </div>
      </div>

      {CLOTHING_ITEMS.map(item => {
        const isUnlocked = gameState.unlockedItems.includes(item);
        const isEquipped = (gameState.equippedItems || []).includes(item);
        
        if (isEquipped && draggingItem !== item) return null;

        const isDragging = draggingItem === item;

        let style = {
          position: 'absolute',
          cursor: isUnlocked ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
          opacity: isUnlocked ? 1 : 0.5,
          zIndex: isDragging ? 100 : 1,
          width: getShelfSize(item),
          transform: 'translate(-50%, -50%)',
          userSelect: 'none',
          touchAction: 'none'
        };

        if (isDragging && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          style.left = mousePos.x - rect.left;
          style.top = mousePos.y - rect.top;
          style.width = getClothingStyle(item).width; // Scale up to frog size while dragging
        } else {
          style.left = closetPositions[item]?.left || '50%';
          style.top = closetPositions[item]?.top || '50%';
        }

        return (
          <div key={`closet-${item}`} style={style} onPointerDown={(e) => handlePointerDown(e, item)}>
            <img 
              src={`/assets/clothing/${item}.png`} 
              alt={item} 
              style={{ width: '100%', height: 'auto', display: 'block' }}
              draggable={false}
            />
            {!isUnlocked && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (gameState.coins >= 50) {
                    updateGameState({
                      coins: gameState.coins - 50,
                      unlockedItems: [...gameState.unlockedItems, item]
                    });
                  }
                }}
                disabled={gameState.coins < 50}
                style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', padding: '2px 6px', whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                Buy (50c)
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
