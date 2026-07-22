import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import FrogAvatar from '../components/FrogAvatar';
import { savePhoto, getPhotos, deletePhoto } from '../services/db';
import html2canvas from 'html2canvas';

export default function Photos() {
  const { gameState, userId } = useGame();
  const [view, setView] = useState('camera'); // 'camera' or 'album'
  const [photos, setPhotos] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // Full-size modal photo index state
  const [flash, setFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [customBg, setCustomBg] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  // Draggable Sticker State (% position in container)
  const [stickerPos, setStickerPos] = useState({ x: 60, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Selected Frog Sticker Choice State
  const [stickerChoice, setStickerChoice] = useState('current'); // 'current', 'partyhat', 'necklace', 'basic'

  // Track downloaded photos for pressed darkening feedback
  const [downloadedPhotos, setDownloadedPhotos] = useState({});

  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoboothRef = useRef(null);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  // Start or stop camera based on view, cameraEnabled, and facingMode state
  useEffect(() => {
    if (view === 'camera' && cameraEnabled) {
      startCamera();
    } else {
      stopCamera();
      if (view === 'album') loadPhotos();
    }
    
    return () => stopCamera();
  }, [view, cameraEnabled, facingMode]);

  // Assign stream to video DOM element whenever stream state updates
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  }, [stream, view]);

  // Keyboard navigation for full-size photo viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, photos]);

  const loadPhotos = async () => {
    const fetchedPhotos = await getPhotos(userId);
    setPhotos(fetchedPhotos);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your current browser context.");
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: facingMode } } });
      } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      setCameraError("Webcam blocked or requires HTTPS connection.");
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const stopCamera = () => {
    // 1. Stop tracks in streamRef
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      streamRef.current = null;
    }

    // 2. Stop tracks in stream state
    if (stream) {
      stream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
    }

    // 3. Detach from video DOM node and stop video element tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const srcStream = videoRef.current.srcObject;
      if (srcStream && srcStream.getTracks) {
        srcStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
      videoRef.current.srcObject = null;
    }

    setStream(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bgDataUrl = event.target?.result;
      if (bgDataUrl) {
        setCustomBg(bgDataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dragging Handlers for Frog Sticker
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !photoboothRef.current) return;
    const rect = photoboothRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    let x = ((clientX - rect.left) / rect.width) * 100 - 15;
    let y = ((clientY - rect.top) / rect.height) * 100 - 15;

    x = Math.max(0, Math.min(75, x));
    y = Math.max(0, Math.min(75, y));

    setStickerPos({ x, y });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Compute active frog state for chosen sticker option
  const getActiveFrogState = () => {
    if (stickerChoice === 'partyhat') {
      return { ...gameState, equippedItems: ['partyhat'], hunger: 100 };
    }
    if (stickerChoice === 'necklace') {
      return { ...gameState, equippedItems: ['necklace'], hunger: 100 };
    }
    if (stickerChoice === 'basic') {
      return { ...gameState, equippedItems: [], equippedItem: 'base', hunger: 100 };
    }
    return gameState; // 'current' equipped frog
  };

  const activeFrogState = getActiveFrogState();

  const takePhoto = async () => {
    if (flashEnabled) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }

    let bgDataUrl = customBg;

    if (!bgDataUrl && videoRef.current && stream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        bgDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      } catch (err) {
        console.error("Error capturing video frame:", err);
      }
    }

    if (!bgDataUrl) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#f8bbd0');
      grad.addColorStop(1, '#f48fb1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);
      bgDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    }

    // Save photo to DB/localStorage
    await savePhoto(userId, {
      bg: bgDataUrl,
      equippedItems: activeFrogState.equippedItems || [],
      equippedItem: activeFrogState.equippedItem || 'base',
      hunger: activeFrogState.hunger,
      petName: gameState.petName,
      stickerPos: stickerPos
    });

    setView('album');
  };

  const downloadPhoto = async (photoId, e) => {
    if (e) e.stopPropagation();
    const element = document.getElementById(`photo-${photoId}`);
    if (!element) return;
    
    const dateLabel = document.getElementById(`date-${photoId}`);
    if (dateLabel) dateLabel.style.display = 'none';

    try {
      const canvas = await html2canvas(element, { useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `froggy_photo_${photoId}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (err) {
      console.error("Failed to download photo", err);
    } finally {
      if (dateLabel) dateLabel.style.display = 'block';
    }
  };

  const handleDelete = async (photoId, e) => {
    if (e) e.stopPropagation();
    await deletePhoto(userId, photoId);
    if (selectedPhoto?.id === photoId) {
      setSelectedIndex(null);
    }
    loadPhotos();
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (photos.length === 0) return;
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (photos.length === 0) return;
    setSelectedIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ backgroundColor: 'var(--primary-light)', padding: '1rem', margin: '-1rem', minHeight: 'calc(100% + 2rem)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Tabs Header */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          className="btn"
          onClick={() => { setView('camera'); setCustomBg(null); }}
          style={{ 
            backgroundColor: view === 'camera' && !customBg ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: view === 'camera' && !customBg ? 'var(--window-title-text)' : 'var(--text-primary)',
            padding: '0.6rem 1.5rem',
            fontWeight: 'bold'
          }}
        >
          Camera
        </button>

        <label 
          className="btn"
          style={{ 
            cursor: 'pointer',
            backgroundColor: customBg ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: customBg ? 'var(--window-title-text)' : 'var(--text-primary)',
            padding: '0.6rem 1.5rem',
            fontWeight: 'bold'
          }}
        >
          Upload
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => {
              handleFileUpload(e);
              setView('camera');
            }} 
            style={{ display: 'none' }} 
          />
        </label>

        <button 
          className="btn"
          onClick={() => setView('album')}
          style={{ 
            backgroundColor: view === 'album' ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: view === 'album' ? 'var(--window-title-text)' : 'var(--text-primary)',
            padding: '0.6rem 1.5rem',
            fontWeight: 'bold'
          }}
        >
          Album
        </button>
      </div>

      {/* Camera View */}
      {view === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
          
          {/* Photobooth Viewport Container */}
          <div 
            ref={photoboothRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '500px', 
              aspectRatio: '4/3', 
              backgroundColor: 'var(--button-bg)',
              borderRadius: '15px',
              overflow: 'hidden',
              border: '3px solid var(--window-border-dark)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            {/* Flash Overlay */}
            {flash && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', zIndex: 100 }} />
            )}

            {/* Title Banner (Only shown when live camera / background is inactive) */}
            {!stream && !customBg && (
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                fontWeight: 'bold',
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                padding: '0.3rem 1rem',
                borderRadius: '20px',
                border: '2px solid var(--window-border-dark)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                Photobooth Ready
              </div>
            )}
            
            {/* Live Camera Feed or Custom Background */}
            {customBg ? (
              <img src={customBg} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            ) : stream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />
            ) : null}
            
            {/* Draggable Frog Sticker Overlay */}
            <div 
              onPointerDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              title="Drag me anywhere!"
              style={{ 
                position: 'absolute', 
                top: `${stickerPos.y}%`, 
                left: `${stickerPos.x}%`,
                width: '140px',
                height: '140px',
                zIndex: 20,
                cursor: isDragging ? 'grabbing' : 'grab',
                filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none',
                transition: isDragging ? 'none' : 'transform 0.1s ease'
              }}
            >
              <FrogAvatar gameState={activeFrogState} />
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: 'var(--window-title-bg)',
                color: 'white',
                fontSize: '0.65rem',
                padding: '2px 5px',
                borderRadius: '8px',
                border: '1px solid var(--window-border-dark)',
                pointerEvents: 'none',
                fontWeight: 'bold'
              }}>
                Drag
              </div>
            </div>
          </div>
          
          {/* Frog Sticker Choice Selector */}
          <div style={{ marginTop: '1rem', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Select Frog Sticker:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => setStickerChoice('current')}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.8rem',
                  backgroundColor: stickerChoice === 'current' ? 'var(--window-title-bg)' : 'var(--button-bg)',
                  color: stickerChoice === 'current' ? 'var(--window-title-text)' : 'var(--text-primary)'
                }}
              >
                Current Outfit
              </button>
              <button
                className="btn"
                onClick={() => setStickerChoice('partyhat')}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.8rem',
                  backgroundColor: stickerChoice === 'partyhat' ? 'var(--window-title-bg)' : 'var(--button-bg)',
                  color: stickerChoice === 'partyhat' ? 'var(--window-title-text)' : 'var(--text-primary)'
                }}
              >
                Party Hat
              </button>
              <button
                className="btn"
                onClick={() => setStickerChoice('necklace')}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.8rem',
                  backgroundColor: stickerChoice === 'necklace' ? 'var(--window-title-bg)' : 'var(--button-bg)',
                  color: stickerChoice === 'necklace' ? 'var(--window-title-text)' : 'var(--text-primary)'
                }}
              >
                Necklace
              </button>
              <button
                className="btn"
                onClick={() => setStickerChoice('basic')}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.8rem',
                  backgroundColor: stickerChoice === 'basic' ? 'var(--window-title-bg)' : 'var(--button-bg)',
                  color: stickerChoice === 'basic' ? 'var(--window-title-text)' : 'var(--text-primary)'
                }}
              >
                Basic Frog
              </button>
            </div>
          </div>

          {/* Centered Controls Bar */}
          <div style={{ display: 'flex', marginTop: '1.25rem', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Square Pixel Camera Toggle Button */}
            <button 
              className="btn"
              onClick={() => setCameraEnabled(prev => !prev)}
              title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
              style={{ 
                backgroundColor: cameraEnabled ? 'var(--window-title-bg)' : 'var(--button-bg)', 
                width: '48px',
                height: '48px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                lineHeight: 0,
                boxSizing: 'border-box'
              }}
            >
              <img 
                src="/assets/pixel_camera.png" 
                alt="Toggle Camera" 
                style={{ width: '26px', height: '26px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
              />
            </button>

            {/* Square Pixel Lightning Bolt Toggle Button */}
            <button 
              className="btn"
              onClick={() => setFlashEnabled(prev => !prev)}
              title={flashEnabled ? "Flash ON" : "Flash OFF"}
              style={{ 
                backgroundColor: flashEnabled ? 'var(--window-title-bg)' : 'var(--button-bg)', 
                width: '48px',
                height: '48px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                lineHeight: 0,
                boxSizing: 'border-box'
              }}
            >
              <img 
                src="/assets/pixel_lightning.png" 
                alt="Toggle Flash" 
                style={{ width: '24px', height: '24px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
              />
            </button>

            {/* Square Pixel Switch Camera (Front / Back) Toggle Button */}
            <button 
              className="btn"
              onClick={toggleFacingMode}
              title={`Switch Camera (${facingMode === 'user' ? 'Front Camera' : 'Back Camera'})`}
              style={{ 
                backgroundColor: facingMode === 'environment' ? 'var(--window-title-bg)' : 'var(--button-bg)', 
                width: '48px',
                height: '48px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                lineHeight: 0,
                boxSizing: 'border-box'
              }}
            >
              <img 
                src="/assets/pixel_switch_camera.png" 
                alt="Switch Front / Back Camera" 
                style={{ width: '26px', height: '26px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
              />
            </button>

            {/* Take Photo Button */}
            <button 
              className="btn"
              onClick={takePhoto}
              style={{ 
                backgroundColor: 'var(--window-title-bg)', 
                color: 'var(--window-title-text)', 
                fontWeight: 'bold', 
                padding: '0.7rem 2.2rem', 
                fontSize: '1.2rem',
                height: '48px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Take Photo
            </button>
          </div>

          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-color)', textAlign: 'center' }}>
            Drag {gameState.petName} to position your sticker, pick a style, and snap your photo!
          </p>
        </div>
      )}

      {/* Album View */}
      {view === 'album' && (
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          
          {/* Gallery Header Controls */}
          {photos.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Album ({photos.length} {photos.length === 1 ? 'photo' : 'photos'})
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={() => setSelectedIndex(0)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                >
                  Slideshow ◀ ▶
                </button>
              </div>
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
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
              photos.map((photo, index) => (
                <div 
                  key={photo.id}
                  id={`photo-${photo.id}`}
                  onClick={() => setSelectedIndex(index)}
                  title="Click to enlarge & view options!"
                  style={{ 
                    position: 'relative', 
                    aspectRatio: '4/3',
                    backgroundColor: '#eee',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'transform 0.15s ease'
                  }}>
                  <img src={photo.bg} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: photo.stickerPos ? `${photo.stickerPos.y}%` : '5%', 
                    left: photo.stickerPos ? `${photo.stickerPos.x}%` : '65%',
                    width: '140px',
                    height: '140px',
                    transformOrigin: 'bottom right',
                    transform: 'scale(0.5)'
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
        </div>
      )}

      {/* Full-Size Photo Modal with Prev / Next Navigation */}
      {selectedPhoto && selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="window"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--window-bg)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Title Bar */}
            <div className="window-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Photo {selectedIndex + 1} of {photos.length} ({new Date(selectedPhoto.date).toLocaleDateString()})</span>
              <button 
                className="btn" 
                onClick={() => setSelectedIndex(null)}
                style={{ padding: '0.1rem 0.6rem', fontSize: '0.9rem' }}
              >
                X
              </button>
            </div>

            {/* Modal Photo Frame with Left/Right Nav Arrows */}
            <div 
              id={`photo-${selectedPhoto.id}`}
              style={{ 
                position: 'relative', 
                width: '100%', 
                aspectRatio: '4/3', 
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Previous Photo Button (Square Retro Left Arrow) */}
              {photos.length > 1 && (
                <button
                  className="btn"
                  onClick={handlePrev}
                  title="Previous Photo (Left Arrow)"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: '28px',
                    height: '28px',
                    padding: 0,
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ display: 'block', margin: 'auto' }}>
                    <path d="M8 2L3 6L8 10Z" />
                  </svg>
                </button>
              )}

              {/* Next Photo Button (Square Retro Right Arrow) */}
              {photos.length > 1 && (
                <button
                  className="btn"
                  onClick={handleNext}
                  title="Next Photo (Right Arrow)"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: '28px',
                    height: '28px',
                    padding: 0,
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ display: 'block', margin: 'auto' }}>
                    <path d="M4 2L9 6L4 10Z" />
                  </svg>
                </button>
              )}

              <img 
                src={selectedPhoto.bg} 
                alt="Full Size Photo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ 
                position: 'absolute', 
                bottom: selectedPhoto.stickerPos ? `${selectedPhoto.stickerPos.y}%` : '5%', 
                left: selectedPhoto.stickerPos ? `${selectedPhoto.stickerPos.x}%` : '65%',
                width: '140px',
                height: '140px'
              }}>
                <FrogAvatar gameState={selectedPhoto} />
              </div>
            </div>

            {/* Modal Action Controls Bar (Matching Light Purple Theme) */}
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--primary-light)' }}>
              {/* Centered Download Pixel Image Button */}
              <button 
                className="btn"
                onClick={(e) => {
                  downloadPhoto(selectedPhoto.id, e);
                  setDownloadedPhotos(prev => ({ ...prev, [selectedPhoto.id]: true }));
                }}
                title="Download Photo to Device"
                style={{
                  backgroundColor: downloadedPhotos[selectedPhoto.id] ? 'var(--button-active)' : 'var(--button-bg)',
                  filter: downloadedPhotos[selectedPhoto.id] ? 'brightness(0.82)' : 'none',
                  width: '48px',
                  height: '48px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  lineHeight: 0,
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
              >
                <img 
                  src="/assets/pixel_download.png" 
                  alt="Download" 
                  style={{ width: '24px', height: '24px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                />
              </button>

              {/* Centered Delete Trashcan Pixel Image Button */}
              <button 
                className="btn"
                onClick={(e) => handleDelete(selectedPhoto.id, e)}
                title="Delete Photo"
                style={{
                  backgroundColor: 'var(--button-bg)',
                  width: '48px',
                  height: '48px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  lineHeight: 0,
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
              >
                <img 
                  src="/assets/pixel_trash.png" 
                  alt="Delete" 
                  style={{ width: '24px', height: '24px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
