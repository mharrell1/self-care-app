import { db, storage, firebaseConfig } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock behavior if Firebase is not configured
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

export const saveGameState = async (userId, state) => {
  if (!isConfigured) {
    await delay(200);
    localStorage.setItem(`frog_state_${userId}`, JSON.stringify(state));
    return;
  }
  await setDoc(doc(db, "users", userId), state, { merge: true });
};

export const getGameState = async (userId) => {
  if (!isConfigured) {
    await delay(200);
    const data = localStorage.getItem(`frog_state_${userId}`);
    if (data) return JSON.parse(data);
    return {
      petName: 'Froggy',
      themeColor: 'pink',
      coins: 100,
      hunger: 50,
      happiness: 50,
      cleanliness: 50,
      health: 100,
      medicationTaken: false,
      isSleeping: false,
      isVacation: false,
      selectedBackground: 'default',
      checkInStreak: 1,
      lastCheckInDate: '',
      activeDays: [],
      friendshipLevel: 1,
      friendshipXP: 10,
      dailyMoodLogs: {},
      frogVersion: 'blue_shirt',
      equippedItem: 'base',
      equippedItems: [],
      unlockedItems: ['base']
    };
  }

  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  
  const defaultState = {
    petName: 'Froggy',
    themeColor: 'pink',
    coins: 100,
    hunger: 50,
    happiness: 50,
    cleanliness: 50,
    health: 100,
    medicationTaken: false,
    isSleeping: false,
    isVacation: false,
    selectedBackground: 'default',
    checkInStreak: 1,
    lastCheckInDate: '',
    activeDays: [],
    friendshipLevel: 1,
    friendshipXP: 10,
    dailyMoodLogs: {},
    frogVersion: 'blue_shirt',
    equippedItem: 'base',
    equippedItems: [],
    unlockedItems: ['base']
  };
  await setDoc(docRef, defaultState);
  return defaultState;
};

