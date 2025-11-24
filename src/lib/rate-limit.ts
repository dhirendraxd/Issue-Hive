/**
 * Client-side rate limiting to prevent spam and abuse
 * Note: This is client-side only. Server-side rate limiting should be implemented via Firebase Security Rules
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * Check if an action is rate limited
   * @param key - Unique identifier for the action (e.g., 'create-issue:userId')
   * @param maxAttempts - Maximum number of attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if action is allowed, false if rate limited
   */
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // No previous entry or window expired
    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return true;
    }
    
    // Within window
    if (entry.count < maxAttempts) {
      entry.count++;
      return true;
    }
    
    // Rate limited
    return false;
  }
  
  /**
   * Get remaining time until rate limit resets
   * @param key - Unique identifier for the action
   * @returns milliseconds until reset, or 0 if not limited
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetAt - now);
  }
  
  /**
   * Clear rate limit for a specific key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }
  
  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-configured rate limit checkers
export const rateLimits = {
  createIssue: (userId: string) => {
    // Max 5 issues per 10 minutes
    return rateLimiter.check(`create-issue:${userId}`, 5, 10 * 60 * 1000);
  },
  
  createComment: (userId: string) => {
    // Max 20 comments per 5 minutes
    return rateLimiter.check(`create-comment:${userId}`, 20, 5 * 60 * 1000);
  },
  
  vote: (userId: string) => {
    // Max 50 votes per minute
    return rateLimiter.check(`vote:${userId}`, 50, 60 * 1000);
  },
  
  updateProfile: (userId: string) => {
    // Max 5 profile updates per hour
    return rateLimiter.check(`update-profile:${userId}`, 5, 60 * 60 * 1000);
  },
  
  uploadImage: (userId: string) => {
    // Max 3 image uploads per 5 minutes
    return rateLimiter.check(`upload-image:${userId}`, 3, 5 * 60 * 1000);
  },
  
  getResetTime: (action: string, userId: string) => {
    return rateLimiter.getResetTime(`${action}:${userId}`);
  }
};

/**
 * Format milliseconds into human-readable time
 */
export function formatResetTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}
