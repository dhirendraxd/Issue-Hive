/**
 * Profile picture utilities for managing user avatars
 * Supports custom uploads and default avatar selection
 */

import { db } from '@/integrations/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// Cache for resolved avatar URLs to avoid repeated Firestore reads
const avatarCache = new Map<string, string>();

/**
 * Resolve a photoURL to an actual displayable URL
 * Handles firestore:// references by fetching the actual base64 data
 */
export async function resolveAvatarUrl(photoURL: string | null | undefined, userId: string): Promise<string> {
  // If no photoURL, return default avatar
  if (!photoURL) {
    return getUserAvatarUrl(userId);
  }

  // If it's already a data URL or http URL, return as-is
  if (photoURL.startsWith('data:') || photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
    return photoURL;
  }

  // If it's a firestore:// reference, fetch the actual data
  if (photoURL.startsWith('firestore://')) {
    // Check cache first
    if (avatarCache.has(photoURL)) {
      return avatarCache.get(photoURL)!;
    }

    try {
      if (!db) {
        console.warn('Firestore not configured, using default avatar');
        return getUserAvatarUrl(userId);
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.avatarData) {
          // Cache the resolved URL
          avatarCache.set(photoURL, data.avatarData);
          return data.avatarData;
        }
      }
    } catch (error) {
      console.error('Failed to resolve firestore avatar URL:', error);
    }
  }

  // Fallback to default avatar
  return getUserAvatarUrl(userId);
}

/**
 * Synchronous version that returns cached value or default
 * Use this in components that can't handle async
 */
export function getResolvedAvatarUrlSync(photoURL: string | null | undefined, userId: string): string {
  if (!photoURL) {
    return getUserAvatarUrl(userId);
  }

  if (photoURL.startsWith('data:') || photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
    return photoURL;
  }

  if (photoURL.startsWith('firestore://')) {
    // Return cached value if available, otherwise return default
    return avatarCache.get(photoURL) || getUserAvatarUrl(userId);
  }

  return getUserAvatarUrl(userId);
}

// Default avatar styles available for selection
export const DEFAULT_AVATAR_STYLES = [
  { id: 'adventurer', label: 'Adventurer', description: 'Illustrated adventure characters' },
  { id: 'avataaars', label: 'Avataaars', description: 'Diverse avatar illustrations' },
  { id: 'big-smile', label: 'Big Smile', description: 'Friendly, smiling faces' },
  { id: 'personas', label: 'Personas', description: 'Professional personas' },
  { id: 'micah', label: 'Micah', description: 'Minimalist geometric avatars' },
  { id: 'bottts', label: 'Bottts', description: 'Cute robot avatars' },
  { id: 'fun-emoji', label: 'Fun Emoji', description: 'Colorful emoji faces' },
  { id: 'lorelei', label: 'Lorelei', description: 'Elegant illustrated portraits' },
] as const;

export type AvatarStyleId = typeof DEFAULT_AVATAR_STYLES[number]['id'];

/**
 * Generate a DiceBear avatar URL with the specified style
 */
export function getDefaultAvatarUrl(userId: string, style: AvatarStyleId = 'adventurer'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(userId)}`;
}

/**
 * Get avatar preview URLs for all available styles
 */
export function getAvatarPreviews(userId: string): Array<{ style: AvatarStyleId; url: string; label: string }> {
  return DEFAULT_AVATAR_STYLES.map(({ id, label }) => ({
    style: id,
    url: getDefaultAvatarUrl(userId, id),
    label,
  }));
}

/**
 * Generate a consistent avatar URL for a user using DiceBear API
 * Uses "adventurer" style which provides diverse, student-friendly avatars
 */
export function getUserAvatarUrl(userId: string, seed?: string): string {
  // Use user ID or seed to ensure consistency
  const avatarSeed = seed || userId;
  
  // DiceBear Adventurer style - great for student profiles
  // Other good options: 'avataaars', 'big-smile', 'micah', 'personas'
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`;
}

/**
 * Alternative styles for variety:
 * - adventurer: Illustrated adventure characters
 * - avataaars: Diverse avatar illustrations
 * - big-smile: Friendly, smiling faces
 * - personas: Professional personas
 * - micah: Minimalist geometric avatars
 */
export function getUserAvatarWithStyle(
  userId: string, 
  style: 'adventurer' | 'avataaars' | 'big-smile' | 'personas' | 'micah' = 'adventurer',
  seed?: string
): string {
  const avatarSeed = seed || userId;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarSeed)}`;
}