export const saveJournalEntry = async (userId, entryContent, photoUrl = null) => {
  const effectiveUserId = userId || 'default_user';
  let storagePhotoUrl = photoUrl;
  if (storagePhotoUrl && storagePhotoUrl.length > 150000) {
    try {
      storagePhotoUrl = await compressDataUrlForStorage(photoUrl, 800, 0.75);
    } catch (e) {
      console.warn("Journal photo compression warning:", e);
    }
  }

  const entry = {
    id: Date.now().toString(),
    content: entryContent,
    date: new Date().toISOString(),
    userId: effectiveUserId,
    photoUrl: storagePhotoUrl
  };

  // Always save to localStorage immediately for instant offline & local availability
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_journal_${effectiveUserId}`) || '[]');
    const filtered = existing.filter(e => e.id !== entry.id);
    filtered.unshift(entry);
    localStorage.setItem(`frog_journal_${effectiveUserId}`, JSON.stringify(filtered));
  } catch (err) {
    console.error("LocalStorage journal save error:", err);
  }

  if (!isConfigured) {
    await delay(100);
    return entry;
  }

  try {
    const docRef = await addDoc(collection(db, "journals"), entry);
    entry.id = docRef.id;
    // Update local id reference if Cloud DB assignment succeeds
    try {
      const existing = JSON.parse(localStorage.getItem(`frog_journal_${effectiveUserId}`) || '[]');
      const updated = existing.map(e => e.id === entry.id || (e.date === entry.date && e.content === entry.content) ? { ...e, id: docRef.id } : e);
      localStorage.setItem(`frog_journal_${effectiveUserId}`, JSON.stringify(updated));
    } catch (e) {}
  } catch (dbErr) {
    console.error("Firestore journal save error:", dbErr);
  }

  return entry;
};

export const getJournalEntries = async (userId) => {
  const effectiveUserId = userId || 'default_user';
  const localKeys = [`frog_journal_${effectiveUserId}`, 'frog_journal_default_user', 'frog_journal_demo_user', 'frog_journal_null'];
  let localEntries = [];
  localKeys.forEach(k => {
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || '[]');
      localEntries = [...localEntries, ...parsed];
    } catch (e) {}
  });

  if (!isConfigured) {
    await delay(100);
    const map = new Map();
    localEntries.forEach(item => {
      const key = item.id || `${item.date}_${item.content?.substring(0, 10)}`;
      if (!map.has(key) || (item.photoUrl && !map.get(key).photoUrl)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  try {
    const q = query(collection(db, "journals"), where("userId", "in", [effectiveUserId, "default_user", "demo_user"]));
    const querySnapshot = await getDocs(q);
    const remoteEntries = [];
    querySnapshot.forEach((doc) => {
      remoteEntries.push({ id: doc.id, ...doc.data() });
    });

    const map = new Map();
    [...localEntries, ...remoteEntries].forEach(item => {
      const key = item.id || `${item.date}_${item.content?.substring(0, 10)}`;
      if (!map.has(key) || (item.photoUrl && !map.get(key).photoUrl)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.error("Firestore getJournalEntries error:", e);
    const map = new Map();
    localEntries.forEach(item => {
      const key = item.id || `${item.date}_${item.content?.substring(0, 10)}`;
      if (!map.has(key) || (item.photoUrl && !map.get(key).photoUrl)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export const updateJournalEntry = async (userId, entryId, newContent, photoUrl = undefined) => {
  const effectiveUserId = userId || 'default_user';

  let storagePhotoUrl = photoUrl;
  if (storagePhotoUrl && storagePhotoUrl.length > 150000) {
    try {
      storagePhotoUrl = await compressDataUrlForStorage(photoUrl, 800, 0.75);
    } catch (e) {
      console.warn("Edit photo compression warning:", e);
    }
  }

  // 1. Update across all local storage keys
  const localKeys = [`frog_journal_${effectiveUserId}`, 'frog_journal_default_user', 'frog_journal_demo_user', 'frog_journal_null'];
  localKeys.forEach(k => {
    try {
      const existing = JSON.parse(localStorage.getItem(k) || '[]');
      const updated = existing.map(e => {
        if (e.id === entryId) {
          const updateObj = { ...e, content: newContent, editedAt: new Date().toISOString() };
          if (photoUrl !== undefined) {
            updateObj.photoUrl = storagePhotoUrl;
          }
          return updateObj;
        }
        return e;
      });
      localStorage.setItem(k, JSON.stringify(updated));
    } catch (err) {
      console.error("Error updating local journal entry:", err);
    }
  });

  // 2. Update Firestore Cloud DB document
  if (isConfigured && entryId) {
    try {
      const docRef = doc(db, "journals", entryId);
      const updateData = { content: newContent, editedAt: new Date().toISOString() };
      if (photoUrl !== undefined) {
        updateData.photoUrl = storagePhotoUrl;
      }
      await updateDoc(docRef, updateData);
    } catch (e) {
      console.error("Error updating remote journal entry:", e);
    }
  }
};

export const deleteJournalEntry = async (userId, entryId) => {
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
    const filtered = existing.filter(e => e.id !== entryId);
    localStorage.setItem(`frog_journal_${userId}`, JSON.stringify(filtered));
  } catch (err) {
    console.error("Error deleting local journal entry:", err);
  }

  if (isConfigured && entryId) {
    try {
      await deleteDoc(doc(db, "journals", entryId));
    } catch (e) {
      console.error("Error deleting remote journal entry:", e);
    }
  }
};

export const saveMood = async (userId, moodEntry) => {
  const entry = { ...moodEntry, userId };
  
  if (!isConfigured) {
    await delay(200);
    const existing = JSON.parse(localStorage.getItem(`frog_mood_${userId}`) || '[]');
    existing.push(entry);
    localStorage.setItem(`frog_mood_${userId}`, JSON.stringify(existing));
    return;
  }

  await addDoc(collection(db, "moods"), entry);
};

export const getMoodHistory = async (userId) => {
  if (!isConfigured) {
    await delay(200);
    return JSON.parse(localStorage.getItem(`frog_mood_${userId}`) || '[]');
  }

  const q = query(collection(db, "moods"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const moods = [];
  querySnapshot.forEach((doc) => {
    moods.push(doc.data());
  });
  return moods.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const compressDataUrlForStorage = (dataUrl, maxDimension = 700, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const savePhoto = async (userId, photoEntry) => {
  const effectiveUserId = userId || 'default_user';
  const entry = { ...photoEntry, date: photoEntry.date || new Date().toISOString(), userId: effectiveUserId };
  if (!entry.id) entry.id = Date.now().toString();

  // Compress heavy base64 image data URL before saving to localStorage and Firestore to prevent quota & size errors
  let storageBg = entry.bg;
  if (storageBg) {
    try {
      storageBg = await compressDataUrlForStorage(entry.bg, 700, 0.82);
    } catch (e) {
      console.warn("Compression fallback:", e);
    }
  }

  const localEntry = { ...entry, bg: storageBg };

  // Always save to localStorage immediately for instant UI update & offline reliability
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_photos_${effectiveUserId}`) || '[]');
    const filtered = existing.filter(p => p.id !== entry.id);
    filtered.unshift(localEntry);
    localStorage.setItem(`frog_photos_${effectiveUserId}`, JSON.stringify(filtered));
  } catch (err) {
    console.warn("LocalStorage save warning, pruning older photos to free space...", err);
    try {
      const existing = JSON.parse(localStorage.getItem(`frog_photos_${effectiveUserId}`) || '[]');
      const pruned = [localEntry, ...existing.filter(p => p.id !== entry.id)].slice(0, 8);
      localStorage.setItem(`frog_photos_${effectiveUserId}`, JSON.stringify(pruned));
    } catch (e) {
      console.error("Failed to store in localStorage:", e);
    }
  }

  if (!isConfigured) {
    return localEntry;
  }

  try {
    const docRef = await addDoc(collection(db, "photos"), localEntry);
    localEntry.id = docRef.id;
  } catch (error) {
    console.error("Firestore photo save error:", error);
  }

  return localEntry;
};

