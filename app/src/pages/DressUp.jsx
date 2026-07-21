import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';

export default function DressUp() {
  const { gameState, updateGameState } = useGame();
  const [draggingItem, setDraggingItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClick, setIsClick] = useState(true);
  const containerRef = useRef(null);
  const frogRef = useRef(null);

  const CLOTHING_ITEMS = [
    'holographic_handbag', 'pink_dress', 
    'pink_heart_purse', 'iridescent_bow', 'blue_dress', 'frog_shirt', 'pink_sunglasses'
  ];

  const closetPositions = {
    'iridescent_bow': { top: '22%', left: 'calc(55% + 20px)' },
    'pink_sunglasses': { top: '22%', left: '42%' },
    'blue_dress': { top: '45%', left: 'calc(45% + 35px)' },
    'pink_dress': { top: 'calc(42% - 7px)', left: 'calc(51% + 28px)' },
    'frog_shirt': { top: '38%', left: 'calc(57% + 35px)' },
    'holographic_handbag': { top: 'calc(30% - 7px)', left: 'calc(15% - 20px)' },
    'pink_heart_purse': { top: '50%', left: '82%' }
  };

  const getFrogImage = () => {
    if (gameState.hunger < 30) return '/assets/frog_sad.png';
    const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
    const itemNames = items.map(i => typeof i === 'object' ? i.name : i);
    if (itemNames.includes('partyhat')) return '/assets/frog_partyhat.png';
    if (itemNames.includes('necklace')) return '/assets/frog_necklace.png';
    return '/assets/frog_dressup_base.png';
  };

  const handlePointerDown = (e, item) => {
    e.preventDefault();
    if (!gameState.unlockedItems.includes(item)) return; 
    setDraggingItem(item);
    setMousePos({ x: e.clientX, y: e.clientY });
    setIsClick(true);
  };

  const handlePointerMove = (e) => {
    if (draggingItem) {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsClick(false);
    }
  };

  const handlePointerUp = (e) => {
    if (draggingItem) {
      const currentEquipped = gameState.equippedItems || [];
      const isCurrentlyEquipped = currentEquipped.some(i => (typeof i === 'object' ? i.name : i) === draggingItem);

      if (isClick) {
        if (isCurrentlyEquipped) {
          const filtered = currentEquipped.filter(i => (typeof i === 'object' ? i.name : i) !== draggingItem);
          updateGameState({ equippedItems: filtered });
        } else {
          updateGameState({ equippedItems: [...currentEquipped, draggingItem] });
        }
      } else {
        if (frogRef.current) {
          const frogRect = frogRef.current.getBoundingClientRect();
          const padding = 50; // Allow a 50px overflow buffer for dropping large items
          if (
            e.clientX >= frogRect.left - padding && e.clientX <= frogRect.right + padding &&
            e.clientY >= frogRect.top - padding && e.clientY <= frogRect.bottom + padding
          ) {
            const dropX = ((e.clientX - frogRect.left) / frogRect.width) * 100;
            const dropY = ((e.clientY - frogRect.top) / frogRect.height) * 100;
            const newItem = { name: draggingItem, top: `${dropY}%`, left: `${dropX}%` };
            const filtered = currentEquipped.filter(i => (typeof i === 'object' ? i.name : i) !== draggingItem);
            updateGameState({ equippedItems: [...filtered, newItem] });
          } else {
            const filtered = currentEquipped.filter(i => (typeof i === 'object' ? i.name : i) !== draggingItem);
            updateGameState({ equippedItems: filtered });
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
    const baseStyle = { position: 'absolute', pointerEvents: 'none', zIndex: 10, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    switch (item) {
      case 'iridescent_bow': return { ...baseStyle, width: '45px' };
      case 'pink_dress': return { ...baseStyle, width: '190px' };
      case 'blue_dress': return { ...baseStyle, width: '220px' };
      case 'frog_shirt': return { ...baseStyle, width: '130px' };
      case 'holographic_handbag': return { ...baseStyle, width: '45px' };
      case 'pink_heart_purse': return { ...baseStyle, width: '45px' };
      case 'pink_sunglasses': return { ...baseStyle, width: '60px' };
      default: return { ...baseStyle, width: '100px' };
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
        height: '400px',
        minHeight: '400px',
        backgroundImage: 'url(/assets/closet_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          bottom: '5%',
          left: 'calc(15% - 145px)',
          width: '250px',
          height: '250px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          borderRadius: '10px'
        }}
      >
        <div ref={frogRef} style={{ position: 'relative', display: 'inline-block', width: '150px', height: '150px', marginBottom: '40px' }}>
          <img 
            src={getFrogImage()} 
            alt="Frog" 
            style={{ width: '150px', height: '150px', objectFit: 'contain' }}
            draggable={false}
          />
          {CLOTHING_ITEMS.map(item => {
            const equippedItemObj = (gameState.equippedItems || []).find(i => (typeof i === 'object' ? i.name : i) === item);
            if (!equippedItemObj || draggingItem === item) return null;
            
            const isCustomPos = typeof equippedItemObj === 'object';
            const customStyle = isCustomPos ? { top: equippedItemObj.top, left: equippedItemObj.left } : {};

            return (
              <img 
                key={`equipped-${item}`}
                src={`/assets/clothing/${item}.png`} 
                alt={item} 
                style={{...getClothingStyle(item), ...customStyle, cursor: 'grab', pointerEvents: 'auto'}}
                onPointerDown={(e) => handlePointerDown(e, item)}
                draggable={false}
              />
            );
          })}
        </div>
      </div>

      {CLOTHING_ITEMS.map(item => {
        const isUnlocked = gameState.unlockedItems.includes(item);
        const isEquipped = (gameState.equippedItems || []).some(i => (typeof i === 'object' ? i.name : i) === item);
        
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
