import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Games from './pages/Games';
import SelfCare from './pages/SelfCare';
import Auth from './components/Auth';
import { GameProvider } from './context/GameContext';
import { auth, firebaseConfig } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '20vh' }}>Loading...</div>;
  }

  // If Firebase is not configured, show Auth which has the placeholder screen
  if (firebaseConfig.apiKey === "YOUR_API_KEY" || !user) {
    return <Auth />;
  }

  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="games" element={<Games />} />
            <Route path="selfcare" element={<SelfCare />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
