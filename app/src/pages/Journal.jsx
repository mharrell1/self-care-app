import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { saveJournalEntry, getJournalEntries, updateJournalEntry, deleteJournalEntry, getMoodHistory, getPhotos } from '../services/db';

const GUIDED_PROMPTS = [
  "What is 1 thing you are proud of today?",
  "Who brought you joy recently?",
  "What is a small win or accomplishment you had today?",
  "Describe a kind gesture you received or gave recently.",
  "What made you feel peaceful or relaxed today?"
];

export default function Journal() {
  const { userId, gameState, updateGameState } = useGame();
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [lastMood, setLastMood] = useState(null);
  
  // Edit Entry State
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Photos Integration State
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  // Edit mode photo state
  const [editPhotoUrl, setEditPhotoUrl] = useState(null);
  const [showEditPhotoSelector, setShowEditPhotoSelector] = useState(false);

  useEffect(() => {
    getJournalEntries(userId).then(setEntries);
    getMoodHistory(userId).then(moods => {
      if (moods && moods.length > 0) {
        setLastMood(moods[moods.length - 1]);
      }
    });
    getPhotos(userId).then(setPhotos);
  }, [userId]);

  const handleInsertLastMood = () => {
    if (!lastMood) return;
    const moodNote = `Mood Log (${new Date(lastMood.date).toLocaleDateString()}): Feeling ${lastMood.mood}\n`;
    setNewEntry(prev => prev ? `${moodNote}\n${prev}` : moodNote);
  };

  const handleSelectPrompt = (prompt) => {
    const promptText = `Prompt: ${prompt}\n\n`;
    setNewEntry(prev => prev ? `${promptText}${prev}` : promptText);
    setShowPromptSelector(false);
  };

  const handleSave = async () => {
    if (!newEntry.trim()) return;

    const savedEntry = await saveJournalEntry(userId, newEntry, selectedPhotoUrl);
    setEntries([savedEntry, ...entries]);

    // Reward user: +15 coins, +10 happiness
    updateGameState({
      coins: (gameState.coins ?? 100) + 15,
      happiness: Math.min(100, (gameState.happiness ?? 50) + 10)
    });

    setNewEntry('');
    setSelectedPhotoUrl(null);
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditText(entry.content);
    setEditPhotoUrl(entry.photoUrl || null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPhotoUrl(null);
  };

  const handleSaveEdit = async (entryId) => {
    if (!editText.trim()) return;

    await updateJournalEntry(userId, entryId, editText, editPhotoUrl);
    setEntries(entries.map(e => e.id === entryId ? { ...e, content: editText, photoUrl: editPhotoUrl, editedAt: new Date().toISOString() } : e));
    setEditingId(null);
    setEditText('');
    setEditPhotoUrl(null);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          <button 
            className="btn"
            onClick={() => setShowPhotoSelector(true)}
            title="Import a photo taken in the photobooth"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--button-bg)' }}
          >
            Import Photo
          </button>
          <button 
            className="btn"
            onClick={() => setShowPromptSelector(!showPromptSelector)}
            title="Choose a guided reflection prompt"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--button-bg)' }}
          >
            Guided Prompt
          </button>
        </div>
      </div>
      
      {showPromptSelector && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid var(--window-border-dark)',
          borderRadius: '5px',
          padding: '0.65rem',
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          boxShadow: '1px 1px 0px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.4rem', color: 'var(--text-primary)', fontFamily: 'var(--header-font)', fontSize: '0.7rem' }}>Select a Guided Prompt:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {GUIDED_PROMPTS.map((prompt, idx) => (
              <button 
                key={idx}
                className="btn"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem', textAlign: 'left', width: '100%', whiteSpace: 'normal', lineHeight: '1.2' }}
                onClick={() => handleSelectPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
            <button 
              className="btn"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', backgroundColor: '#e0e0e0', marginTop: '0.25rem', width: 'fit-content', alignSelf: 'center' }}
              onClick={() => setShowPromptSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <textarea 
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        placeholder="Dear Froggy..."
        style={{ width: '100%', height: '150px', resize: 'none', marginBottom: '0.5rem', padding: '0.5rem', fontFamily: 'inherit' }}
      />

      {/* Selected Import Preview */}
      {selectedPhotoUrl && (
        <div style={{ 
          position: 'relative', 
          display: 'inline-block', 
          marginBottom: '1rem', 
          border: '3px solid var(--window-border-dark)', 
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
        }}>
          <img src={selectedPhotoUrl} alt="Imported preview" style={{ width: '120px', height: '90px', objectFit: 'cover', display: 'block' }} />
          <button 
            onClick={() => setSelectedPhotoUrl(null)}
            title="Remove photo"
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: '1px solid black',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 'bold',
              lineHeight: 0
            }}
          >
            ×
          </button>
        </div>
      )}

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
                  
                  {/* Edit Mode Photo Preview & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {editPhotoUrl && (
                      <div style={{ 
                        position: 'relative', 
                        display: 'inline-block', 
                        border: '3px solid var(--window-border-dark)', 
                        borderRadius: '8px', 
                        overflow: 'hidden' 
                      }}>
                        <img src={editPhotoUrl} alt="Selected Edit" style={{ width: '120px', height: '90px', objectFit: 'cover', display: 'block' }} />
                        <button 
                          onClick={() => setEditPhotoUrl(null)}
                          title="Remove photo"
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: '1px solid black',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            lineHeight: 0
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <button 
                      className="btn" 
                      style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                      onClick={() => setShowEditPhotoSelector(true)}
                    >
                      {editPhotoUrl ? 'Change Photo' : 'Add Photo'}
                    </button>
                  </div>

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
                <div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {entry.content}
                  </div>
                  {entry.photoUrl && (
                    <div style={{ 
                      marginTop: '1rem', 
                      textAlign: 'left',
                      border: '3px double var(--window-border-dark)',
                      borderRadius: '8px',
                      padding: '0.25rem',
                      backgroundColor: '#f9f9f9',
                      display: 'inline-block',
                      maxWidth: '100%',
                      boxShadow: '2px 2px 6px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={entry.photoUrl} 
                        alt="Journal Memory" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '220px', 
                          borderRadius: '5px',
                          display: 'block',
                          objectFit: 'contain'
                        }} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && <p>No entries yet.</p>}
      </div>

      {/* Photo Selector Modal */}
      {(showPhotoSelector || showEditPhotoSelector) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--window-bg)',
            border: '4px solid var(--window-border-dark)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '450px',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Title Bar */}
            <div style={{
              backgroundColor: 'var(--window-title-bg)',
              color: 'white',
              padding: '0.5rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold'
            }}>
              <span>Select Photo to Import</span>
              <button 
                onClick={() => {
                  setShowPhotoSelector(false);
                  setShowEditPhotoSelector(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Photos Grid */}
            <div style={{
              padding: '1rem',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              flexGrow: 1
            }}>
              {photos.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'gray', padding: '2rem 0' }}>
                  No photos found in photobooth album.
                </p>
              ) : (
                photos.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      if (showPhotoSelector) {
                        setSelectedPhotoUrl(p.bg);
                        setShowPhotoSelector(false);
                      } else {
                        setEditPhotoUrl(p.bg);
                        setShowEditPhotoSelector(false);
                      }
                    }}
                    style={{
                      aspectRatio: '4/3',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid var(--window-border)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <img src={p.bg} alt="Importable" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '2px dashed var(--window-border-light)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn"
                onClick={() => {
                  setShowPhotoSelector(false);
                  setShowEditPhotoSelector(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
