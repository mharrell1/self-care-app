
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext';

export default function FishingGame({ onExit }) {
  const { gameState, updateGameState } = useGame();

  // 'start' | 'waiting' | 'bite' | 'won' | 'lost'
  const [phase, setPhase] = useState('start');

  // Game config
  const [clicksNeeded, setClicksNeeded] = useState(1);
  const [catchType, setCatchType] = useState('common');
  const [needleAngle, setNeedleAngle] = useState(0);
  const [targetZone, setTargetZone] = useState({ start: 0, width: 45 }); // degrees
  const [needleSpeed, setNeedleSpeed] = useState(3); // degrees per frame

  const requestRef = useRef();

  // Animation Loop for the needle
  const animate = useCallback(() => {
    if (phase === 'bite') {
      setNeedleAngle(prev => (prev + needleSpeed) % 360);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [phase, needleSpeed]);

  useEffect(() => {
    if (phase === 'bite') {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [phase, animate]);

  // Start Fishing
  const handleCastLine = () => {
    setPhase('waiting');

    // Random wait time before a bite
    const waitTime = Math.random() * 3000 + 2000; // 2-5 seconds
    setTimeout(() => {
      // Determine rarity
      const roll = Math.random();
      let rarity = 'common';
      let clicks = 2; // at least 2 clicks
      let speed = 1.5;
      let width = 60;

      if (roll > 0.9) {
        rarity = 'epic';
        clicks = 4;
        speed = 2.5;
        width = 40;
      } else if (roll > 0.6) {
        rarity = 'rare';
        clicks = 3;
        speed = 2.0;
        width = 50;
      }

      setCatchType(rarity);
      setClicksNeeded(clicks);
      setNeedleSpeed(speed);

      randomizeZone(width);
      setNeedleAngle(0);
      setPhase('bite');
    }, waitTime);
  };

  const randomizeZone = (width) => {
    // Keep it away from 0 so they don't immediately click
    const start = Math.random() * (360 - width - 60) + 30;
    setTargetZone({ start, width });
  };

  const handleReelIn = () => {
    if (phase !== 'bite') return;

    // Check if needle is inside the zone
    // Handle wrap around if needed, but our start + width is < 360
    const end = targetZone.start + targetZone.width;

    if (needleAngle >= targetZone.start && needleAngle <= end) {
      // Success
      if (clicksNeeded > 1) {
        setClicksNeeded(c => c - 1);
        setNeedleSpeed(s => s + 0.5); // Speed up slightly
        randomizeZone(targetZone.width - 5); // Make it slightly harder
      } else {
        // Win!
        setPhase('won');
        let coins = 10;
        let happiness = 10;
        if (catchType === 'rare') { coins = 25; happiness = 20; }
        if (catchType === 'epic') { coins = 50; happiness = 40; }

        updateGameState({
          coins: gameState.coins + coins,
          happiness: Math.min(100, gameState.happiness + happiness)
        });
      }
    } else {
      // Missed!
      setPhase('lost');
    }
  };

  return (
    <div style={{ padding: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="btn" onClick={onExit}>&lt; Back</button>
        <span>Fishing.exe</span>
      </div>

      <div style={{ 
        position: 'relative', 
        height: '500px', 
        width: '100%',
        backgroundImage: 'url(/assets/fishing/pond_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '4px solid var(--window-border-dark)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Rod */}
        {phase !== 'won' && phase !== 'lost' && (
          <img 
            src="/assets/fishing/rod.png" 
            alt="Fishing Rod" 
            style={{ 
              position: 'absolute', 
              bottom: '25%', 
              left: '52%', 
              width: '150px',
              zIndex: 11
            }} 
          />
        )}

        {/* Frog */}
        {phase !== 'won' && phase !== 'lost' && (
          <img 
            src="/assets/frog_naked_transparent.png" 
            alt="Frog" 
            style={{ 
              position: 'absolute', 
              bottom: '25%', 
              left: '45%', 
              width: '120px',
              zIndex: 10
            }} 
          />
        )}

        {/* --- Start Phase --- */}
        {phase === 'start' && (
          <div style={{ position: 'absolute', top: '15%', width: '100%', textAlign: 'center' }}>
            <h2 style={{ textShadow: '1px 1px 2px white' }}>Ready to fish?</h2>
            <button className="btn" onClick={handleCastLine} style={{ marginTop: '1rem', fontSize: '1.2rem', padding: '0.5rem 2rem' }}>
              Cast Line
            </button>
          </div>
        )}

        {/* --- Waiting Phase --- */}
        {phase === 'waiting' && (
          <div style={{ position: 'absolute', top: '15%', width: '100%', textAlign: 'center' }}>
            <h2 style={{ textShadow: '1px 1px 2px white' }}>Waiting for a bite...</h2>
            {/* Simple bobber placeholder */}
            <div style={{ position: 'absolute', top: '250px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px', backgroundColor: 'red', borderRadius: '50%', border: '2px solid white', animation: 'bob 2s infinite ease-in-out' }} />
          </div>
        )}

        {/* --- Bite Phase (Mini-game) --- */}
        {phase === 'bite' && (
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
            onClick={handleReelIn}
          >
            <h2 style={{ color: 'white', marginBottom: '2rem', textShadow: '1px 1px 2px black' }}>
              Click when in the green zone! ({clicksNeeded} left)
            </h2>

            {/* Timing Widget */}
            <div style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              backgroundColor: '#ccc',
              border: '8px solid #555',
              cursor: 'pointer',
              // Conic gradient to draw the green zone
              background: `conic-gradient(
                #ccc 0deg, 
                #ccc ${targetZone.start}deg, 
                #4caf50 ${targetZone.start}deg, 
                #4caf50 ${targetZone.start + targetZone.width}deg, 
                #ccc ${targetZone.start + targetZone.width}deg, 
                #ccc 360deg
              )`
            }}>
              {/* Center Pivot */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30px', height: '30px', backgroundColor: '#333', borderRadius: '50%', zIndex: 5 }} />

              {/* Rotating Needle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '4px',
                height: '90px',
                backgroundColor: 'red',
                transformOrigin: 'top center',
                transform: `rotate(${needleAngle + 180}deg)`, // +180 so it points outward from center
                zIndex: 4,
                boxShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }} />
            </div>
          </div>
        )}

        {/* --- Won/Lost Phase --- */}
        {(phase === 'won' || phase === 'lost') && (
          <div style={{ position: 'absolute', top: '5%', width: '100%', textAlign: 'center', zIndex: 30 }}>
            {phase === 'won' ? (
              <>
                <h2 style={{ fontSize: '2rem', color: '#4caf50', margin: '0 0 5px 0', textShadow: '1px 1px 2px white' }}>Caught!</h2>
                <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 5px 0', textShadow: '1px 1px 2px white' }}>You caught a {catchType} fish!</p>
                <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.25rem 1rem', borderRadius: '1rem', border: '2px solid #ccc' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#e6a822' }}>
                    +{catchType === 'epic' ? 50 : catchType === 'rare' ? 25 : 10} Coins,
                    +{catchType === 'epic' ? 40 : catchType === 'rare' ? 20 : 10} Happiness
                  </p>
                </div>
                <div style={{ position: 'relative', display: 'inline-block', marginTop: '0.5rem' }}>
                  <img src="/assets/frog_naked_transparent.png" alt="Happy Frog" style={{ width: '160px' }} />
                  {/* Position the fish on top of its lap */}
                  <img src={`/assets/fishing/fish_${catchType}.png`} alt="Caught Fish" style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translate(-50%, 0)', width: '70px' }} />
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '2.5rem', color: '#f44336', margin: '0 0 10px 0', textShadow: '1px 1px 2px white' }}>It got away!</h2>
                <img src="/assets/cooking/frog_frowning.png" alt="Sad Frog" style={{ width: '160px', marginTop: '1rem' }} />
              </>
            )}
            <br />
            <button className="btn" onClick={onExit} style={{ marginTop: '0.5rem', fontSize: '1.2rem', padding: '0.5rem 2rem' }}>Done</button>
          </div>
        )}
      </div>

      {/* Bob Animation style */}
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -10px); }
        }
      `}</style>
    </div>
  );
}
