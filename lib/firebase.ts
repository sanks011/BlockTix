import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"
import { getAnalytics, isSupported } from "firebase/analytics"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLy0dNdNb7uOOuHNqRW6ZPLX5x73xJ2C0",
  authDomain: "web3-cbe12.firebaseapp.com",
  projectId: "web3-cbe12",
  storageBucket: "web3-cbe12.firebasestorage.app",
  messagingSenderId: "261683440539",
  appId: "1:261683440539:web:5c1e3f8e35d09857d8cf3e",
  measurementId: "G-MKVB0XPPE6",
  databaseURL: "https://web3-cbe12-default-rtdb.firebaseio.com",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize services
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
const realtime = getDatabase(app)

// Initialize analytics if supported
const initializeAnalytics = async () => {
  if (typeof window !== "undefined") {
    if (await isSupported()) {
      return getAnalytics(app)
    }
  }
  return null
}

const analytics = initializeAnalytics()

export { app, db, auth, storage, realtime, analytics }
