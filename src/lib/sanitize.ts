/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML by escaping special characters
 * Prevents XSS attacks in user-generated content
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize text for display (basic cleanup)
 * Removes null bytes, control characters, and normalizes whitespace
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.trim().toLowerCase();
  
  return emailPattern.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize URLs to prevent javascript: and data: schemes
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  const cleaned = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript):/i;
  if (dangerousProtocols.test(cleaned)) {
    return '';
  }
  
  // Only allow http, https, mailto
  const safeProtocols = /^(https?|mailto):/i;
  if (!safeProtocols.test(cleaned) && !cleaned.startsWith('/')) {
    return '';
  }
  
  return cleaned;
}

/**
 * Validate file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  return fileName
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .trim();
}

/**
 * Limit string length to prevent DoS via large inputs
 */
export function limitLength(input: string, maxLength: number): string {
  if (!input) return '';
  return input.slice(0, maxLength);
}

/**
 * Check if string contains only safe characters
 * Useful for usernames, display names, etc.
 */
export function isSafeString(input: string): boolean {
  if (!input) return false;
  
  // Allow alphanumeric, spaces, and common safe characters
  const safePattern = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=]+$/;
  return safePattern.test(input);
}
