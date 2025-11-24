import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from '@/integrations/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Sync user Auth data to Firestore
async function syncUserToFirestore(user: User) {
  if (!db) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Only update if displayName or photoURL is missing in Firestore
    if (!userSnap.exists() || !userSnap.data()?.displayName || !userSnap.data()?.photoURL) {
      await setDoc(userRef, {
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        updatedAt: Date.now(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
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
