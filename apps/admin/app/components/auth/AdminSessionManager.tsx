"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ADMIN_ACTIVITY_EVENT_THROTTLE_MS,
  ADMIN_ACTIVITY_WRITE_INTERVAL_MS,
  ADMIN_IDLE_TIMEOUT_MS,
  ADMIN_LAST_ACTIVE_COOKIE_NAME,
  ADMIN_LAST_ACTIVE_STORAGE_KEY,
  ADMIN_LOGOUT_BROADCAST_KEY,
  ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS,
  broadcastAdminActivity,
  broadcastAdminLogout,
} from "@/lib/adminSession";

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeLastActiveCookie(at: number) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";

  document.cookie = `${ADMIN_LAST_ACTIVE_COOKIE_NAME}=${encodeURIComponent(
    String(at)
  )}; path=/; max-age=${ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS}; samesite=strict${secure}`;
}

export default function AdminSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<number | null>(null);
  const logoutInProgressRef = useRef(false);
  const lastPersistedRef = useRef(0);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    async function handleSessionExpired() {
      if (logoutInProgressRef.current) {
        return;
      }

      logoutInProgressRef.current = true;
      broadcastAdminLogout();

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // Tetap lanjut ke login walau request logout gagal.
      }

      router.replace("/login?reason=session-expired");
      router.refresh();
    }

    function clearExistingTimeout() {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function scheduleExpiration(activityAt: number) {
      clearExistingTimeout();

      const remainingMs = Math.max(
        ADMIN_IDLE_TIMEOUT_MS - (Date.now() - activityAt),
        0
      );

      timeoutRef.current = window.setTimeout(() => {
        void handleSessionExpired();
      }, remainingMs);
    }

    function persistActivity(activityAt: number, force = false) {
      if (
        !force &&
        activityAt - lastPersistedRef.current < ADMIN_ACTIVITY_WRITE_INTERVAL_MS
      ) {
        return;
      }

      lastPersistedRef.current = activityAt;
      writeLastActiveCookie(activityAt);
      broadcastAdminActivity(activityAt);
    }

    function touchActivity(activityAt = Date.now(), forcePersist = false) {
      scheduleExpiration(activityAt);
      persistActivity(activityAt, forcePersist);
    }

    function resolveInitialActivity() {
      const storageValue = window.localStorage.getItem(
        ADMIN_LAST_ACTIVE_STORAGE_KEY
      );
      const cookieValue = getCookieValue(ADMIN_LAST_ACTIVE_COOKIE_NAME);
      const storageAt = Number.parseInt(storageValue || "", 10);
      const cookieAt = Number.parseInt(cookieValue || "", 10);
      const candidates = [storageAt, cookieAt].filter(
        (value) => Number.isFinite(value) && value > 0
      );

      if (candidates.length === 0) {
        return Date.now();
      }

      return Math.max(...candidates);
    }

    const initialActivityAt = resolveInitialActivity();

    if (Date.now() - initialActivityAt > ADMIN_IDLE_TIMEOUT_MS) {
      void handleSessionExpired();
      return () => undefined;
    }

    touchActivity(Date.now(), true);

    function handleUserActivity() {
      const now = Date.now();

      if (
        now - lastInteractionRef.current <
        ADMIN_ACTIVITY_EVENT_THROTTLE_MS
      ) {
        scheduleExpiration(now);
        return;
      }

      lastInteractionRef.current = now;
      touchActivity(now);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        handleUserActivity();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === ADMIN_LAST_ACTIVE_STORAGE_KEY &&
        typeof event.newValue === "string"
      ) {
        const syncedAt = Number.parseInt(event.newValue, 10);

        if (Number.isFinite(syncedAt) && syncedAt > 0) {
          scheduleExpiration(syncedAt);
          writeLastActiveCookie(syncedAt);
        }
      }

      if (
        event.key === ADMIN_LOGOUT_BROADCAST_KEY &&
        typeof event.newValue === "string" &&
        pathname !== "/login"
      ) {
        router.replace("/login");
        router.refresh();
      }
    }

    const passiveOptions = { passive: true } as AddEventListenerOptions;

    window.addEventListener("mousemove", handleUserActivity, passiveOptions);
    window.addEventListener("mousedown", handleUserActivity, passiveOptions);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity, passiveOptions);
    window.addEventListener("touchstart", handleUserActivity, passiveOptions);
    window.addEventListener("focus", handleUserActivity);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearExistingTimeout();
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("focus", handleUserActivity);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
