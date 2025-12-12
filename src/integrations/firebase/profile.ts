import { updateProfile } from 'firebase/auth';
import { auth } from './config';
import type { User } from 'firebase/auth';
import { getDefaultAvatarUrl, type AvatarStyleId } from '@/lib/avatar';
import { logger } from '@/lib/logger';

/**
 * Upload a custom profile picture to Firebase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns The download URL from Firebase Storage
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  logger.debug('uploadProfilePicture called with:', { fileName: file.name, fileSize: file.size, userId });
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  // Validate file size (max 5MB for Firebase Storage)
  const maxSize = 5 * 1024 * 1024; // 5MB max
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB for profile pictures.');
  }

  try {
    // Upload to Firebase Storage
    const { storage } = await import('./config');
    if (!storage) {
      throw new Error('Firebase Storage is not configured');
    }
    
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storageRef = ref(storage, `profile-pictures/${userId}/avatar`);
    
    logger.debug('Uploading to Firebase Storage...');
    await uploadBytes(storageRef, file);
    
    const downloadURL = await getDownloadURL(storageRef);
    logger.debug('Image uploaded successfully, URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    logger.error('Upload error details:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: Unknown error');
  }
}

/**
 * Update user's profile picture in Firebase Auth and Firestore
 * @param user - The current user
 * @param photoURL - The new photo URL (can be firestore://, http://, or data: URL)
 */
export async function updateUserProfilePicture(user: User, photoURL: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured');
  }

  // Update Firebase Auth with the reference URL
  await updateProfile(user, { photoURL });
  
  // Also sync to Firestore
  const { db } = await import('./config');
  if (db) {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), { 
      photoURL,
      updatedAt: Date.now() 
    }, { merge: true });
  }
}

/**
 * Set a default avatar for the user
 * @param user - The current user
 * @param style - The avatar style to use
 * @returns The photo URL that was set
 */
export async function setDefaultAvatar(user: User, style: AvatarStyleId): Promise<string> {
  const photoURL = getDefaultAvatarUrl(user.uid, style);
  await updateUserProfilePicture(user, photoURL);
  return photoURL;
}

/**
 * Delete the user's custom profile picture
 * @param photoURL - The URL of the photo to delete
 * Note: For base64 images stored in Firestore, this is a no-op
 */
export async function deleteProfilePicture(photoURL: string): Promise<void> {
  // Base64 data URLs are stored in Firestore, nothing to delete from Storage
  // External URLs (like DiceBear) also don't need deletion
  logger.debug('Profile picture cleanup (no-op for base64/external URLs)');
  return;
}

/**
 * Update user's display name
 * @param user - The current user
 * @param displayName - The new display name
 */
export async function updateUserDisplayName(user: User, displayName: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured');
  }

  await updateProfile(user, { displayName });
  
  // Also sync to Firestore
  const { db } = await import('./config');
  if (db) {
    const { doc, setDoc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), { 
      displayName,
      updatedAt: Date.now() 
    }, { merge: true });
    
    // Sync display name to all issues created by this user
    try {
      const issuesRef = collection(db, 'issues');
      const issuesQuery = query(issuesRef, where('createdBy', '==', user.uid));
      const issuesSnapshot = await getDocs(issuesQuery);
      
      if (!issuesSnapshot.empty) {
        const batch = writeBatch(db);
        issuesSnapshot.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, { createdByName: displayName });
        });
        await batch.commit();
        logger.debug(`Updated display name in ${issuesSnapshot.size} issues`);
      }
    } catch (error) {
      logger.error('Error syncing display name to issues:', error);
    }
    
    // Sync display name to all comments by this user
    try {
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(commentsRef, where('userId', '==', user.uid));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      if (!commentsSnapshot.empty) {
        const batch = writeBatch(db);
        commentsSnapshot.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, { userName: displayName });
        });
        await batch.commit();
        logger.debug(`Updated display name in ${commentsSnapshot.size} comments`);
      }
    } catch (error) {
      logger.error('Error syncing display name to comments:', error);
    }
  }
}

/**
 * Update username across all user data
 * @param userId - The user's ID
 * @param username - The new username
 */
export async function updateUsername(userId: string, username: string): Promise<void> {
  const { db } = await import('./config');
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', userId), { 
    username,
    updatedAt: Date.now() 
  }, { merge: true });
}
