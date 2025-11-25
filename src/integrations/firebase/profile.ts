import { updateProfile } from 'firebase/auth';
import { auth } from './config';
import type { User } from 'firebase/auth';
import { getDefaultAvatarUrl, type AvatarStyleId } from '@/lib/avatar';

/**
 * Upload a custom profile picture (stores as base64 in Firestore - no Storage needed)
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns A firestore reference URL (format: firestore://users/{userId}/avatar)
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  console.log('uploadProfilePicture called with:', { fileName: file.name, fileSize: file.size, userId });
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  // Validate file size (max 1MB for base64 storage in Firestore)
  const maxSize = 1 * 1024 * 1024; // 1MB max
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 1MB for profile pictures.');
  }

  try {
    // Convert file to base64 data URL
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.log('Image converted to base64, length:', dataURL.length);
    
    // Store base64 data in Firestore
    const { db } = await import('./config');
    if (db) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', userId), { 
        avatarData: dataURL,
        updatedAt: Date.now() 
      }, { merge: true });
      console.log('Base64 image stored in Firestore');
    }
    
    // Return a short reference URL instead of the long base64 string
    return `firestore://users/${userId}/avatar`;
  } catch (error) {
    console.error('Upload error details:', error);
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
  console.log('Profile picture cleanup (no-op for base64/external URLs)');
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
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.uid), { 
      displayName,
      updatedAt: Date.now() 
    }, { merge: true });
  }
}
