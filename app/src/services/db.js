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
    equippedItem: 'base',
    equippedItems: [],
    unlockedItems: ['base']
  };
  await setDoc(docRef, defaultState);
  return defaultState;
};

export const saveJournalEntry = async (userId, entryContent, photoUrl = null) => {
  const entry = {
    content: entryContent,
    date: new Date().toISOString(),
    userId: userId,
    photoUrl: photoUrl
  };

  if (!isConfigured) {
    await delay(200);
    entry.id = Date.now().toString();
    const existing = JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
    existing.unshift(entry);
    localStorage.setItem(`frog_journal_${userId}`, JSON.stringify(existing));
    return entry;
  }

  const docRef = await addDoc(collection(db, "journals"), entry);
  entry.id = docRef.id;
  return entry;
};

export const getJournalEntries = async (userId) => {
  if (!isConfigured) {
    await delay(200);
    return JSON.parse(localStorage.getItem(`frog_journal_${userId}`) || '[]');
  }

  const q = query(collection(db, "journals"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const entries = [];
  querySnapshot.forEach((doc) => {
    entries.push({ id: doc.id, ...doc.data() });
  });
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
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

export const savePhoto = async (userId, photoEntry) => {
  const entry = { ...photoEntry, date: new Date().toISOString(), userId };
  
  // Always save to localStorage immediately for instant UI update & offline reliability
  try {
    entry.id = Date.now().toString();
    const existing = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
    existing.unshift(entry);
    localStorage.setItem(`frog_photos_${userId}`, JSON.stringify(existing));
  } catch (err) {
    console.error("LocalStorage save error:", err);
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
