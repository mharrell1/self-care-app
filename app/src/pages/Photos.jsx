import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import FrogAvatar from '../components/FrogAvatar';
import { savePhoto, getPhotos, deletePhoto } from '../services/db';

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

  // Instant Photo Capture Preview & Mobile Download Modal state
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [mobileSaveModalUrl, setMobileSaveModalUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewTimerRef = useRef(null);

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

    let x = ((clientX - rect.left) / rect.width) * 100 - 14;
    let y = ((clientY - rect.top) / rect.height) * 100 - 14;

    x = Math.max(0, Math.min(72, x));
    y = Math.max(0, Math.min(72, y));

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

  // Pure HTML5 2D Canvas Composite Generator (Single Merged High-Res PNG Photo)
  const createSingleCompositePhoto = async (bgRaw, pos, frogState) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        const cleanSrc = src.split('?')[0];
        
        // ONLY use crossOrigin if it is an absolute HTTP/HTTPS URL from a different domain!
        if (cleanSrc.startsWith('http') && !cleanSrc.startsWith(window.location.origin)) {
          img.crossOrigin = 'Anonymous';
        }
        
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error("Failed to load composite layer image:", cleanSrc, err);
          resolve(null);
        };
        img.src = cleanSrc;
      });
    };

    // Helper to draw an image centered with preserved aspect ratio (mimics CSS object-fit: contain)
    const drawContainImage = (img, dx, dy, dw, dh) => {
      const imgAspect = img.width / img.height;
      const boxAspect = dw / dh;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > boxAspect) {
        drawW = dw;
        drawH = dw / imgAspect;
        drawX = dx;
        drawY = dy + (dh - drawH) / 2;
      } else {
        drawH = dh;
        drawW = dh * imgAspect;
        drawX = dx + (dw - drawW) / 2;
        drawY = dy;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    // 1. Draw Background Image with 4:3 Cover-Fit alignment
    if (bgRaw) {
      const bgImg = await loadImage(bgRaw);
      if (bgImg) {
        const targetAspect = 1200 / 900;
        const imgAspect = bgImg.width / bgImg.height;
        let srcW, srcH, srcX, srcY;

        if (imgAspect > targetAspect) {
          srcH = bgImg.height;
          srcW = bgImg.height * targetAspect;
          srcX = (bgImg.width - srcW) / 2;
          srcY = 0;
        } else {
          srcW = bgImg.width;
          srcH = bgImg.width / targetAspect;
          srcX = 0;
          srcY = (bgImg.height - srcH) / 2;
        }

        ctx.drawImage(bgImg, srcX, srcY, srcW, srcH, 0, 0, 1200, 900);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 1200, 900);
        grad.addColorStop(0, '#f8bbd0');
        grad.addColorStop(1, '#f48fb1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 900);
      }
    }

    // 2. Determine Frog Base Image
    const getFrogSrc = (p) => {
      if (p.hunger < 30) return '/assets/frog_sad.png';
      const items = p.equippedItems || (p.equippedItem ? [p.equippedItem] : []);
      const itemNames = items.map(i => typeof i === 'object' ? i.name : i);
      if (itemNames.includes('partyhat')) return '/assets/mugugins_partyhat_sticker_v2.png';
      if (itemNames.includes('necklace')) return '/assets/frog_necklace.png';
      return '/assets/frog_dressup_base.png';
    };

    const frogSrc = getFrogSrc(frogState);
    const frogImg = await loadImage(frogSrc);

    if (frogImg) {
      const pPos = pos || { x: 60, y: 60 };
      const destX = (pPos.x / 100) * 1200;
      const destY = (pPos.y / 100) * 900;
      const stickerBoxW = 0.28 * 1200; // 336px
      const stickerBoxH = 0.28 * 1200; // 336px

      // Draw Frog Avatar Base with object-fit contain matching
      drawContainImage(frogImg, destX, destY, stickerBoxW, stickerBoxH);

      // Draw Clothing Accessories matching FrogAvatar percentage math
      const items = frogState.equippedItems || (frogState.equippedItem && frogState.equippedItem !== 'base' ? [frogState.equippedItem] : []);
      for (const item of items) {
        const itemName = typeof item === 'object' ? item.name : item;
        if (['partyhat', 'necklace', 'base'].includes(itemName)) continue;

        const clothImg = await loadImage(`/assets/clothing/${itemName}.png`);
        if (clothImg) {
          const hasCustomPos = typeof item === 'object' && item.left && item.top;
          const leftPercent = hasCustomPos ? (parseFloat(item.left) / 100) : 0.5;
          const topPercent = hasCustomPos ? (parseFloat(item.top) / 100) : 0.5;

          const centerX = destX + leftPercent * stickerBoxW;
          const centerY = destY + topPercent * stickerBoxH;

          let percentW = 0.666;
          if (itemName === 'pink_dress') percentW = 1.266;
          if (itemName === 'blue_dress') percentW = 1.466;
          if (itemName === 'frog_shirt') percentW = 0.866;
          if (itemName === 'pink_sunglasses') percentW = 0.40;
          if (['iridescent_bow', 'holographic_handbag', 'pink_heart_purse'].includes(itemName)) percentW = 0.30;

          const clothW = percentW * stickerBoxW;
          const clothH = (clothImg.height / clothImg.width) * clothW;
          ctx.drawImage(clothImg, centerX - clothW / 2, centerY - clothH / 2, clothW, clothH);
        }
      }
    }

    return canvas.toDataURL('image/png');
  };

  const takePhoto = async () => {
    // 1. Always trigger visual shutter flash pulse immediately
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    let bgDataUrl = customBg;
    if (!bgDataUrl && videoRef.current && stream) {
      try {
        const vW = videoRef.current.videoWidth || 640;
        const vH = videoRef.current.videoHeight || 480;

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');

        const targetAspect = 1200 / 900;
        const sourceAspect = vW / vH;

        let srcW = vW, srcH = vH, srcX = 0, srcY = 0;
        if (sourceAspect > targetAspect) {
          srcH = vH;
          srcW = vH * targetAspect;
          srcX = (vW - srcW) / 2;
          srcY = 0;
        } else {
          srcW = vW;
          srcH = vW / targetAspect;
          srcX = 0;
          srcY = (vH - srcH) / 2;
        }

        ctx.drawImage(videoRef.current, srcX, srcY, srcW, srcH, 0, 0, 1200, 900);
        bgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      } catch (err) {
        console.error("Error capturing video frame:", err);
      }
    }

    if (!bgDataUrl) {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 1200, 900);
      grad.addColorStop(0, '#f8bbd0');
      grad.addColorStop(1, '#f48fb1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 900);
      bgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    }

    const compositeDataUrl = await createSingleCompositePhoto(bgDataUrl, stickerPos, activeFrogState);

    const photoPayload = {
      id: Date.now().toString(),
      bg: compositeDataUrl,
      petName: gameState.petName || 'Froggy',
      date: new Date().toISOString()
    };

    // 2. IMMEDIATELY show captured preview card overlay over viewport (GUARANTEED feedback!)
    setCapturedPreview(photoPayload);

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setCapturedPreview(null);
    }, 4500);

    // 3. Save photo asynchronously in background
    try {
      await savePhoto(userId, photoPayload);
      loadPhotos();
    } catch (saveErr) {
      console.error("Error saving photo to DB:", saveErr);
    }
  };

  const downloadPhoto = async (photoId, e) => {
    if (e) e.stopPropagation();
    
    const targetPhoto = photos.find(p => p.id === photoId) || selectedPhoto || capturedPreview;
    if (!targetPhoto) return;
    
    setIsDownloading(true);

    try {
      // Use single merged composite PNG photo directly
      const dataUrl = (targetPhoto.bg && targetPhoto.bg.startsWith('data:image/png'))
        ? targetPhoto.bg 
        : await createSingleCompositePhoto(targetPhoto.bg, targetPhoto.stickerPos, targetPhoto);

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);

      if (isMobile) {
        // Mobile devices (iOS Safari / Android): attempt native share sheet for Camera Roll, or fallback to mobile modal
        let sharedSuccessfully = false;
        if (blob && navigator.canShare) {
          try {
            const file = new File([blob], `froggy_photo_${photoId}.png`, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Froggy Photo',
                text: 'Check out my froggy photo!'
              });
              sharedSuccessfully = true;
            }
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') {
              sharedSuccessfully = true;
            } else {
              console.warn("Web Share API failed, falling back to download modal:", shareErr);
            }
          }
        }

        if (!sharedSuccessfully) {
          setMobileSaveModalUrl(dataUrl);
        }
      } else {
        // Desktop browsers (macOS / Windows): trigger direct file download to Downloads folder
        const link = document.createElement('a');
        link.download = `froggy_photo_${photoId}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 150);
      }
    } catch (err) {
      console.error("Failed to download photo", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (photoId, e) => {
    if (e) e.stopPropagation();

    const targetPhoto = photos.find(p => p.id === photoId) || selectedPhoto;

    // Optimistically remove deleted photo from UI state immediately
    setPhotos(prev => prev.filter(p => p.id !== photoId && p.date !== targetPhoto?.date && p.bg !== targetPhoto?.bg));

    if (selectedPhoto?.id === photoId) {
      setSelectedIndex(null);
    }

    await deletePhoto(userId, photoId, targetPhoto);
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
                width: '28%',
                aspectRatio: '1/1',
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

            {/* Instant Photo Capture Preview Overlay Centered inside Viewport */}
            {capturedPreview && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                zIndex: 85,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justify: 'center',
                padding: '0.75rem',
                backdropFilter: 'blur(3px)'
              }}>
                <div style={{
                  backgroundColor: 'var(--window-bg)',
                  borderRadius: '12px',
                  border: '3px solid var(--window-border-dark)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.6rem',
                  maxWidth: '90%',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Photo Captured!
                  </div>
                  
                  {/* Photo Preview Thumbnail */}
                  <div style={{
                    position: 'relative',
                    width: '180px',
                    aspectRatio: '4/3',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid var(--window-border-dark)',
                    backgroundColor: '#000',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                  }}>
                    <img src={capturedPreview.bg} alt="Captured Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn"
                      onClick={() => downloadPhoto(capturedPreview.id)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: 'var(--window-title-bg)',
                        color: 'var(--window-title-text)',
                        fontWeight: 'bold'
                      }}
                    >
                      Save Photo
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setView('album');
                        setCapturedPreview(null);
                      }}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.85rem',
                        backgroundColor: 'var(--window-title-bg)',
                        color: 'var(--window-title-text)',
                        fontWeight: 'bold'
                      }}
                    >
                      View Album
                    </button>
                    <button
                      className="btn"
                      onClick={() => setCapturedPreview(null)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.85rem',
                        backgroundColor: 'var(--button-bg)',
                        fontWeight: 'bold'
                      }}
                    >
                      Take Another
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          {/* Instant Photo Capture Preview Notification Card */}
          {capturedPreview && (
            <div style={{
              marginTop: '0.75rem',
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--window-bg)',
              borderRadius: '12px',
              border: '3px solid var(--window-border-dark)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              padding: '0.6rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <div style={{
                  position: 'relative',
                  width: '68px',
                  height: '50px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '2px solid var(--window-border-dark)',
                  flexShrink: 0,
                  backgroundColor: '#000'
                }}>
                  <img src={capturedPreview.bg} alt="Captured Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Only render legacy overlay if image is not a pre-merged PNG composite */}
                  {capturedPreview.stickerPos && capturedPreview.bg && !capturedPreview.bg.startsWith('data:image/png') && (
                    <div style={{
                      position: 'absolute',
                      top: `${capturedPreview.stickerPos.y}%`,
                      left: `${capturedPreview.stickerPos.x}%`,
                      width: '140px',
                      height: '140px',
                      transform: 'scale(0.24)',
                      transformOrigin: 'top left'
                    }}>
                      <FrogAvatar gameState={capturedPreview} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Photo Captured!</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #555)' }}>Added to your frog album</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <button
                  className="btn"
                  onClick={() => {
                    setView('album');
                    setCapturedPreview(null);
                  }}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'var(--window-title-bg)',
                    color: 'var(--window-title-text)',
                    fontWeight: 'bold'
                  }}
                >
                  View Album
                </button>
                <button
                  className="btn"
                  onClick={() => setCapturedPreview(null)}
                  title="Dismiss preview"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.6rem',
                    backgroundColor: 'var(--button-bg)'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
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
                  id={`photo-thumb-${photo.id}`}
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
                  {/* Render Frog Sticker overlay for photos that store stickerPos */}
                  {photo.stickerPos && (
                    <div style={{ 
                      position: 'absolute', 
                      top: `${photo.stickerPos.y}%`, 
                      left: `${photo.stickerPos.x}%`,
                      width: '28%',
                      aspectRatio: '1/1',
                      pointerEvents: 'none'
                    }}>
                      <FrogAvatar gameState={photo} />
                    </div>
                  )}
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
              id={`photo-modal-${selectedPhoto.id}`}
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
              {/* Render Frog Sticker overlay for photos that store stickerPos */}
              {selectedPhoto.stickerPos && (
                <div style={{ 
                  position: 'absolute', 
                  top: `${selectedPhoto.stickerPos.y}%`, 
                  left: `${selectedPhoto.stickerPos.x}%`,
                  width: '28%',
                  aspectRatio: '1/1',
                  pointerEvents: 'none'
                }}>
                  <FrogAvatar gameState={selectedPhoto} />
                </div>
              )}
            </div>

            {/* Modal Action Controls Bar (Matching Light Purple Theme) */}
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--primary-light)' }}>
              {/* Centered Download Pixel Image Button */}
              <button 
                className="btn"
                disabled={isDownloading}
                onClick={(e) => {
                  downloadPhoto(selectedPhoto.id, e);
                  setDownloadedPhotos(prev => ({ ...prev, [selectedPhoto.id]: true }));
                }}
                title={isDownloading ? "Preparing photo..." : "Download Photo / Save to Camera Roll"}
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
                  transition: 'all 0.15s ease',
                  opacity: isDownloading ? 0.6 : 1
                }}
              >
                {isDownloading ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>...</span>
                ) : (
                  <img 
                    src="/assets/pixel_download.png" 
                    alt="Download" 
                    style={{ width: '24px', height: '24px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                  />
                )}
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

      {/* Mobile Long-Press Save Image Modal Fallback */}
      {mobileSaveModalUrl && (
        <div 
          onClick={() => setMobileSaveModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 2000,
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
              maxWidth: '460px',
              backgroundColor: 'var(--window-bg)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Save to Camera Roll
              </h3>
              <button 
                className="btn"
                onClick={() => setMobileSaveModalUrl(null)}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-primary)', 
              marginBottom: '0.75rem', 
              backgroundColor: 'var(--primary-light)', 
              padding: '0.6rem 0.75rem', 
              borderRadius: '8px', 
              border: '1px solid var(--window-border-dark)',
              lineHeight: 1.4
            }}>
              <strong>Tap & hold</strong> the photo below, then select <strong>"Add to Photos"</strong> or <strong>"Save Image"</strong> to save to your camera roll!
            </p>

            <div style={{ 
              width: '100%', 
              maxHeight: '60vh', 
              borderRadius: '10px', 
              overflow: 'hidden', 
              border: '3px solid var(--window-border-dark)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '1rem',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              <img 
                src={mobileSaveModalUrl} 
                alt="Save to Camera Roll" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '60vh', 
                  width: 'auto', 
                  height: 'auto', 
                  objectFit: 'contain', 
                  display: 'block', 
                  margin: 'auto', 
                  userSelect: 'auto', 
                  WebkitUserSelect: 'auto' 
                }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={() => {
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`<html><head><title>Froggy Photo</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${mobileSaveModalUrl}" style="max-width:100%;height:auto;" /></body></html>`);
                  } else {
                    window.location.href = mobileSaveModalUrl;
                  }
                }}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.6rem 1.2rem',
                  backgroundColor: 'var(--window-title-bg)',
                  color: 'var(--window-title-text)',
                  fontWeight: 'bold'
                }}
              >
                Open Full Image (Hold to Save)
              </button>
              <a 
                href={mobileSaveModalUrl} 
                download="froggy_photo.png"
                className="btn"
                title="Download Photo File"
                style={{
                  backgroundColor: 'var(--button-bg)',
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
                  src="/assets/pixel_download.png" 
                  alt="Download" 
                  style={{ width: '24px', height: '24px', imageRendering: 'pixelated', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                />
              </a>
              <button
                className="btn"
                onClick={() => setMobileSaveModalUrl(null)}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: 'bold', height: '48px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
