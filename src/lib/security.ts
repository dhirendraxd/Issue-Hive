/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Note: React already escapes content by default, but this provides
 * an additional layer of protection for edge cases
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any potential script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any potential event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate and sanitize URL inputs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate string length
 */
export function validateLength(
  input: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  const length = input.trim().length;
  
  if (length < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }
  
  if (length > max) {
    return { valid: false, error: `Must be no more than ${max} characters` };
  }
  
  return { valid: true };
}

/**
 * Check for common injection patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting utility using localStorage
 */
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export class RateLimiter {
  private storageKey: string;
  private config: RateLimitConfig;
  
  constructor(action: string, config: RateLimitConfig) {
    this.storageKey = `rate_limit_${action}`;
    this.config = config;
  }
  
  /**
   * Check if action is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    const stored = this.getAttempts();
    
    // Filter out attempts outside the time window
    const recentAttempts = stored.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    
    // Update storage
    if (recentAttempts.length < stored.length) {
      this.setAttempts(recentAttempts);
    }
    
    return recentAttempts.length < this.config.maxAttempts;
  }
  
  /**
   * Record an attempt
   */
  recordAttempt(): void {
    const now = Date.now();
    const attempts = this.getAttempts();
    attempts.push(now);
    this.setAttempts(attempts);
  }
  
  /**
   * Reset rate limit
   */
  reset(): void {
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(): number {
    const now = Date.now();
    const stored = this.getAttempts();
    const recentAttempts = stored.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    return Math.max(0, this.config.maxAttempts - recentAttempts.length);
  }
  
  /**
   * Get time until reset (ms)
   */
  getTimeUntilReset(): number {
    const now = Date.now();
    const stored = this.getAttempts();
    
    if (stored.length === 0) return 0;
    
    const oldestAttempt = Math.min(...stored);
    const resetTime = oldestAttempt + this.config.windowMs;
    
    return Math.max(0, resetTime - now);
  }
  
  private getAttempts(): number[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  private setAttempts(attempts: number[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(attempts));
    } catch (error) {
      console.error('Failed to store rate limit data:', error);
    }
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle function for rapid actions
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= limitMs) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Validate issue data before submission
 */
export function validateIssueData(data: {
  title: string;
  description: string;
  category: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Title validation
  const titleValidation = validateLength(data.title, 1, 200);
  if (!titleValidation.valid) {
    errors.push(`Title: ${titleValidation.error}`);
  }
  
  if (containsSuspiciousPatterns(data.title)) {
    errors.push('Title contains suspicious content');
  }
  
  // Description validation
  const descValidation = validateLength(data.description, 1, 5000);
  if (!descValidation.valid) {
    errors.push(`Description: ${descValidation.error}`);
  }
  
  if (containsSuspiciousPatterns(data.description)) {
    errors.push('Description contains suspicious content');
  }
  
  // Category validation
  const validCategories = ['Facilities', 'Academics', 'Administration', 'Events', 'Other'];
  if (!validCategories.includes(data.category)) {
    errors.push('Invalid category');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate comment data before submission
 */
export function validateCommentData(content: string): { valid: boolean; error?: string } {
  const validation = validateLength(content, 1, 2000);
  
  if (!validation.valid) {
    return validation;
  }
  
  if (containsSuspiciousPatterns(content)) {
    return { valid: false, error: 'Comment contains suspicious content' };
  }
  
  return { valid: true };
}
