import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyADp-i-tjyiY9BluHLXw2nlrFxVOjZDsac",
  authDomain: "gen-lang-client-0879285190.firebaseapp.com",
  projectId: "gen-lang-client-0879285190",
  databaseId: "ai-studio-9b1de065-34ab-47a4-838d-03b9277df522",
  storageBucket: "gen-lang-client-0879285190.firebasestorage.app",
  messagingSenderId: "838430172422",
  appId: "1:838430172422:web:46f72e8f88961177ed2a87"
};

let app;
let auth: any = null;
let db: any = null;
let isFirebaseAvailable = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  auth = getAuth(app);
  
  // Initialize firestore with custom database ID specified in config
  db = getFirestore(app, firebaseConfig.databaseId);
  
  isFirebaseAvailable = true;
  console.log("[Firebase] Successfully connected to Firebase Project:", firebaseConfig.projectId);
} catch (error) {
  console.warn("[Firebase] Could not initialize real Firebase, using high-fidelity Local Persistence Engine instead.", error);
}

export { auth, db, isFirebaseAvailable };
