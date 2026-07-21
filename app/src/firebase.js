import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAi1RkterMMer82eAx4iWBlh6TYFiWtGzc",
  authDomain: "self-care-app-29745.firebaseapp.com",
  projectId: "self-care-app-29745",
  storageBucket: "self-care-app-29745.firebasestorage.app",
  messagingSenderId: "358575206708",
  appId: "1:358575206708:web:3fabd11f8044becfdd3561",
  measurementId: "G-RMGW505XVK"
};

let app, auth, db, storage;

try {
  // Only initialize if the placeholder has been replaced
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { auth, db, storage, firebaseConfig };
