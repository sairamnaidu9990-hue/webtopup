"use client";

export type SessionCacheEntry<T> = {
  data: T;
  savedAt: number;
};

const memoryCache = new Map<string, SessionCacheEntry<unknown>>();
const ADMIN_CACHE_PREFIX = "admin:";
const MAX_SESSION_CACHE_BYTES = 350_000;

function getSerializedByteSize(value: string) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }

  return value.length * 2;
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function pruneAdminSessionStorage(excludeKey?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const removableKeys: string[] = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);

    if (
      key &&
      key.startsWith(ADMIN_CACHE_PREFIX) &&
      key !== excludeKey
    ) {
      removableKeys.push(key);
    }
  }

  removableKeys.forEach((key) => {
    window.sessionStorage.removeItem(key);
  });
}

export function readSessionCache<T>(key: string): SessionCacheEntry<T> | null {
  const memoryValue = memoryCache.get(key);

  if (memoryValue) {
    return memoryValue as SessionCacheEntry<T>;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as SessionCacheEntry<T>;
    memoryCache.set(key, parsed as SessionCacheEntry<unknown>);
    return parsed;
  } catch (error) {
    console.error("Session cache read error:", error);
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T) {
  const payload: SessionCacheEntry<T> = {
    data,
    savedAt: Date.now(),
  };

  memoryCache.set(key, payload as SessionCacheEntry<unknown>);

  if (typeof window === "undefined") {
    return;
  }

  try {
    const serializedPayload = JSON.stringify(payload);

    if (getSerializedByteSize(serializedPayload) > MAX_SESSION_CACHE_BYTES) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, serializedPayload);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      try {
        pruneAdminSessionStorage(key);
        const serializedPayload = JSON.stringify(payload);

        if (getSerializedByteSize(serializedPayload) <= MAX_SESSION_CACHE_BYTES) {
          window.sessionStorage.setItem(key, serializedPayload);
        }
      } catch (retryError) {
        if (!isQuotaExceededError(retryError)) {
          console.error("Session cache write error:", retryError);
        }
      }

      return;
    }

    console.error("Session cache write error:", error);
  }
}

export function isSessionCacheFresh(savedAt: number, maxAgeMs: number) {
  return Date.now() - savedAt <= maxAgeMs;
}
