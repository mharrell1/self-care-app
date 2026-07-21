import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import FrogAvatar from '../components/FrogAvatar';
import { savePhoto, getPhotos } from '../services/db';
import html2canvas from 'html2canvas';

export default function Photos() {
  const { gameState, userId } = useGame();
  const [view, setView] = useState('camera'); // 'camera' or 'album'
  const [photos, setPhotos] = useState([]);
  const [flash, setFlash] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Load photos when switching to album view
  useEffect(() => {
    if (view === 'album') {
      loadPhotos();
      stopCamera();
    } else {
      startCamera();
    }
    
    return () => stopCamera();
  }, [view]);

  const loadPhotos = async () => {
    const fetchedPhotos = await getPhotos(userId);
    setPhotos(fetchedPhotos);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing webcam: ", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;
    
    // Create a canvas to grab the video frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const bgDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // Save the photo with the background and the current frog state
    await savePhoto(userId, {
      bg: bgDataUrl,
      equippedItems: gameState.equippedItems || [],
      equippedItem: gameState.equippedItem || 'base',
      hunger: gameState.hunger,
      petName: gameState.petName
    });
  };

  const downloadPhoto = async (photoId) => {
    const element = document.getElementById(`photo-${photoId}`);
    if (!element) return;
    
    // Hide the date label briefly for a cleaner download
    const dateLabel = document.getElementById(`date-${photoId}`);
    if (dateLabel) dateLabel.style.display = 'none';

    try {
      const canvas = await html2canvas(element, { useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `froggy_photo_${photoId}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (e) {
      console.error("Failed to download photo", e);
    } finally {
      if (dateLabel) dateLabel.style.display = 'block';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--primary-light)', padding: '1rem', margin: '-1rem', minHeight: 'calc(100% + 2rem)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className="btn"
          onClick={() => setView('camera')}
          style={{ 
            backgroundColor: view === 'camera' ? 'var(--primary-color)' : 'var(--button-bg)',
            color: view === 'camera' ? 'white' : 'var(--text-color)'
          }}
        >
          Camera
        </button>
        <button 
          className="btn"
          onClick={() => setView('album')}
          style={{ 
            backgroundColor: view === 'album' ? 'var(--primary-color)' : 'var(--button-bg)',
            color: view === 'album' ? 'white' : 'var(--text-color)'
          }}
        >
          Album
        </button>
      </div>

      {/* Camera View */}
      {view === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '500px', 
            aspectRatio: '4/3', 
            backgroundColor: '#000',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            {/* Flash Overlay */}
            {flash && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', zIndex: 100 }} />
            )}
            
            {/* Live Camera Feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Frog Sticker Overlay */}
            <div style={{ 
              position: 'absolute', 
              bottom: '5%', 
              right: '5%',
              width: '150px',
              height: '150px',
              zIndex: 10
            }}>
              <FrogAvatar gameState={gameState} />
            </div>
          </div>
          
          <button 
            className="btn"
            onClick={takePhoto}
            style={{ marginTop: '1.5rem' }}
          >
            Take Photo
          </button>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-color)' }}>
            Take a photo with {gameState.petName}!
          </p>
        </div>
      )}

      {/* Album View */}
      {view === 'album' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '1rem',
          overflowY: 'auto',
          flexGrow: 1,
          padding: '0.5rem'
        }}>
          {photos.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'gray', marginTop: '2rem' }}>
              No photos yet. Take one with your frog!
            </p>
          ) : (
            photos.map(photo => (
              <div 
                key={photo.id}
                id={`photo-${photo.id}`}
                onClick={() => downloadPhoto(photo.id)}
                title="Click to download!"
                style={{ 
                  position: 'relative', 
                  aspectRatio: '4/3',
                  backgroundColor: '#eee',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}>
                <img src={photo.bg} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '5%', 
                  right: '5%',
                  width: '150px',
                  height: '150px',
                  transformOrigin: 'bottom right',
                  transform: 'scale(0.5)' // slightly smaller for album thumbnail
                }}>
                  <FrogAvatar gameState={photo} />
                </div>
                <div 
                  id={`date-${photo.id}`}
                  style={{
                    position: 'absolute',
                    bottom: '5px',
                    left: '10px',
                    color: 'white',
                    textShadow: '1px 1px 2px black',
                    fontSize: '0.7rem'
                  }}
                >
                  {new Date(photo.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
