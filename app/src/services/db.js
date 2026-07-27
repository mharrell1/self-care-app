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
      equippedItem: 'base',
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
    equippedItem: 'base',
    equippedItems: [],
    unlockedItems: ['base']
  };
  await setDoc(docRef, defaultState);
  return defaultState;
};

export const saveJournalEntry = async (userId, entryContent, photoUrl = null) => {
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
    userId: userId,
    photoUrl: storagePhotoUrl
  };

  // Always save to localStorage immediately for instant offline & local availability
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
    const filtered = existing.filter(e => e.id !== entry.id);
    filtered.unshift(entry);
    localStorage.setItem(`frog_journal_${userId}`, JSON.stringify(filtered));
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
      const existing = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
      const updated = existing.map(e => e.id === entry.id || (e.date === entry.date && e.content === entry.content) ? { ...e, id: docRef.id } : e);
      localStorage.setItem(`frog_journal_${userId}`, JSON.stringify(updated));
    } catch (e) {}
  } catch (dbErr) {
    console.error("Firestore journal save error:", dbErr);
  }

  return entry;
};

export const getJournalEntries = async (userId) => {
  const localEntries = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');

  if (!isConfigured) {
    await delay(100);
    return localEntries;
  }

  try {
    const q = query(collection(db, "journals"), where("userId", "==", userId));
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
    return localEntries;
  }
};

export const updateJournalEntry = async (userId, entryId, newContent, photoUrl = undefined) => {
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
    const updated = existing.map(e => {
      if (e.id === entryId) {
        const updateObj = { ...e, content: newContent, editedAt: new Date().toISOString() };
        if (photoUrl !== undefined) {
          updateObj.photoUrl = photoUrl;
        }
        return updateObj;
      }
      return e;
    });
    localStorage.setItem(`frog_journal_${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.error("Error updating local journal entry:", err);
  }

  if (isConfigured && entryId) {
    try {
      const docRef = doc(db, "journals", entryId);
      const updateData = { content: newContent, editedAt: new Date().toISOString() };
      if (photoUrl !== undefined) {
        updateData.photoUrl = photoUrl;
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

const compressDataUrlForStorage = (dataUrl, maxDimension = 800, quality = 0.75) => {
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
  const entry = { ...photoEntry, date: photoEntry.date || new Date().toISOString(), userId };
  if (!entry.id) entry.id = Date.now().toString();

  // Compress heavy base64 image data URL before saving to localStorage to prevent QuotaExceededError
  let storageBg = entry.bg;
  if (storageBg && storageBg.length > 200000) {
    try {
      storageBg = await compressDataUrlForStorage(entry.bg, 800, 0.75);
    } catch (e) {
      console.warn("Compression fallback:", e);
    }
  }

  const localEntry = { ...entry, bg: storageBg };

  // Always save to localStorage immediately for instant UI update & offline reliability
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
    const filtered = existing.filter(p => p.id !== entry.id);
    filtered.unshift(localEntry);
    localStorage.setItem(`frog_photos_${userId}`, JSON.stringify(filtered));
  } catch (err) {
    console.warn("LocalStorage save warning, pruning older photos to free space...", err);
    try {
      const existing = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
      const pruned = [localEntry, ...existing.filter(p => p.id !== entry.id)].slice(0, 8);
      localStorage.setItem(`frog_photos_${userId}`, JSON.stringify(pruned));
    } catch (e) {
      console.error("Failed to store in localStorage:", e);
    }
  }

  if (!isConfigured) {
    return entry;
  }

  try {
    const imageId = entry.id;
    const storageRef = ref(storage, `photos/${userId}/${imageId}.jpg`);
    await uploadString(storageRef, photoEntry.bg, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    entry.bg = downloadURL;
    
    const docRef = await addDoc(collection(db, "photos"), entry);
    entry.id = docRef.id;
  } catch (error) {
    console.warn("Storage upload fallback: saving photo directly to Firestore Cloud DB...", error);
    try {
      const docRef = await addDoc(collection(db, "photos"), entry);
      entry.id = docRef.id;
    } catch (fsErr) {
      console.error("Firestore photo save error:", fsErr);
    }
  }

  return entry;
};

export const getPhotos = async (userId) => {
  const localPhotos = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');

  if (!isConfigured) {
    await delay(100);
    return localPhotos;
  }

  try {
    const q = query(collection(db, "photos"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const remotePhotos = [];
    querySnapshot.forEach((doc) => {
      remotePhotos.push({ id: doc.id, ...doc.data() });
    });
    
    // Deduplicate combined photos using date timestamp or image content key
    const photoMap = new Map();
    [...remotePhotos, ...localPhotos].forEach(p => {
      const key = p.date || p.id || p.bg;
      if (!photoMap.has(key)) {
        photoMap.set(key, p);
      }
    });
    const combined = Array.from(photoMap.values());
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error("Error fetching photos from Firestore, using local storage:", err);
    return localPhotos;
  }
};

export const deletePhoto = async (userId, photoId, photoObj) => {
  const targetDate = photoObj?.date;
  const targetBg = photoObj?.bg;

  // 1. Remove from LocalStorage
  try {
    const existing = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
    const filtered = existing.filter(p => {
      if (p.id === photoId) return false;
      if (targetDate && p.date === targetDate) return false;
      if (targetBg && p.bg === targetBg) return false;
      return true;
    });
    localStorage.setItem(`frog_photos_${userId}`, JSON.stringify(filtered));
  } catch (err) {
    console.error("Error deleting local photo:", err);
  }

  // 2. Remove ALL matching documents from Firestore Cloud DB
  if (isConfigured) {
    try {
      if (photoId) {
        try {
          await deleteDoc(doc(db, "photos", photoId));
        } catch (e) {}
      }

      const q = query(collection(db, "photos"), where("userId", "==", userId));
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
