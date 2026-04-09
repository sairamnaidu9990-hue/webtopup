"use client";

export type SessionCacheEntry<T> = {
  data: T;
  savedAt: number;
};

export function readSessionCache<T>(key: string): SessionCacheEntry<T> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as SessionCacheEntry<T>;
  } catch (error) {
    console.error("Session cache read error:", error);
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: SessionCacheEntry<T> = {
      data,
      savedAt: Date.now(),
    };

    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error("Session cache write error:", error);
  }
}

export function isSessionCacheFresh(savedAt: number, maxAgeMs: number) {
  return Date.now() - savedAt <= maxAgeMs;
}
