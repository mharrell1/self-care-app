import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Games from './pages/Games';
import SelfCare from './pages/SelfCare';
import DressUp from './pages/DressUp';
import Photos from './pages/Photos';
import Stats from './pages/Stats';
import Auth from './components/Auth';
import { GameProvider } from './context/GameContext';
import { auth, firebaseConfig } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Redirects to home on a fresh PWA launch (new session), preserving in-session navigation
function HomeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isNewSession = !sessionStorage.getItem('app_session_started');
    if (isNewSession) {
      sessionStorage.setItem('app_session_started', '1');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

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
        <HomeRedirect />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="games" element={<Games />} />
            <Route path="selfcare" element={<SelfCare />} />
            <Route path="dressup" element={<DressUp />} />
            <Route path="photos" element={<Photos />} />
            <Route path="stats" element={<Stats />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
