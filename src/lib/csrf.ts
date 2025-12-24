/**
 * CSRF Protection Utilities
 * Generate and validate CSRF tokens for sensitive operations
 */

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.warn('Failed to store CSRF token:', error);
  }
}

/**
 * Retrieve CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.warn('Failed to retrieve CSRF token:', error);
    return null;
  }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.warn('Failed to clear CSRF token:', error);
  }
}

/**
 * Initialize CSRF token for the session
 */
export function initializeCSRFToken(): string {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    storeCSRFToken(token);
  }
  return token;
}
