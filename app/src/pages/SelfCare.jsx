import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getMoodHistory, saveMood, saveJournalEntry } from '../services/db';
import { Play, Square } from 'lucide-react';

const SOUND_TRACKS = {
  rain: { title: "Gentle Rain" },
  night: { title: "Pond & Frogs" },
  lofi: { title: "Lofi Beats" }
};

// Web Audio API Sound Synthesizer Engine
function createRainSynth(ctx, masterGain) {
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  whiteNoise.connect(filter);
  filter.connect(masterGain);
  whiteNoise.start();

  return [whiteNoise, filter];
}

function createPondFrogSynth(ctx, masterGain) {
  // Soft Pond Water / Breeze Background
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.04;
  }
  const waterNoise = ctx.createBufferSource();
  waterNoise.buffer = noiseBuffer;
  waterNoise.loop = true;

  const waterFilter = ctx.createBiquadFilter();
  waterFilter.type = 'lowpass';
  waterFilter.frequency.value = 450;

  waterNoise.connect(waterFilter);
  waterFilter.connect(masterGain);
  waterNoise.start();

  // Periodic Relaxing Frog Croaks (Ribbits)
  let isStopped = false;

  const triggerFrogCroak = () => {
    if (isStopped) return;

    const now = ctx.currentTime;
    const duration = 0.35 + Math.random() * 0.2;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    
    const baseFreq = 160 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + duration * 0.4);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + duration);

    const amOsc = ctx.createOscillator();
    amOsc.frequency.value = 35 + Math.random() * 10;
    const amGain = ctx.createGain();
    amGain.gain.value = 0.4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.value = 3.0;

    const croakGain = ctx.createGain();
    croakGain.gain.setValueAtTime(0.001, now);
    croakGain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    croakGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    amOsc.connect(amGain.gain);
    osc.connect(filter);
    filter.connect(croakGain);
    croakGain.connect(masterGain);

    osc.start(now);
    amOsc.start(now);
    osc.stop(now + duration);
    amOsc.stop(now + duration);

    const nextInterval = 1800 + Math.random() * 2500;
    setTimeout(triggerFrogCroak, nextInterval);
  };

  setTimeout(triggerFrogCroak, 400);

  return [
    waterNoise,
    waterFilter,
    {
      stop: () => {
        isStopped = true;
        try { waterNoise.stop(); } catch {}
      }
    }
  ];
}

function createLofiSynth(ctx, masterGain) {
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.015;
  }
  const hiss = ctx.createBufferSource();
  hiss.buffer = noiseBuffer;
  hiss.loop = true;

  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'lowpass';
  hissFilter.frequency.value = 600;

  hiss.connect(hissFilter);
  hissFilter.connect(masterGain);
  hiss.start();

  const chordFrequencies = [
    [174.61, 220.00, 261.63, 329.63],
    [130.81, 164.81, 196.00, 246.94],
    [146.83, 174.61, 220.00, 261.63],
    [110.00, 130.81, 164.81, 196.00]
  ];

  let chordIndex = 0;
  const activeOscs = [];

  const chordGain = ctx.createGain();
  chordGain.gain.value = 0.06;

  const chordFilter = ctx.createBiquadFilter();
  chordFilter.type = 'lowpass';
  chordFilter.frequency.value = 700;

  const playChord = () => {
    const freqs = chordFrequencies[chordIndex];
    chordIndex = (chordIndex + 1) % chordFrequencies.length;
    
    activeOscs.forEach(o => { try { o.stop(); } catch {} });
    activeOscs.length = 0;

    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.connect(chordFilter);
      osc.start();
      activeOscs.push(osc);
    });
  };

  chordFilter.connect(chordGain);
  chordGain.connect(masterGain);

  playChord();
  const intervalId = setInterval(playChord, 3500);

  return [hiss, hissFilter, chordFilter, chordGain, { stop: () => { clearInterval(intervalId); activeOscs.forEach(o => { try { o.stop(); } catch {} }); } }];
}

