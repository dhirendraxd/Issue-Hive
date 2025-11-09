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
