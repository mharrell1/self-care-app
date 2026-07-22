import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { saveJournalEntry, getJournalEntries, updateJournalEntry, deleteJournalEntry, getMoodHistory } from '../services/db';

export default function Journal() {
  const { userId } = useGame();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [lastMood, setLastMood] = useState(null);
  
  // Edit Entry State
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    getJournalEntries(userId).then(setEntries);
    getMoodHistory(userId).then(moods => {
      if (moods && moods.length > 0) {
        setLastMood(moods[moods.length - 1]);
      }
    });
  }, [userId]);

  const handleInsertLastMood = () => {
    if (!lastMood) return;
    const moodNote = `Mood Log (${new Date(lastMood.date).toLocaleDateString()}): Feeling ${lastMood.mood}\n`;
    setNewEntry(prev => prev ? `${moodNote}\n${prev}` : moodNote);
  };

  const handleSave = async () => {
    if (!newEntry.trim()) return;

    const savedEntry = await saveJournalEntry(userId, newEntry);
    setEntries([savedEntry, ...entries]);
    setNewEntry('');
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditText(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (entryId) => {
    if (!editText.trim()) return;

    await updateJournalEntry(userId, entryId, editText);
    setEntries(entries.map(e => e.id === entryId ? { ...e, content: editText, editedAt: new Date().toISOString() } : e));
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;

    await deleteJournalEntry(userId, entryId);
    setEntries(entries.filter(e => e.id !== entryId));
    if (editingId === entryId) {
      handleCancelEdit();
    }
  };

  return (
    <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem' }}>New Entry</h3>
        {lastMood && (
          <button 
            className="btn"
            onClick={handleInsertLastMood}
            title={`Insert your last saved mood (${lastMood.mood})`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--button-bg)' }}
          >
            Import Last Mood ({lastMood.mood})
          </button>
        )}
      </div>
      
      <textarea 
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        placeholder="Dear Froggy..."
        style={{ width: '100%', height: '150px', resize: 'none', marginBottom: '1rem', padding: '0.5rem', fontFamily: 'inherit' }}
      />
      <button className="btn" onClick={handleSave} style={{ alignSelf: 'flex-end', marginBottom: '2rem' }}>Save to Cloud</button>

      <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '1rem' }}>Past Entries</h3>
      <div>
        {entries.map(entry => {
          const isEditing = editingId === entry.id;

          return (
            <div key={entry.id} style={{ 
              border: '2px solid var(--window-border-dark)', 
              padding: '1rem', 
              marginBottom: '1.25rem',
              backgroundColor: '#fff',
              position: 'relative'
            }}>
              {/* Header Info & Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {new Date(entry.date).toLocaleString()}
                  {entry.editedAt && <span style={{ fontStyle: 'italic', marginLeft: '6px' }}>(edited)</span>}
                </div>

                {/* Edit & Delete Action Buttons */}
                {!isEditing && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn"
                      onClick={() => handleStartEdit(entry)}
                      title="Edit Entry"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete Entry"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Editing Interface */}
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ width: '100%', height: '120px', resize: 'none', padding: '0.5rem', fontFamily: 'inherit', fontSize: '1rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn"
                      onClick={handleCancelEdit}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn"
                      onClick={() => handleSaveEdit(entry.id)}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', backgroundColor: 'var(--window-title-bg)', color: '#fff' }}
                    >
                      Save Edits
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {entry.content}
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && <p>No entries yet.</p>}
      </div>
    </div>
  );
}
