import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

function ensureAuth() {
  if (!isFirebaseConfigured || !auth) {
    const err = new Error('Authentication is not available: Firebase is not configured.');
    // Customize a code so UI can branch on it
    // @ts-expect-error augmenting error for UI
    err.code = 'auth/not-configured';
    throw err;
  }
  return auth;
}

export const signIn = async (email: string, password: string) => {
  const a = ensureAuth();
  return signInWithEmailAndPassword(a, email, password);
};

export const signUp = async (email: string, password: string) => {
  const a = ensureAuth();
  return createUserWithEmailAndPassword(a, email, password);
};

export const signOut = async () => {
  const a = ensureAuth();
  return firebaseSignOut(a);
};

export const signInWithGoogle = async () => {
  const a = ensureAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(a, provider);
};

export type { User };
