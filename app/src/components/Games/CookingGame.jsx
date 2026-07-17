import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';

export default function CookingGame({ onExit }) {
  const { gameState, updateGameState } = useGame();
  
  // phase: start, chop_carrots, chop_tomatoes, add, mix, cook, won, lost
  const [phase, setPhase] = useState('start');
  const [timeLeft, setTimeLeft] = useState(60); // 60s for the whole game to allow 10s mixing
  
  // Phase logic
  const [chopsLeft, setChopsLeft] = useState(3);
  const [ingredientsToAdd, setIngredientsToAdd] = useState(2);
  const [mixProgress, setMixProgress] = useState(0); // target: 100%
  const [cookProgress, setCookProgress] = useState(0); // target: 100%
  
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);

  useEffect(() => {
    let timer;
    if (phase !== 'start' && phase !== 'won' && phase !== 'lost' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && phase !== 'won' && phase !== 'lost') {
      setPhase('lost');
    }
    return () => clearTimeout(timer);
  }, [timeLeft, phase]);

  useEffect(() => {
    // 10 second mix timer based on movement
    let mixTimer;
    if (phase === 'mix') {
      mixTimer = setInterval(() => {
        if (isMoving.current) {
          setMixProgress(p => {
            const newP = p + (100 / 100); // 100 intervals (10 secs of 100ms) = 100%
            if (newP >= 100) {
              setPhase('cook');
              return 100;
            }
            return newP;
          });
          isMoving.current = false; // Reset, requires continuous movement to trigger again
        }
      }, 100);
    }
    return () => clearInterval(mixTimer);
  }, [phase]);

  const startGame = () => {
    setChopsLeft(2);
    setIngredientsToAdd(2);
    setMixProgress(0);
    setCookProgress(0);
    setTimeLeft(60);
    setPhase('chop_carrots');
  };

  const handleChop = () => {
    if (phase !== 'chop_carrots' && phase !== 'chop_tomatoes') return;
    if (chopsLeft - 1 <= 0) {
      if (phase === 'chop_carrots') {
        setPhase('chop_tomatoes');
        setChopsLeft(2);
      } else {
        setPhase('add');
      }
    } else {
      setChopsLeft(c => c - 1);
    }
  };

  const handleAddIngredient = () => {
    if (phase !== 'add') return;
    if (ingredientsToAdd - 1 <= 0) {
      setPhase('mix');
    } else {
      setIngredientsToAdd(i => i - 1);
    }
  };

  const trackMovement = (e) => {
    if (phase !== 'mix' && phase !== 'cook') return;
    
    isMoving.current = true;
    
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    
    if (lastMousePos.current.x === 0 && lastMousePos.current.y === 0) {
      lastMousePos.current = { x, y };
      return;
    }
    
    const dx = Math.abs(x - lastMousePos.current.x);
    const dy = Math.abs(y - lastMousePos.current.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    lastMousePos.current = { x, y };

    if (phase === 'cook') {
      const newCook = cookProgress + (distance / 20);
      if (newCook >= 100) {
        setPhase('won');
        updateGameState({
          coins: gameState.coins + 30,
          hunger: Math.min(100, gameState.hunger + 50),
          happiness: Math.min(100, gameState.happiness + 20)
        });
      } else {
        setCookProgress(newCook);
      }
    }
  };

  const resetMouse = () => {
    lastMousePos.current = { x: 0, y: 0 };
    isMoving.current = false;
  };

  const getBackground = () => {
    if (phase === 'cook' || phase === 'won' || phase === 'lost') return 'url(/assets/cooking/bg_stove.png)';
    return 'url(/assets/cooking/bg_counter.png)';
  };
  
  const getCursor = () => {
    if (phase === 'chop_carrots' || phase === 'chop_tomatoes') return 'url(/assets/cooking/knife_cursor.png) 16 32, crosshair';
    if (phase === 'mix') return 'url(/assets/cooking/whisk_cursor.png) 32 32, pointer';
    if (phase === 'cook') return 'url(/assets/cooking/spatula_cursor.png) 32 32, pointer';
    return 'default';
  };

  return (
    <div style={{ padding: '1rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn" onClick={onExit}>&lt; Back</button>
        <span>Cooking.exe</span>
      </div>

      <div style={{
        position: 'relative',
        height: '500px',
        width: '100%',
        backgroundImage: getBackground(),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '4px solid var(--window-border-dark)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: getCursor()
      }}>
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />

        {/* Header / Timer */}
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
          {phase !== 'start' && phase !== 'won' && phase !== 'lost' && (
            <h3 style={{ margin: 0, color: timeLeft <= 10 ? 'red' : 'black', textShadow: '1px 1px 2px white' }}>Time: {timeLeft}s</h3>
          )}
        </div>

        {/* --- Start Phase --- */}
        {phase === 'start' && (
          <div style={{ position: 'absolute', top: '40%', width: '100%', textShadow: '1px 1px 2px white' }}>
            <h2 style={{ fontSize: '2rem' }}>Cooking Time!</h2>
            <p>Prepare a delicious meal for {gameState.petName || 'Froggy'}!</p>
            <button className="btn" onClick={startGame} style={{ fontSize: '1.2rem', padding: '0.5rem 2rem' }}>Start</button>
          </div>
        )}

        {/* --- Chop Phase --- */}
        {(phase === 'chop_carrots' || phase === 'chop_tomatoes') && (
          <div style={{ position: 'absolute', top: '15%', width: '100%' }}>
            <h2 style={{ textShadow: '1px 1px 2px white' }}>Chop the {phase === 'chop_carrots' ? 'Carrots' : 'Tomatoes'}!</h2>
            <div 
              style={{
                width: '400px',
                height: '250px',
                margin: '1rem auto',
                backgroundImage: 'url(/assets/cooking/cutting_board.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                position: 'relative',
              }}
              onClick={handleChop}
            >
              <img 
                src={`/assets/cooking/${phase === 'chop_carrots' ? 'carrot' : 'tomato'}_strip_${2 - chopsLeft}.png`}
                alt="Ingredient"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* --- Add Phase --- */}
        {phase === 'add' && (
          <div style={{ position: 'absolute', top: '15%', width: '100%' }}>
            <h2 style={{ textShadow: '1px 1px 2px white' }}>Click to add chopped ingredients!</h2>
            <div 
              onClick={handleAddIngredient}
              style={{ position: 'relative', height: '300px', margin: '1rem auto', width: '400px', cursor: 'pointer' }}
            >
              <img 
                src="/assets/cooking/bowl.png"
                alt="Bowl"
                style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '250px',
                }}
              />
              {ingredientsToAdd > 0 && (
                <img 
                  src={`/assets/cooking/${ingredientsToAdd === 2 ? 'carrot' : 'tomato'}_strip_2.png`}
                  alt="Ingredient"
                  style={{
                    position: 'absolute',
                    top: '5%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '150px'
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* --- Mix Phase --- */}
        {phase === 'mix' && (
          <div 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onMouseMove={trackMovement}
            onTouchMove={trackMovement}
            onMouseLeave={resetMouse}
            onTouchEnd={resetMouse}
          >
            <div style={{ position: 'absolute', top: '15%', width: '100%', pointerEvents: 'none' }}>
              <h2 style={{ textShadow: '1px 1px 2px white' }}>Mix for 10 seconds!</h2>
              <div style={{ position: 'relative', height: '300px', margin: '1rem auto', width: '400px' }}>
                <img 
                  src="/assets/cooking/bowl.png"
                  alt="Bowl"
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '50%',
                    transform: `translateX(-50%) scale(${1 + Math.sin(mixProgress/10)*0.05})`,
                    width: '250px',
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '20%',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${mixProgress * 5}deg)`,
                  width: '180px',
                  height: '100px',
                  transition: 'transform 0.1s linear',
                }}>
                  <img src="/assets/cooking/carrot_strip_2.png" alt="Carrots" style={{ position: 'absolute', top: '10%', left: '10%', width: '100px', transform: 'rotate(20deg)' }} />
                  <img src="/assets/cooking/tomato_strip_2.png" alt="Tomatoes" style={{ position: 'absolute', top: '20%', left: '40%', width: '120px', transform: 'rotate(-15deg)' }} />
                </div>
              </div>
              <div style={{ width: '80%', height: '24px', backgroundColor: 'rgba(255,255,255,0.8)', border: '2px solid #333', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${mixProgress}%`, height: '100%', backgroundColor: '#4caf50' }} />
              </div>
            </div>
          </div>
        )}

        {/* --- Cook Phase --- */}
        {phase === 'cook' && (
          <div 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onMouseMove={trackMovement}
            onTouchMove={trackMovement}
            onMouseLeave={resetMouse}
            onTouchEnd={resetMouse}
          >
            <div style={{ position: 'absolute', top: '15%', width: '100%', pointerEvents: 'none' }}>
              <h2 style={{ textShadow: '1px 1px 2px white' }}>Cook it up! Keep stirring!</h2>
              <div style={{ position: 'relative', height: '300px', margin: '1rem auto', width: '400px' }}>
                <img 
                  src="/assets/cooking/frying_pan.png"
                  alt="Pan"
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '280px',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '25%',
                  left: '50%',
                  transform: `translateX(-50%) scale(${0.8 + (cookProgress / 100) * 0.4})`,
                  width: '160px',
                  height: '80px',
                  transition: 'transform 0.1s linear',
                }}>
                  <img src="/assets/cooking/carrot_strip_2.png" alt="Carrots" style={{ position: 'absolute', top: '10%', left: '0%', width: '90px', transform: 'rotate(45deg)', opacity: 1 - (cookProgress/200) }} />
                  <img src="/assets/cooking/tomato_strip_2.png" alt="Tomatoes" style={{ position: 'absolute', top: '15%', left: '30%', width: '110px', transform: 'rotate(-30deg)', opacity: 1 - (cookProgress/200) }} />
                  {/* Overlay a generic sauce look as it cooks */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: '#d84b20', borderRadius: '50%',
                    opacity: cookProgress / 100,
                    filter: 'blur(10px)'
                  }} />
                </div>
              </div>
              <div style={{ width: '80%', height: '24px', backgroundColor: 'rgba(255,255,255,0.8)', border: '2px solid #333', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${cookProgress}%`, height: '100%', backgroundColor: '#ff9800' }} />
              </div>
            </div>
          </div>
        )}

        {/* --- Won/Lost Phase --- */}
        {(phase === 'won' || phase === 'lost') && (
          <div style={{ position: 'absolute', top: '20%', width: '100%', textShadow: '1px 1px 2px white' }}>
            {phase === 'won' ? (
              <>
                <h2 style={{ fontSize: '2.5rem', color: '#4caf50', margin: '0 0 10px 0' }}>Delicious!</h2>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>{gameState.petName || 'Froggy'} loved the meal!</p>
                <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.8)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '2px solid #ccc' }}>
                   <p style={{ margin: 0, fontWeight: 'bold', color: '#e6a822' }}>+30 Coins, +50 Fullness</p>
                </div>
                <br />
                <div style={{ position: 'relative', display: 'inline-block', marginTop: '1rem' }}>
                  <img src="/assets/frog_naked_transparent.png" alt="Happy Frog" style={{ width: '200px' }} />
                  {/* Position the food on top in the middle */}
                  <img src="/assets/cooking/unknown_1.png" alt="Meal" style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translate(-50%, 0)', width: '130px' }} />
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '2.5rem', color: '#f44336', margin: '0 0 10px 0' }}>Oh no!</h2>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>You ran out of time...</p>
                <img src="/assets/cooking/frog_frowning.png" alt="Sad Frog" style={{ width: '200px', marginTop: '1rem' }} />
              </>
            )}
            <br/>
            <button className="btn" onClick={onExit} style={{ marginTop: '2rem', fontSize: '1.2rem', padding: '0.5rem 2rem' }}>Done</button>
          </div>
        )}

      </div>
    </div>
  );
}

