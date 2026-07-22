import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getMoodHistory, saveMood, saveJournalEntry } from '../services/db';
import { Play, Square } from 'lucide-react';

export default function SelfCare() {
  const navigate = useNavigate();
  const { gameState, updateGameState, userId } = useGame();
  const [moods, setMoods] = useState([]);
  const [breathingPhase, setBreathingPhase] = useState('idle'); // idle, inhale, hold, exhale
  const [breatheScale, setBreatheScale] = useState(1);
  const [meditationTime, setMeditationTime] = useState(0);
  const [meditationActive, setMeditationActive] = useState(false);

  useEffect(() => {
    getMoodHistory(userId).then(setMoods);
  }, [userId]);

  const handleMoodSelect = async (mood) => {
    const entry = { date: new Date().toISOString(), mood };
    await saveMood(userId, entry);
    setMoods([...moods, entry]);
    
    // Reward for tracking mood
    if (gameState.coins < 1000) {
      updateGameState({ coins: gameState.coins + 20, happiness: Math.min(100, gameState.happiness + 15) });
    }
  };

  const handleSaveMoodToJournal = async () => {
    if (!moods.length) return;
    const lastMood = moods[moods.length - 1];
    const journalText = `Mood Log (${new Date(lastMood.date).toLocaleDateString()}): Feeling ${lastMood.mood}`;
    await saveJournalEntry(userId, journalText);
    navigate('/journal');
  };

  // Breathing Exercise Logic
  useEffect(() => {
    let timeout;
    if (breathingPhase === 'inhale') {
      setBreatheScale(1.5);
      timeout = setTimeout(() => setBreathingPhase('hold'), 3000);
    } else if (breathingPhase === 'hold') {
      timeout = setTimeout(() => setBreathingPhase('exhale'), 2000);
    } else if (breathingPhase === 'exhale') {
      setBreatheScale(1);
      timeout = setTimeout(() => {
        // give small reward
        updateGameState({ happiness: Math.min(100, gameState.happiness + 5), coins: gameState.coins + 5 });
        setBreathingPhase('idle');
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [breathingPhase]);

  // Meditation Logic
  useEffect(() => {
    let interval;
    if (meditationActive) {
      interval = setInterval(() => setMeditationTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [meditationActive]);

  const stopMeditation = () => {
    setMeditationActive(false);
    // Give reward based on time
    const earnedCoins = Math.floor(meditationTime / 10);
    if (earnedCoins > 0) {
      updateGameState({ 
        coins: gameState.coins + earnedCoins,
        happiness: Math.min(100, gameState.happiness + Math.min(50, earnedCoins)) 
      });
    }
    setMeditationTime(0);
  };

  return (
    <div style={{ padding: '0.5rem 1rem' }}>
      
      {/* Mood Tracker */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Mood Tracker</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>How are you feeling today?</p>
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          {[
            { label: 'Great', img: 'mood_great.png' },
            { label: 'Good', img: 'mood_good.png' },
            { label: 'Okay', img: 'mood_okay.png' },
            { label: 'Sad', img: 'mood_sad.png' },
            { label: 'Angry', img: 'mood_angry.png' }
          ].map(m => (
            <button key={m.label} className="btn" onClick={() => handleMoodSelect(m.label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.25rem', flex: 1, minWidth: 0 }}>
              <img src={`/assets/${m.img}`} alt={m.label} style={{ width: '100%', maxWidth: '40px' }} />
              <span style={{ fontSize: '0.75rem' }}>{m.label}</span>
            </button>
          ))}
        </div>
        {moods.length > 0 && (
          <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span>Last logged: {new Date(moods[moods.length-1].date).toLocaleDateString()} - <strong>{moods[moods.length-1].mood}</strong></span>
            <button 
              className="btn" 
              onClick={handleSaveMoodToJournal}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              Save Mood to Journal
            </button>
          </div>
        )}
      </div>

      <hr style={{ borderTop: '2px dashed var(--window-border-light)', margin: '0.5rem 0' }} />

      {/* Breathing */}
      <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Breathing Exercise</h3>
        
        <div style={{ margin: '1rem auto 1.5rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
          <img 
            src="/assets/frog_naked_transparent.png" 
            alt="Breathing Frog" 
            style={{
              width: '120px',
              marginTop: '1rem',
              transition: 'transform 3s ease-in-out',
              transform: `scale(${breatheScale})`
            }} 
          />
          <div style={{ marginTop: '2rem', fontWeight: 'bold', fontSize: '1rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
            {breathingPhase === 'idle' ? 'Ready' : breathingPhase}
          </div>
        </div>

        {breathingPhase === 'idle' && (
          <button className="btn" onClick={() => setBreathingPhase('inhale')} style={{ padding: '0.25rem 1rem', fontSize: '1rem' }}>Start Breathing</button>
        )}
      </div>

      <hr style={{ borderTop: '2px dashed var(--window-border-light)', margin: '0.5rem 0' }} />

      {/* Meditation */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Meditation Timer</h3>
        <div style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>
          {Math.floor(meditationTime / 60)}:{(meditationTime % 60).toString().padStart(2, '0')}
        </div>
        {!meditationActive ? (
          <button className="btn" onClick={() => setMeditationActive(true)} style={{ padding: '0.25rem 1rem', fontSize: '1rem' }}>
            <Play size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/>
            Start
          </button>
        ) : (
          <button className="btn" onClick={stopMeditation} style={{ padding: '0.25rem 1rem', fontSize: '1rem' }}>
            <Square size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/>
            Stop & Claim Reward
          </button>
        )}
      </div>
    </div>
  );
}
