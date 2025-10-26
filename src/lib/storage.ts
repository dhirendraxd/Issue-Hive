import type { Issue } from "@/types/issue";

const STORAGE_KEY = "issuehive:issues";

export function loadIssues(): Issue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Issue[]) : [];
  } catch {
    return [];
  }
}

export function saveIssues(issues: Issue[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch {
    // Silently ignore storage failures (quota, privacy mode)
  }
}

export function seedIfEmpty(seed: Issue[]) {
  const existing = loadIssues();
  if (existing.length === 0) {
    saveIssues(seed);
  }
}
