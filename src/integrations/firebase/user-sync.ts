import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
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

/**
 * Update createdByName in all issues created by this user
 * Call this after a user changes their display name
 */
export async function updateUserNameInIssues(userId: string, newDisplayName: string) {
  if (!db || !userId) return;
  
  try {
    // Query all issues where createdBy matches the user ID
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, where('createdBy', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No issues found for this user');
      return;
    }

    // Batch update all matching issues
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { createdByName: newDisplayName });
    });
    
    await batch.commit();
    console.log(`Updated ${snapshot.size} issues with new display name`);
  } catch (error) {
    console.error('Error updating user name in issues:', error);
    throw error;
  }
}

/**
 * Update createdByPhotoURL in all issues created by this user
 * Call this after a user changes their profile picture
 */
export async function updateUserPhotoInIssues(userId: string, newPhotoURL: string | null) {
  if (!db || !userId) return;
  
  try {
    // Query all issues where createdBy matches the user ID
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, where('createdBy', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No issues found for this user');
      return;
    }

    // Batch update all matching issues
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      if (newPhotoURL) {
        batch.update(docSnap.ref, { createdByPhotoURL: newPhotoURL });
      } else {
        // Remove the field if photo URL is null
        batch.update(docSnap.ref, { createdByPhotoURL: null });
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error updating user photo in issues:', error);
    throw error;
  }
}
