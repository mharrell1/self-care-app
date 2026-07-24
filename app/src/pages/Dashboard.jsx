import React, { useState, useRef } from 'react';
import PetView, { getUpcomingHoliday } from '../components/PetView';
import FrogAvatar from '../components/FrogAvatar';
import { useGame } from '../context/GameContext';

const DAILY_AFFIRMATIONS = [
  "You are capable of achieving wonderful things today.",
  "Taking care of yourself is an act of self-love and strength.",
  "Small steps every day lead to big, beautiful progress.",
  "You deserve peace, happiness, and restful moments.",
  "Your presence makes the world a brighter, happier place.",
  "It is okay to pause, breathe, and recharge whenever you need.",
  "You are doing much better than you give yourself credit for.",
  "Be kind to yourself—you are growing and learning every single day.",
  "Today is a fresh opportunity to be gentle with your heart.",
  "You are worthy of all the good things coming your way.",
  "Trust your journey and believe in your unique resilience.",
  "Every small act of care for yourself creates positive ripples.",
  "You hold the power to create a peaceful day for yourself.",
  "Your feelings are valid, and your efforts truly matter.",
  "Embrace your unique self—there is no one else like you.",
  "You have overcome hard days before, and you can handle today too.",
  "Rest is productive. Give yourself permission to unwind.",
  "Celebrate your small wins—they matter just as much.",
  "You are allowed to take up space and express your true self.",
  "Peace begins with a single deep, gentle breath.",
  "Focus on progress, not perfection. You are doing great.",
  "Your kindness and warmth inspire those around you.",
  "Today, choose to nourish your mind, body, and spirit.",
  "You are stronger than your worries and calmer than your doubts.",
  "Surround yourself with thoughts that bring you joy.",
  "You have so much to offer, just by being who you are.",
  "Forgive yourself for yesterday and welcome the magic of today.",
  "Your potential is endless when you listen to your inner strength.",
  "Everything you need to thrive is already within you.",
  "You are loved, appreciated, and deserving of happiness."
];

function getDailyAffirmation() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}

