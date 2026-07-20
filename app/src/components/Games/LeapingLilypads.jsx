import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';

const GRAVITY = 0.5;
const MAX_POWER = 16;
const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 600;

export default function LeapingLilypads({ onExit }) {
  const { gameState, updateGameState } = useGame();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const frogRef = useRef({ x: 200, y: 50, vx: 0, vy: 0, width: 40, height: 40, isGrounded: true });
  const padsRef = useRef([]); 
  
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [charge, setCharge] = useState(0);
  const [angle, setAngle] = useState(0);
  const isCharging = useRef(false);
  const chargeVal = useRef(0);
  const angleVal = useRef(0);
  
  const frameRef = useRef(null);
  const cameraY = useRef(0);

  const startGame = () => {
    frogRef.current = { x: 200, y: 50, vx: 0, vy: 0, width: 40, height: 40, isGrounded: true };
    cameraY.current = 0;
    padsRef.current = [
      { x: 200, y: 50, width: 100, height: 20 }
    ];
    for (let i = 1; i < 8; i++) {
      padsRef.current.push({
        x: Math.random() * (SCREEN_WIDTH - 100) + 50,
        y: i * 120 + 50,
        width: 80,
        height: 20
      });
    }
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    isCharging.current = false;
    chargeVal.current = 0;
    angleVal.current = 0;
  };

  const updatePhysics = () => {
    const frog = frogRef.current;
    
    if (frog.isGrounded) {
       frog.vx *= 0.8;
       
       if (isCharging.current) {
          chargeVal.current = Math.min(MAX_POWER, chargeVal.current + 0.3);
       } else if (chargeVal.current > 0) {
          frog.vy = chargeVal.current;
          frog.vx = (angleVal.current / 45) * (chargeVal.current * 0.6);
          frog.isGrounded = false;
          chargeVal.current = 0;
       }
    } else {
      frog.vy -= GRAVITY;
      frog.x += frog.vx;
      const prevY = frog.y;
      frog.y += frog.vy;
      
      if (frog.x < 20) { frog.x = 20; frog.vx *= -0.5; }
      if (frog.x > SCREEN_WIDTH - 20) { frog.x = SCREEN_WIDTH - 20; frog.vx *= -0.5; }
      
      if (frog.vy < 0) {
        for (let pad of padsRef.current) {
          if (prevY >= pad.y && frog.y <= pad.y) {
             if (frog.x > pad.x - pad.width/2 && frog.x < pad.x + pad.width/2) {
                 frog.y = pad.y;
                 frog.vy = 0;
                 frog.vx = 0;
                 frog.isGrounded = true;
                 
                 const padIndex = Math.floor(pad.y / 120);
                 setScore(s => Math.max(s, padIndex * 10));
                 break;
             }
          }
        }
      }
    }
    
    if (frog.y > cameraY.current + SCREEN_HEIGHT * 0.4) {
       cameraY.current = frog.y - SCREEN_HEIGHT * 0.4;
    }
    
    const highestPad = padsRef.current[padsRef.current.length - 1];
    if (highestPad.y < cameraY.current + SCREEN_HEIGHT) {
       padsRef.current.push({
         x: Math.random() * (SCREEN_WIDTH - 100) + 50,
         y: highestPad.y + 120,
         width: 80 - Math.min(40, Math.floor(score/100)*5), // gets smaller over time
         height: 20
       });
    }
    
    padsRef.current = padsRef.current.filter(p => p.y > cameraY.current - 100);
    
    if (frog.y < cameraY.current - 20) {
       setGameOver(true);
       setIsPlaying(false);
       return; 
    }
    
    setCharge(chargeVal.current);
    setAngle(angleVal.current);
    setRenderTrigger(prev => prev + 1);
    
    frameRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    if (isPlaying && !gameOver) {
      frameRef.current = requestAnimationFrame(updatePhysics);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (gameOver && score > 0) {
       const earnedCoins = Math.floor(score / 10) * 2; 
       if (earnedCoins > 0) {
          updateGameState({ 
            coins: gameState.coins + earnedCoins,
            happiness: Math.min(100, gameState.happiness + 5)
          });
       }
    }
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || gameOver) return;
      if (e.code === 'Space') {
         isCharging.current = true;
         e.preventDefault();
      }
      if (e.code === 'ArrowLeft') {
         angleVal.current = Math.max(-45, angleVal.current - 5);
         e.preventDefault();
      }
      if (e.code === 'ArrowRight') {
         angleVal.current = Math.min(45, angleVal.current + 5);
         e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
       if (e.code === 'Space') {
          isCharging.current = false;
       }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver]);

  const getTop = (y) => `${100 - ((y - cameraY.current) / SCREEN_HEIGHT) * 100}%`;
  const getLeft = (x) => `${(x / SCREEN_WIDTH) * 100}%`;

  const frog = frogRef.current;

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', 
      backgroundColor: 'var(--window-bg)', padding: '1rem', borderRadius: '10px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <button className="btn-close" onClick={onExit}>X</button>
        <h2 style={{ fontFamily: 'var(--header-font)', color: 'var(--primary-color)' }}>Leaping Lilypads</h2>
        <div style={{ fontWeight: 'bold' }}>Score: {score}</div>
      </div>

      <div style={{
        position: 'relative', overflow: 'hidden', 
        backgroundColor: '#4ea8d6', 
        backgroundImage: 'url(/assets/lilypad_bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'bottom center',
        borderRadius: '10px', border: '3px solid var(--window-border-dark)',
        maxWidth: '500px', margin: '0 auto', width: '100%',
        height: '350px'
      }}>
        {!isPlaying && !gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ffb3ba' }}>How to Play</h3>
            <p style={{ marginBottom: '0.5rem' }}>Hold Spacebar or tap 'JUMP' to charge your jump.</p>
            <p style={{ marginBottom: '1.5rem' }}>Use Left/Right arrows or buttons to aim.</p>
            <button className="btn" onClick={startGame} style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>Start Game!</button>
          </div>
        )}

        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffdfba' }}>Splash!</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Final Score: {score}</p>
            <p style={{ marginBottom: '1.5rem', color: '#baffc9' }}>+{Math.floor(score/10)*2} Coins!</p>
            <button className="btn" onClick={startGame}>Play Again</button>
          </div>
        )}

        {(isPlaying || gameOver) && (
          <>
            {/* Render Lilypads */}
            {padsRef.current.map((pad, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: getLeft(pad.x),
                top: getTop(pad.y),
                width: `${(pad.width / SCREEN_WIDTH) * 100}%`,
                height: '15px',
                transform: 'translate(-50%, 0)',
                backgroundColor: '#3bb143',
                borderRadius: '50%',
                borderBottom: '3px solid #236b28',
                boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.2)'
              }} />
            ))}

            {/* Render Frog */}
            <div style={{
              position: 'absolute',
              left: getLeft(frog.x),
              top: getTop(frog.y),
              width: '12%',
              height: 'auto',
              aspectRatio: '1/1',
              transform: 'translate(-50%, -100%)',
              zIndex: 10
            }}>
              <img src="/assets/frog_naked_transparent.png" alt="Frog" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              
              {/* Aim Indicator Arrow */}
              {frog.isGrounded && isPlaying && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '50%',
                  width: '4px',
                  height: '150%',
                  backgroundColor: 'rgba(255, 255, 0, 0.7)',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  zIndex: -1,
                  borderRadius: '2px',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0', height: '0',
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '10px solid rgba(255, 255, 0, 0.7)'
                  }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls Area */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '300px', height: '25px', backgroundColor: '#e0e0e0', borderRadius: '15px', overflow: 'hidden', border: '2px solid var(--window-border-dark)' }}>
          <div style={{ 
            width: `${(charge / MAX_POWER) * 100}%`, 
            height: '100%', 
            backgroundColor: charge > MAX_POWER * 0.8 ? '#ff5252' : charge > MAX_POWER * 0.5 ? '#ffb142' : '#33d9b2',
            transition: 'background-color 0.2s, width 0.05s'
          }} />
        </div>
        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)' }}>Jump Power</p>
        
        {/* On-screen controls for mobile/mouse */}
        <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button 
            className="btn" 
            onPointerDown={() => { angleVal.current = Math.max(-45, angleVal.current - 5); setAngle(angleVal.current); }}
            style={{ flex: 1, padding: '1rem', fontSize: '1.5rem' }}
          >
            ← Aim
          </button>
          
          <button 
            className="btn"
            style={{ flex: 1, backgroundColor: '#ffb3ba' }}
            onPointerDown={(e) => { e.preventDefault(); isCharging.current = true; }}
            onPointerUp={(e) => { e.preventDefault(); isCharging.current = false; }}
            onPointerLeave={(e) => { e.preventDefault(); isCharging.current = false; }}
            onContextMenu={(e) => e.preventDefault()}
          >
            JUMP
          </button>

          <button 
            className="btn" 
            onPointerDown={() => { angleVal.current = Math.min(45, angleVal.current + 5); setAngle(angleVal.current); }}
            style={{ flex: 1, padding: '1rem', fontSize: '1.5rem' }}
          >
            Aim →
          </button>
        </div>
      </div>
    </div>
  );
}
