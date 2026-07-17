import React, { useState } from 'react';
import { auth, firebaseConfig } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px', margin: '2rem auto' }} className="window">
        <div className="window-header">
          <span>Configuration Required</span>
        </div>
        <div className="window-content">
          <h3>Almost there!</h3>
          <p style={{ marginTop: '1rem', fontSize: '1rem' }}>
            To enable cloud sync, you need to open `app/src/firebase.js` in your code editor and paste in your Firebase configuration snippet.
          </p>
          <p style={{ marginTop: '1rem', fontSize: '1rem' }}>
            Check the chat for instructions on how to find this snippet in the Firebase Console!
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px', margin: '2rem auto' }} className="window">
      <div className="window-header">
        <span>{isLogin ? 'Login.exe' : 'Register.exe'}</span>
      </div>
      <div className="window-content">
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '1rem', marginBottom: '1rem' }}>
          Welcome to Froggy!
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: '1rem', fontSize: '0.8rem' }}>{error}</div>}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', textDecoration: 'underline', marginTop: '1rem', cursor: 'pointer', fontFamily: 'var(--pixel-font)', fontSize: '1rem' }}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
