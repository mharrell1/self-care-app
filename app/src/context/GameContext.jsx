import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGameState, saveGameState } from '../services/db';
import { auth, firebaseConfig } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(firebaseConfig.apiKey === "YOUR_API_KEY" ? 'demo_user' : null); 

  useEffect(() => {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!userId) return; // Wait for Firebase auth to set the real user ID

    async function load() {
      try {
        const state = await getGameState(userId);
        let updatedState = state ? { ...state } : null;
        let needsSave = false;

        if (updatedState) {
          const now = new Date();
          const todayStr = now.toLocaleDateString();
          if (updatedState.lastWaterDate !== todayStr) {
            updatedState.waterCount = 0;
            updatedState.lastWaterDate = todayStr;
            needsSave = true;
          }

          if (updatedState.checklistLastResetDate !== todayStr) {
            const currentChecklist = updatedState.checklist !== undefined ? updatedState.checklist : [
              { id: '1', text: 'Drink a glass of water', completed: false },
              { id: '2', text: 'Make my bed', completed: false },
              { id: '3', text: 'Step outside for 5 mins', completed: false },
              { id: '4', text: 'Stretch for 2 minutes', completed: false }
            ];
            updatedState.checklist = currentChecklist.map(item => ({ ...item, completed: false }));
            updatedState.checklistLastResetDate = todayStr;
            needsSave = true;
          }

          if (!updatedState.lastInteraction) {
            updatedState.lastInteraction = now.toISOString();
            needsSave = true;
          } else {
            const lastTime = new Date(updatedState.lastInteraction).getTime();
            const diffMs = now.getTime() - lastTime;
            const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            if (daysPassed >= 1) {
              const penalty = daysPassed * 15;
              updatedState.happiness = Math.max(0, (updatedState.happiness ?? 50) - penalty);
              updatedState.hunger = Math.max(0, (updatedState.hunger ?? 50) - penalty);
              updatedState.cleanliness = Math.max(0, (updatedState.cleanliness ?? 50) - penalty);
            }
            // Opening the app counts as a check-in, so we reset the lastInteraction time to now
            updatedState.lastInteraction = now.toISOString();
            needsSave = true;
          }
        }

        if (needsSave && updatedState) {
          await saveGameState(userId, updatedState);
        }
        setGameState(updatedState);
      } catch (err) {
        console.error("Failed to load game state", err);
        setError(err.message || "Unknown error connecting to Firestore.");
      }
    }
    load();
  }, [userId]);

  const updateGameState = async (updates) => {
    const newState = { 
      ...gameState, 
      ...updates, 
      lastInteraction: updates.lastInteraction || new Date().toISOString() 
    };
    setGameState(newState);
    await saveGameState(userId, newState);
  };

  const handleLogout = async () => {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      await auth.signOut();
    }
  };

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '20vh', color: 'red' }}>Error: {error}<br/><br/>Did you remember to click "Create Database" in Firestore?</div>;
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, userId, handleLogout }}>
      {gameState ? children : <div style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Game State...</div>}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
