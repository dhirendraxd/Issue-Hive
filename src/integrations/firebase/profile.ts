import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage, auth } from './config';
import type { User } from 'firebase/auth';
import { getDefaultAvatarUrl, type AvatarStyleId } from '@/lib/avatar';

/**
 * Upload a custom profile picture to Firebase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns The download URL of the uploaded image
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured');
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Create a reference to the storage location
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile-${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

/**
 * Update user's profile picture in Firebase Auth
 * @param user - The current user
 * @param photoURL - The new photo URL
 */
export async function updateUserProfilePicture(user: User, photoURL: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured');
  }

  await updateProfile(user, { photoURL });
}

/**
 * Set a default avatar for the user
 * @param user - The current user
 * @param style - The avatar style to use
 */
export async function setDefaultAvatar(user: User, style: AvatarStyleId): Promise<void> {
  const photoURL = getDefaultAvatarUrl(user.uid, style);
  await updateUserProfilePicture(user, photoURL);
}

/**
 * Delete the user's custom profile picture from storage
 * @param photoURL - The URL of the photo to delete
 */
export async function deleteProfilePicture(photoURL: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured');
  }

  // Only delete if it's a Firebase Storage URL
  if (!photoURL.includes('firebasestorage.googleapis.com')) {
    return; // Don't try to delete external URLs (like DiceBear)
  }

  try {
    const storageRef = ref(storage, photoURL);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete profile picture:', error);
    // Don't throw - it's OK if deletion fails
  }
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
}
