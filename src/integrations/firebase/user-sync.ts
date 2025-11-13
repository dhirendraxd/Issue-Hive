import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import type { User } from 'firebase/auth';

/**
 * Sync user profile (name, photo) to Firestore users collection
 */
export async function syncUserProfile(user: User) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    email: user.email || '',
    updatedAt: Date.now(),
  }, { merge: true });
}
