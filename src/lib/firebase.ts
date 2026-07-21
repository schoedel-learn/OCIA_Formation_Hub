import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { auth, db, isFirebaseAvailable };
