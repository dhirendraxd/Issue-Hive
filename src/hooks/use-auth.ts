import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from '@/integrations/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';

// Sync user Auth data to Firestore
async function syncUserToFirestore(user: User) {
  if (!db) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const data = userSnap.data();
    const needsProfileFields = !userSnap.exists() || !data?.displayName || !data?.photoURL;
    const missingCreatedAt = !data?.createdAt;
    const authCreatedAt = user.metadata?.creationTime ? Date.parse(user.metadata.creationTime) : undefined;

    if (needsProfileFields || missingCreatedAt) {
      await setDoc(userRef, {
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: data?.createdAt || authCreatedAt || Date.now(),
        updatedAt: Date.now(),
      }, { merge: true });
    }
  } catch (error) {
    logger.error('Error syncing user to Firestore:', error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase isn't configured, immediately resolve with no user
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Sync user data to Firestore when they sign in
      if (user) {
        syncUserToFirestore(user);
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
