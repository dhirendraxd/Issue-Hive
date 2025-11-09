import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Relative time formatter (fallback implementation without Intl.RelativeTimeFormat for broad compatibility)
// Converts a timestamp (ms since epoch or Date) into human-friendly strings: "just now", "5m ago", "2h ago", "3d ago", "2mo ago", "1y ago".
export function formatRelativeTime(input: number | Date): string {
  const now = Date.now();
  const ts = input instanceof Date ? input.getTime() : input;
  const diffMs = Math.max(0, now - ts);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return sec + 's ago';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + 'm ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h ago';
  const day = Math.floor(hr / 24);
  if (day < 30) return day + 'd ago';
  const month = Math.floor(day / 30);
  if (month < 12) return month + 'mo ago';
  const year = Math.floor(month / 12);
  return year + 'y ago';
}