export const getPhotos = async (userId) => {
  const effectiveUserId = userId || 'default_user';
  
  // Read from all local storage keys
  let localPhotos = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('frog_photos_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(parsed)) {
            localPhotos = [...localPhotos, ...parsed];
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  if (!isConfigured) {
    await delay(100);
    const photoMap = new Map();
    localPhotos.forEach(p => {
      if (!p || !p.bg) return;
      const key = p.id || p.date || p.bg;
      if (key && !photoMap.has(key)) {
        photoMap.set(key, p);
      }
    });
    return Array.from(photoMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  let remotePhotos = [];
  try {
    const q = query(collection(db, "photos"), where("userId", "in", [effectiveUserId, "default_user", "demo_user"]));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      remotePhotos.push({ id: doc.id, ...doc.data() });
    });
  } catch (err) {
    console.warn("Filtered query failed, fetching all photos from Firestore collection...", err);
  }

  // If remotePhotos is empty, fetch ALL documents in 'photos' collection as fallback!
  if (remotePhotos.length === 0) {
    try {
      const querySnapshot = await getDocs(collection(db, "photos"));
      querySnapshot.forEach((doc) => {
        remotePhotos.push({ id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.error("Firestore photos fetch error:", e);
    }
  }

  // Auto-sync unsynced local photos up to Firestore Cloud DB so they appear everywhere!
  const remoteIds = new Set(remotePhotos.map(r => r.id || r.date));
  localPhotos.forEach(async (lp) => {
    if (lp && lp.bg && !remoteIds.has(lp.id || lp.date)) {
      try {
        let compressedBg = lp.bg;
        if (compressedBg.length > 100000) {
          compressedBg = await compressDataUrlForStorage(lp.bg, 700, 0.82);
        }
        const syncEntry = { ...lp, bg: compressedBg, userId: effectiveUserId };
        await addDoc(collection(db, "photos"), syncEntry);
      } catch (syncErr) {
        console.warn("Auto sync local photo failed:", syncErr);
      }
    }
  });

  // Deduplicate combined remote + local photos
  const photoMap = new Map();
  [...remotePhotos, ...localPhotos].forEach(p => {
    if (!p || !p.bg) return;
    const key = p.id || p.date || p.bg;
    if (key && !photoMap.has(key)) {
      photoMap.set(key, p);
    }
  });

  const combined = Array.from(photoMap.values());
  return combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

export const deletePhoto = async (userId, photoId, photoObj) => {
  const effectiveUserId = userId || 'default_user';
  const targetDate = photoObj?.date;
  const targetBg = photoObj?.bg;

  // 1. Remove from LocalStorage
  const localKeys = [`frog_photos_${effectiveUserId}`, 'frog_photos_default_user', 'frog_photos_demo_user', 'frog_photos_null'];
  localKeys.forEach(k => {
    try {
      const existing = JSON.parse(localStorage.getItem(k) || '[]');
      const filtered = existing.filter(p => {
        if (p.id === photoId) return false;
        if (targetDate && p.date === targetDate) return false;
        if (targetBg && p.bg === targetBg) return false;
        return true;
      });
      localStorage.setItem(k, JSON.stringify(filtered));
    } catch (err) {}
  });

  // 2. Remove ALL matching documents from Firestore Cloud DB
  if (isConfigured) {
    try {
      if (photoId) {
        try {
          await deleteDoc(doc(db, "photos", photoId));
        } catch (e) {}
      }

      const q = query(collection(db, "photos"), where("userId", "in", [effectiveUserId, "default_user", "demo_user"]));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((documentSnap) => {
        const data = documentSnap.data();
        if (
          documentSnap.id === photoId ||
          (targetDate && data.date === targetDate) ||
          (targetBg && data.bg === targetBg)
        ) {
          deletePromises.push(deleteDoc(doc(db, "photos", documentSnap.id)));
        }
      });
      await Promise.all(deletePromises);
    } catch (e) {
      console.error("Error purging remote photo from Firestore:", e);
    }
  }
};