export default function SelfCare() {
  const navigate = useNavigate();
  const { gameState, updateGameState, userId } = useGame();

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeNodesRef = useRef([]);

  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const stopAllNodes = () => {
    activeNodesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    activeNodesRef.current = [];
  };

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = volume;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    return () => {
      stopAllNodes();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch(e){}
      }
    };
  }, []);

  const playTrack = (trackId) => {
    const ctx = getAudioContext();

    if (activeTrack === trackId) {
      if (isPlaying) {
        ctx.suspend();
        setIsPlaying(false);
      } else {
        ctx.resume();
        setIsPlaying(true);
      }
    } else {
      stopAllNodes();
      
      let newNodes = [];
      if (trackId === 'rain') {
        newNodes = createRainSynth(ctx, masterGainRef.current);
      } else if (trackId === 'night') {
        newNodes = createPondFrogSynth(ctx, masterGainRef.current);
      } else if (trackId === 'lofi') {
        newNodes = createLofiSynth(ctx, masterGainRef.current);
      }

      activeNodesRef.current = newNodes;
      setActiveTrack(trackId);
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    stopAllNodes();
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.suspend(); } catch(e){}
    }
    setActiveTrack(null);
    setIsPlaying(false);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = newVol;
    }
  };
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

  // Checklist Logic
  const checklist = gameState.checklist || [];
  const [newChecklistText, setNewChecklistText] = useState('');

  const handleToggleTask = (taskId) => {
    let coinsChange = 0;
    let happinessChange = 0;
    const updated = checklist.map(task => {
      if (task.id === taskId) {
        const nextCompleted = !task.completed;
        coinsChange = nextCompleted ? 10 : -10;
        happinessChange = nextCompleted ? 10 : -10;
        return { ...task, completed: nextCompleted };
      }
      return task;
    });
    
    updateGameState({
      checklist: updated,
      coins: Math.max(0, (gameState.coins ?? 100) + coinsChange),
      happiness: Math.min(100, Math.max(0, (gameState.happiness ?? 50) + happinessChange))
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      completed: false
    };
    updateGameState({ checklist: [...checklist, newTask] });
    setNewChecklistText('');
  };

  const handleDeleteTask = (taskId) => {
    const taskToDelete = checklist.find(t => t.id === taskId);
    let coinsChange = 0;
    let happinessChange = 0;
    if (taskToDelete && taskToDelete.completed) {
      coinsChange = -10;
      happinessChange = -10;
    }
    const updated = checklist.filter(task => task.id !== taskId);
    updateGameState({
      checklist: updated,
      coins: Math.max(0, (gameState.coins ?? 100) + coinsChange),
      happiness: Math.min(100, Math.max(0, (gameState.happiness ?? 50) + happinessChange))
    });
  };

  return (
    <div style={{ padding: '0.5rem 1rem' }}>
      <style>{`
        @keyframes bounceBar {
          0% { height: 3px; }
          50% { height: 18px; }
          100% { height: 3px; }
        }
        .eq-bar {
          width: 3px;
          background-color: var(--text-primary);
          margin: 0 1px;
          height: 3px;
          transition: height 0.1s ease;
        }
        .eq-active-0 { animation: bounceBar 0.8s ease-in-out infinite; }
        .eq-active-1 { animation: bounceBar 0.5s ease-in-out infinite 0.1s; }
        .eq-active-2 { animation: bounceBar 0.7s ease-in-out infinite 0.3s; }
        .eq-active-3 { animation: bounceBar 0.6s ease-in-out infinite 0.2s; }
        .eq-active-4 { animation: bounceBar 0.9s ease-in-out infinite 0.4s; }
      `}</style>

      {/* Pond Sound Machine */}
      <div className="window" style={{ 
        marginBottom: '1rem', 
        backgroundColor: 'var(--bg-color)', 
        border: '3px solid var(--window-border-dark)',
        borderRadius: '8px',
        padding: '0.75rem',
        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.15)',
        marginTop: '0.25rem'
      }}>
        {/* LCD Screen Display */}
        <div style={{
          backgroundColor: 'var(--button-bg)',
          border: '2px solid var(--window-border-dark)',
          borderRadius: '4px',
          padding: '0.5rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--header-font)',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '42px',
          marginBottom: '0.65rem',
          boxShadow: 'inset 1.5px 1.5px 3px rgba(0,0,0,0.2)'
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', opacity: 0.7, marginBottom: '0.15rem' }}>POND SOUND MACHINE v1.0</div>
            <div>{activeTrack ? SOUND_TRACKS[activeTrack].title : "SYSTEM IDLE"}</div>
          </div>
          
          {/* LCD Equalizer Visualizer */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '22px' }}>
            {[0, 1, 2, 3, 4].map(idx => (
              <div 
                key={idx}
                className={`eq-bar ${isPlaying ? `eq-active-${idx}` : ''}`} 
              />
            ))}
          </div>
        </div>

        {/* Tactile Player Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              className="btn" 
              onClick={() => playTrack('rain')}
              style={{
                padding: '0.2rem 0.5rem', 
                fontSize: '0.8rem',
                backgroundColor: activeTrack === 'rain' ? 'var(--button-active)' : 'var(--button-bg)',
                fontWeight: activeTrack === 'rain' ? 'bold' : 'normal'
              }}
            >
              Rain
            </button>
            <button 
              className="btn" 
              onClick={() => playTrack('night')}
              style={{
                padding: '0.2rem 0.5rem', 
                fontSize: '0.8rem',
                backgroundColor: activeTrack === 'night' ? 'var(--button-active)' : 'var(--button-bg)',
                fontWeight: activeTrack === 'night' ? 'bold' : 'normal'
              }}
            >
              Pond Frogs
            </button>
            <button 
              className="btn" 
              onClick={() => playTrack('lofi')}
              style={{
                padding: '0.2rem 0.5rem', 
                fontSize: '0.8rem',
                backgroundColor: activeTrack === 'lofi' ? 'var(--button-active)' : 'var(--button-bg)',
                fontWeight: activeTrack === 'lofi' ? 'bold' : 'normal'
              }}
            >
              Lofi
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {activeTrack && (
              <>
                <button 
                  className="btn" 
                  onClick={() => playTrack(activeTrack)}
                  style={{ 
                    padding: '0.35rem 0.5rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'var(--button-bg)' 
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg width="10" height="10" viewBox="0 0 8 8" style={{ display: 'block' }}>
                      <path d="M1 1h2v6H1z M5 1h2v6H5z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 8 8" style={{ display: 'block' }}>
                      <path d="M1 1h2v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-2z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button 
                  className="btn" 
                  onClick={stopAudio}
                  style={{ 
                    padding: '0.35rem 0.5rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'var(--button-bg)' 
                  }}
                  title="Stop"
                >
                  <svg width="10" height="10" viewBox="0 0 8 8" style={{ display: 'block' }}>
                    <path d="M1 1h6v6H1z" fill="currentColor" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            <span>VOL</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume}
              onChange={handleVolumeChange}
              style={{ 
                width: '65px', 
                cursor: 'pointer',
                accentColor: 'var(--window-border-dark)'
              }}
            />
          </div>
        </div>
      </div>

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
        
        <div style={{ margin: '0.5rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '130px' }}>
          <img 
            src="/assets/frog_naked_transparent.png" 
            alt="Breathing Frog" 
            style={{
              width: '120px',
              marginTop: '0.25rem',
              transition: 'transform 3s ease-in-out',
              transform: `scale(${breatheScale})`
            }} 
          />
          <div style={{ marginTop: '0.75rem', fontWeight: 'bold', fontSize: '1rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
            {breathingPhase === 'idle' ? 'Ready' : breathingPhase}
          </div>
        </div>

        {breathingPhase === 'idle' && (
          <button className="btn" onClick={() => setBreathingPhase('inhale')} style={{ padding: '0.25rem 1rem', fontSize: '1rem' }}>Start Breathing</button>
        )}
      </div>

      <hr style={{ borderTop: '2px dashed var(--window-border-light)', margin: '0.5rem 0' }} />

      {/* Daily Checklist */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>Daily Checklist</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>Complete tasks to reward your frog (+10 Coins, +10 Happiness!)</p>
        
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid var(--window-border-dark)',
          borderRadius: '5px',
          padding: '0.75rem',
          maxHeight: '220px',
          overflowY: 'auto',
          marginBottom: '0.5rem'
        }}>
          {checklist.length === 0 ? (
            <p style={{ fontSize: '0.95rem', color: '#888', textAlign: 'center', margin: '1rem 0' }}>No tasks today! Add one below.</p>
          ) : (
            checklist.map(task => (
              <div 
                key={task.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.25rem 0',
                  borderBottom: '1px dashed #e0e0e0',
                  gap: '0.5rem'
                }}
              >
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  fontSize: '1.05rem',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? '#888' : 'var(--text-primary)',
                  flex: 1,
                  userSelect: 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={() => handleToggleTask(task.id)}
                    style={{ 
                      cursor: 'pointer', 
                      width: '18px', 
                      height: '18px',
                      accentColor: 'var(--window-border-dark)' 
                    }}
                  />
                  <span>{task.text}</span>
                </label>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c62828',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.1rem 0.3rem',
                    fontFamily: 'var(--pixel-font)'
                  }}
                  title="Delete task"
                >
                  [X]
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Custom Task Form */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            placeholder="Add new self-care task..."
            value={newChecklistText}
            onChange={e => setNewChecklistText(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '0.3rem 0.5rem', 
              fontSize: '1.05rem',
              border: '2px solid var(--window-border-dark)',
              borderRadius: '4px'
            }}
            maxLength={40}
          />
          <button type="submit" className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '1rem' }}>
            Add
          </button>
        </form>
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
