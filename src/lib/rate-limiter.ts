/**
 * Simple client-side rate limiter to prevent abuse
 * Note: This is client-side only and can be bypassed. 
 * For production, implement server-side rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited
 * @param key - Unique key for the action (e.g., 'create-issue', 'vote')
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);

  // No entry or window expired - allow and reset
  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  // Within window - check count
  if (entry.count >= maxAttempts) {
    return true; // Rate limited
  }

  // Increment count
  entry.count++;
  return false;
}

/**
 * Get remaining time until rate limit resets
 * @param key - Unique key for the action
 * @returns Milliseconds until reset, or 0 if not rate limited
 */
export function getRateLimitResetTime(key: string): number {
  const entry = rateLimits.get(key);
  if (!entry) return 0;
  
  const now = Date.now();
  if (now > entry.resetTime) return 0;
  
  return entry.resetTime - now;
}

/**
 * Clear rate limit for a specific key
 * @param key - Unique key for the action
 */
export function clearRateLimit(key: string): void {
  rateLimits.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimits.clear();
}
