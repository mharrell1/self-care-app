import { db, storage, firebaseConfig } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
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

export const saveJournalEntry = async (userId, entryContent) => {
  const entry = {
    content: entryContent,
    date: new Date().toISOString(),
    userId: userId
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
  
  if (!isConfigured) {
    await delay(200);
    entry.id = Date.now().toString();
    const existing = JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
    existing.unshift(entry);
    localStorage.setItem(`frog_photos_${userId}`, JSON.stringify(existing));
    return entry;
  }

  try {
    const imageId = Date.now().toString();
    const storageRef = ref(storage, `photos/${userId}/${imageId}.jpg`);
    await uploadString(storageRef, photoEntry.bg, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    entry.bg = downloadURL;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    // If storage fails, we could fallback to base64, but better to let it fail or continue
  }

  const docRef = await addDoc(collection(db, "photos"), entry);
  entry.id = docRef.id;
  return entry;
};

export const getPhotos = async (userId) => {
  if (!isConfigured) {
    await delay(200);
    return JSON.parse(localStorage.getItem(`frog_photos_${userId}`) || '[]');
  }

  const q = query(collection(db, "photos"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const photos = [];
  querySnapshot.forEach((doc) => {
    photos.push({ id: doc.id, ...doc.data() });
  });
  return photos.sort((a, b) => new Date(b.date) - new Date(a.date));
};
