import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getDatabase, type Database } from 'firebase/database';
import { logger } from '@/lib/logger';

// Firebase configuration
// Get these values from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Determine if Firebase is configured (prevent runtime crashes when env vars are missing)
const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let realtimeDb: Database | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

try {
  if (isConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } else {
    logger.warn('[Issue-Hive] Firebase not configured. Set VITE_FIREBASE_* env vars to enable auth and database.');
  }
} catch (e) {
  logger.warn('[Issue-Hive] Failed to initialize Firebase. The app will run without it.', e);
}

export { app, auth, db, realtimeDb, storage, analytics };
export const isFirebaseConfigured = isConfigured;
export default app;
