/**
 * Content Security Policy (CSP) Violation Reporter
 * Logs CSP violations for security monitoring
 */

export interface CSPViolationReport {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
}

/**
 * Setup CSP violation reporting
 */
export function setupCSPReporting(): void {
  if (typeof window === 'undefined') return;

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (e) => {
    const violation: CSPViolationReport = {
      'document-uri': e.documentURI,
      'violated-directive': e.violatedDirective,
      'effective-directive': e.effectiveDirective,
      'original-policy': e.originalPolicy,
      'blocked-uri': e.blockedURI,
      'source-file': e.sourceFile || undefined,
      'line-number': e.lineNumber || undefined,
      'column-number': e.columnNumber || undefined,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('[CSP Violation]', violation);
    }

    // In production, you could send this to your analytics/monitoring service
    // Example: sendToAnalytics('csp-violation', violation);
  });
}

/**
 * Validate that critical CSP directives are present
 */
export function validateCSP(): boolean {
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!meta) {
    console.warn('[Security] No CSP meta tag found. Ensure CSP is set via HTTP headers.');
    return false;
  }

  const policy = meta.getAttribute('content') || '';
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'img-src',
    'connect-src',
    'frame-ancestors',
  ];

  const missing = requiredDirectives.filter(directive => !policy.includes(directive));
  
  if (missing.length > 0) {
    console.warn('[Security] Missing CSP directives:', missing);
    return false;
  }

  return true;
}

/**
 * Check for common security misconfigurations
 */
export function checkSecurityHeaders(): void {
  if (typeof window === 'undefined') return;

  // These checks only work if headers are exposed via meta tags or other means
  // In a real app, you'd check these server-side

  console.info('[Security] Running client-side security checks...');

  // Check if running over HTTPS (except localhost)
  if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
    console.warn('[Security] Site should be served over HTTPS');
  }

  // Check for mixed content
  const hasMixedContent = Array.from(document.querySelectorAll('img, script, link')).some(
    element => {
      const src = element.getAttribute('src') || element.getAttribute('href') || '';
      return src.startsWith('http://') && window.location.protocol === 'https:';
    }
  );

  if (hasMixedContent) {
    console.warn('[Security] Detected mixed content (HTTP resources on HTTPS page)');
  }

  console.info('[Security] Client-side security checks complete');
}