export default function Dashboard() {
  const { gameState, updateGameState, dismissAdventure, triggerAdventure, triggerHeart } = useGame();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef(null);

  const handleFeed = () => {
    triggerHeart();
    if (gameState.coins >= 10 && gameState.hunger < 100) {
      updateGameState({
        coins: gameState.coins - 10,
        hunger: Math.min(100, gameState.hunger + 20),
        happiness: Math.min(100, (gameState.happiness ?? 50) + 10)
      });
    }
  };

  const handlePlay = () => {
    triggerHeart();
    updateGameState({
      happiness: Math.min(100, (gameState.happiness ?? 50) + 10),
      hunger: Math.max(0, (gameState.hunger ?? 50) - 5)
    });
  };

  const handleDrinkWater = () => {
    triggerHeart();
    const todayStr = new Date().toLocaleDateString();
    let currentCount = gameState.waterCount || 0;
    if (gameState.lastWaterDate !== todayStr) {
      currentCount = 0;
    }
    updateGameState({
      waterCount: currentCount + 1,
      lastWaterDate: todayStr,
      cleanliness: Math.min(100, (gameState.cleanliness ?? 50) + 10),
      happiness: Math.min(100, (gameState.happiness ?? 50) + 5)
    });
  };

  const handleMedicine = () => {
    triggerHeart();
    const todayStr = new Date().toLocaleDateString();
    const isTaken = !gameState.medicationTaken;
    updateGameState({
      medicationTaken: isTaken,
      lastMedicineDate: todayStr,
      health: isTaken ? 100 : gameState.health,
      happiness: isTaken ? Math.min(100, (gameState.happiness ?? 50) + 15) : gameState.happiness
    });
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        updateGameState({
          customBackground: dataUrl,
          selectedBackground: 'custom',
          isSleeping: false,
          isVacation: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectBackground = (bgKey) => {
    if (bgKey === 'upload') {
      if (fileInputRef.current) fileInputRef.current.click();
      return;
    }
    const updates = {
      selectedBackground: bgKey,
      isSleeping: bgKey === 'bedtime',
      isVacation: bgKey === 'beach'
    };
    if (bgKey === 'bedtime') {
      updates.health = 100;
      updates.happiness = 100;
      updates.hunger = Math.min(100, (gameState.hunger ?? 50) + 25);
      updates.cleanliness = Math.min(100, (gameState.cleanliness ?? 50) + 25);
    } else if (bgKey === 'beach') {
      updates.happiness = 100;
      updates.health = Math.min(100, (gameState.health ?? 100) + 20);
    }
    updateGameState(updates);
  };

  return (
    <div>
      {/* Adventure Log Popup Modal */}
      {gameState?.pendingAdventure && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="window" style={{
            backgroundColor: '#fff',
            border: '3px solid var(--window-border-dark)',
            borderRadius: '8px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            <div className="window-header" style={{
              backgroundColor: 'var(--window-title-bg)',
              color: 'var(--window-title-text)',
              padding: '0.4rem 0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <span>Adventure Log.exe</span>
              <button 
                onClick={dismissAdventure}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}
              >
                X
              </button>
            </div>

            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{
                width: '130px',
                height: '130px',
                margin: '0 auto 0.5rem',
                border: '2px solid var(--window-border-dark)',
                borderRadius: '8px',
                backgroundImage: "url('/assets/adventure_bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)'
              }}>
                <div style={{ width: '100%', height: '100%', transform: 'scale(0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FrogAvatar gameState={gameState} />
                </div>
              </div>

              <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                While You Were Away...
              </h3>
              
              <div style={{
                backgroundColor: 'var(--bg-color)',
                border: '2px solid var(--window-border)',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                lineHeight: '1.4',
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.3rem' }}>
                  Location: {gameState.pendingAdventure.location}
                </div>
                <div style={{ marginBottom: '0.4rem' }}>
                  {gameState.petName || 'Froggy'} {gameState.pendingAdventure.story}
                </div>
                <div style={{ fontStyle: 'italic', borderTop: '1px dashed var(--window-border-light)', paddingTop: '0.4rem', marginTop: '0.4rem', color: '#424242' }}>
                  "{gameState.pendingAdventure.lesson}"
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.75rem' }}>
                Reward: +{gameState.pendingAdventure.coins} Coins & +{gameState.pendingAdventure.happiness}% Happiness!
              </div>

              <button 
                className="btn" 
                onClick={dismissAdventure}
                style={{ padding: '0.35rem 1.25rem', fontSize: '0.95rem', fontWeight: 'bold' }}
              >
                Welcome Back!
              </button>
            </div>
          </div>
        </div>
      )}

      <PetView />

      {/* Daily Affirmation Card */}
      <div style={{
        backgroundColor: 'var(--bg-color)',
        border: '2px solid var(--window-border-dark)',
        borderRadius: '8px',
        padding: '0.65rem 0.85rem',
        margin: '0.6rem auto 0.4rem auto',
        textAlign: 'center',
        boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
        maxWidth: '380px'
      }}>
        <div style={{ fontFamily: 'var(--header-font)', fontSize: '0.72rem', color: 'var(--primary-color)', marginBottom: '0.3rem' }}>
          Daily Affirmation
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: '1.35' }}>
          "{getDailyAffirmation()}"
        </p>
      </div>

      {/* Recent Adventure Display Card */}
      {gameState?.lastAdventure && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid var(--window-border)',
          borderRadius: '6px',
          padding: '0.6rem 0.8rem',
          margin: '0.5rem 0',
          textAlign: 'left',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recent Adventure</span>
            <span style={{ fontSize: '0.75rem', color: '#666' }}>{gameState.lastAdventure.location}</span>
          </div>
          <p style={{ margin: '0 0 0.2rem 0', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            {gameState.petName || 'Froggy'} {gameState.lastAdventure.story}
          </p>
          <p style={{ margin: 0, fontStyle: 'italic', color: '#555', fontSize: '0.8rem' }}>
            "{gameState.lastAdventure.lesson}"
          </p>
        </div>
      )}
      
      {/* Main Buttons Row: Feed, Play, Water, Medicine, Adventure */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          onClick={handleFeed}
          disabled={gameState.coins < 10 || gameState.hunger >= 100}
          style={{ padding: '0.4rem 0.85rem', fontSize: '1.25rem' }}
        >
          Feed (10 Coins)
        </button>
        <button 
          className="btn" 
          onClick={handlePlay}
          disabled={gameState.happiness >= 100}
          style={{ padding: '0.4rem 0.85rem', fontSize: '1.25rem' }}
        >
          Play
        </button>
        <button 
          className="btn" 
          onClick={handleDrinkWater}
          style={{ padding: '0.4rem 0.85rem', fontSize: '1.25rem' }}
        >
          Water
        </button>
        <button 
          className="btn" 
          onClick={handleMedicine}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '1.25rem',
            backgroundColor: gameState.medicationTaken ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: gameState.medicationTaken ? 'var(--window-title-text)' : 'var(--text-primary)'
          }}
        >
          {gameState.medicationTaken ? 'Medicine Taken' : 'Medicine'}
        </button>
        <button 
          className="btn" 
          onClick={triggerAdventure}
          style={{ padding: '0.4rem 0.85rem', fontSize: '1.25rem' }}
        >
          Adventure
        </button>
      </div>

      {/* Hidden File Input for Custom Background Image */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={handleCustomImageUpload} 
      />

      <div style={{ marginTop: '0.75rem', borderTop: '2px dashed var(--window-border-light)', paddingTop: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Settings</h3>
        
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
        <div style={{ marginBottom: '1rem' }}>
          <strong>Theme Color: </strong>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {['pink', 'purple', 'blue', 'green'].map(color => (
              <button
                key={color}
                className="btn"
                style={{ 
                  padding: '0.3rem 0.65rem',
                  fontSize: '1.0rem',
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

        {/* Background Options Setting (underneath Theme Color) */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>Background Options: </strong>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {[
              { key: 'default', label: 'Default' },
              { key: 'bedtime', label: 'Bedtime' },
              { key: 'beach', label: 'Beach' },
              { key: 'jungle', label: 'Jungle' },
              { key: 'ocean', label: 'Ocean' },
              { key: 'purple_sky', label: 'Purple Sky' },
              { key: 'seasonal', label: `Seasonal (${getUpcomingHoliday().label})` },
              { key: 'rainbow', label: 'Rainbow' },
              { key: 'upload', label: gameState?.customBackground ? 'Upload (Change)' : 'Upload' }
            ].map(bg => {
              const currentBg = gameState?.selectedBackground || (gameState?.isSleeping ? 'bedtime' : gameState?.isVacation ? 'beach' : 'default');
              const isActive = currentBg === bg.key || (bg.key === 'upload' && currentBg === 'custom');
              return (
                <button
                  key={bg.key}
                  className="btn"
                  onClick={() => handleSelectBackground(bg.key)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 'bold' : 'normal',
                    backgroundColor: isActive ? 'var(--window-title-bg)' : 'var(--button-bg)',
                    color: isActive ? 'var(--window-title-text)' : 'var(--text-primary)',
                    borderWidth: isActive ? '3px' : '2px'
                  }}
                >
                  {bg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
