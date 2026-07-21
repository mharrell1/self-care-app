import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { saveJournalEntry, getJournalEntries } from '../services/db';

export default function Journal() {
  const { userId } = useGame();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    getJournalEntries(userId).then(setEntries);
  }, [userId]);

  const handleSave = async () => {
    if (!newEntry.trim()) return;

    const savedEntry = await saveJournalEntry(userId, newEntry);
    setEntries([savedEntry, ...entries]);
    setNewEntry('');
  };

  return (
    <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem' }}>New Entry</h3>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>Protected by Cloud Account</span>
      </div>
      
      <textarea 
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        placeholder="Dear Froggy..."
        style={{ width: '100%', height: '150px', resize: 'none', marginBottom: '1rem' }}
      />
      <button className="btn" onClick={handleSave} style={{ alignSelf: 'flex-end', marginBottom: '2rem' }}>Save to Cloud</button>

      <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '1rem' }}>Past Entries</h3>
      <div>
        {entries.map(entry => (
          <div key={entry.id} style={{ 
            border: '2px solid var(--window-border-dark)', 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
              {new Date(entry.date).toLocaleString()}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {entry.content}
            </div>
          </div>
        ))}
        {entries.length === 0 && <p>No entries yet.</p>}
      </div>
    </div>
  );
}
