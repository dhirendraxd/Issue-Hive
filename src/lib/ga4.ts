import { useEffect } from 'react';

// GA4 event types
export type GA4Event = 
  | 'issue_reported'
  | 'issue_upvoted'
  | 'issue_downvoted'
  | 'issue_commented'
  | 'issue_shared'
  | 'campus_voice_engaged'
  | 'user_profile_viewed'
  | 'college_page_viewed'
  | 'search_performed'
  | 'signup_completed'
  | 'login_completed'
  | 'page_view';

type GtagCommand =
  | ['js', Date]
  | ['config', string, Record<string, unknown>]
  | ['event', GA4Event, Record<string, string | number | boolean>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagCommand) => void;
  }
}

// Initialize GA4
export function initializeGA4() {
  if (typeof window === 'undefined') return;

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-G0PB0KE0KL';
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: GtagCommand) {
    window.dataLayer?.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'G-G0PB0KE0KL', {
    page_path: window.location.pathname,
    page_title: document.title,
  });

  window.gtag = gtag;
}

// Track custom events
export function trackEvent(eventName: GA4Event, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    ...params,
    timestamp: new Date().toISOString(),
  });
}

// Track page views
export function trackPageView(pageName: string, pagePath: string) {
  trackEvent('page_view', {
    page_title: pageName,
    page_path: pagePath,
  });
}

// Hook for GA4 initialization
export function useGA4() {
  useEffect(() => {
    initializeGA4();
  }, []);

  return { trackEvent, trackPageView };
}
