import { useEffect, useState } from 'react';

export default function DevPortalErrorProbe() {
  const [lastError, setLastError] = useState<string | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: ErrorEvent) => {
      const msg = e.message || (e.error && e.error.message) || '';
      if (/removeChild|NotFoundError/i.test(msg)) {
        console.warn('[PortalErrorProbe] Captured portal-related error:', msg, e.error);
        setLastError(msg);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);
  if (!import.meta.env.DEV) return null;
  return lastError ? (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 shadow">
      <p className="font-semibold mb-1">Portal Error Captured</p>
      <pre className="whitespace-pre-wrap break-words">{lastError}</pre>
      <p className="mt-1 text-[10px] opacity-70">Open dev tools console for stack trace.</p>
    </div>
  ) : null;
}
