import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGameState, saveGameState } from '../services/db';
import { auth, firebaseConfig } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ADVENTURES = [
  {
    location: "Mossy Forest",
    story: "visited the Mossy Forest while you were away!",
    lesson: "It's okay to take things slow and enjoy the present moment.",
    coins: 15,
    happiness: 10
  },
  {
    location: "Starlight Pond",
    story: "took a peaceful stroll by Starlight Pond and found a shiny river stone.",
    lesson: "Quiet reflection brings clarity to even the cloudiest thoughts.",
    coins: 20,
    happiness: 15
  },
  {
    location: "Lilypad Meadow",
    story: "relaxed in Lilypad Meadow listening to the soft breeze.",
    lesson: "Resting isn't quitting—it's preparing for your next big jump!",
    coins: 15,
    happiness: 10
  },
  {
    location: "Sunlit Woods",
    story: "went foraging in the Sunlit Woods and befriended a friendly ladybug.",
    lesson: "Small everyday discoveries can bring big joy.",
    coins: 25,
    happiness: 15
  },
  {
    location: "Whispering Brook",
    story: "sat beside Whispering Brook and practiced mindful listening.",
    lesson: "Every storm passes, leaving fresh flowers in its wake.",
    coins: 20,
    happiness: 10
  }
];

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
          const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          // Active Days tracking
          let activeDaysList = Array.isArray(updatedState.activeDays) ? [...updatedState.activeDays] : [];
          if (!activeDaysList.includes(todayISO)) {
            activeDaysList.push(todayISO);
            updatedState.activeDays = activeDaysList;
            needsSave = true;
          }

          // Streak & Friendship Check-In tracking
          if (updatedState.lastCheckInDate !== todayISO) {
            const lastCheckDate = updatedState.lastCheckInDate ? new Date(updatedState.lastCheckInDate) : null;
            let currentStreak = updatedState.checkInStreak || 0;
            if (lastCheckDate) {
              const diffTime = Math.abs(now.getTime() - lastCheckDate.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                currentStreak += 1;
              } else if (diffDays > 1) {
                currentStreak = 1;
              }
            } else {
              currentStreak = 1;
            }

            updatedState.checkInStreak = currentStreak;
            updatedState.lastCheckInDate = todayISO;
            updatedState.coins = (updatedState.coins || 100) + 15;
            updatedState.friendshipXP = (updatedState.friendshipXP || 0) + 20;
            needsSave = true;
          }

          // Check Friendship Level Up
          let lvl = updatedState.friendshipLevel || 1;
          let xp = updatedState.friendshipXP || 0;
          while (xp >= 100) {
            lvl += 1;
            xp -= 100;
          }
          updatedState.friendshipLevel = lvl;
          updatedState.friendshipXP = xp;

          if (updatedState.lastWaterDate !== todayStr) {
            updatedState.waterCount = 0;
            updatedState.lastWaterDate = todayStr;
            needsSave = true;
          }

          if (updatedState.lastMedicineDate !== todayStr) {
            updatedState.medicationTaken = false;
            updatedState.lastMedicineDate = todayStr;
            needsSave = true;
          }

          if (updatedState.health === undefined) {
            updatedState.health = 100;
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
            const hoursPassed = diffMs / (1000 * 60 * 60);

            if (hoursPassed >= 2 && !updatedState.pendingAdventure) {
              const randomAdv = ADVENTURES[Math.floor(Math.random() * ADVENTURES.length)];
              const adventure = {
                ...randomAdv,
                timestamp: now.toISOString()
              };
              updatedState.pendingAdventure = adventure;
              updatedState.lastAdventure = adventure;
              updatedState.coins = (updatedState.coins ?? 100) + randomAdv.coins;
              updatedState.happiness = Math.min(100, (updatedState.happiness ?? 50) + randomAdv.happiness);
              needsSave = true;
            }

            const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            if (daysPassed >= 1) {
              const penalty = daysPassed * 15;
              updatedState.happiness = Math.max(0, (updatedState.happiness ?? 50) - penalty);
              updatedState.hunger = Math.max(0, (updatedState.hunger ?? 50) - penalty);
              updatedState.cleanliness = Math.max(0, (updatedState.cleanliness ?? 50) - penalty);
              updatedState.health = Math.max(0, (updatedState.health ?? 100) - penalty);
            }
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

  const [heartKey, setHeartKey] = useState(0);

  const triggerHeart = () => {
    setHeartKey(prev => prev + 1);
  };

  const updateGameState = async (updates) => {
    const newState = { 
      ...gameState, 
      ...updates, 
      lastInteraction: updates.lastInteraction || new Date().toISOString() 
    };
    setGameState(newState);
    await saveGameState(userId, newState);
  };

  const dismissAdventure = () => {
    triggerHeart();
    updateGameState({ pendingAdventure: null });
  };

  const triggerAdventure = () => {
    triggerHeart();
    const randomAdv = ADVENTURES[Math.floor(Math.random() * ADVENTURES.length)];
    const adventure = {
      ...randomAdv,
      timestamp: new Date().toISOString()
    };
    updateGameState({
      pendingAdventure: adventure,
      lastAdventure: adventure,
      coins: (gameState?.coins ?? 100) + randomAdv.coins,
      happiness: Math.min(100, (gameState?.happiness ?? 50) + randomAdv.happiness)
    });
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
    <GameContext.Provider value={{ gameState, updateGameState, userId, handleLogout, dismissAdventure, triggerAdventure, heartKey, triggerHeart }}>
      {gameState ? children : <div style={{ textAlign: 'center', marginTop: '20vh' }}>Loading Game State...</div>}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
