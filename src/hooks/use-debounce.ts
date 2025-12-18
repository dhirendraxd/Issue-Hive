import { useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing a callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 2000ms)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 2000
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T;
}
