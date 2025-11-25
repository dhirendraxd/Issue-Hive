import { useState, useEffect } from 'react';
import { resolveAvatarUrl, getUserAvatarUrl } from '@/lib/avatar';

/**
 * Hook to resolve and cache avatar URLs
 * Handles firestore:// references and fetches actual base64 data
 */
export function useAvatarUrl(photoURL: string | null | undefined, userId: string): string {
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => {
    // Return immediate value for non-firestore URLs
    if (!photoURL) return getUserAvatarUrl(userId);
    if (photoURL.startsWith('data:') || photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
      return photoURL;
    }
    // For firestore URLs, return default initially and resolve async
    return getUserAvatarUrl(userId);
  });

  useEffect(() => {
    let mounted = true;

    async function resolve() {
      const url = await resolveAvatarUrl(photoURL, userId);
      if (mounted) {
        setResolvedUrl(url);
      }
    }

    resolve();

    return () => {
      mounted = false;
    };
  }, [photoURL, userId]);

  return resolvedUrl;
}
