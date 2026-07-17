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
        setGameState(state);
      } catch (err) {
        console.error("Failed to load game state", err);
        setError(err.message || "Unknown error connecting to Firestore.");
      }
    }
    load();
  }, [userId]);

  const updateGameState = async (updates) => {
    const newState = { ...gameState, ...updates };
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
