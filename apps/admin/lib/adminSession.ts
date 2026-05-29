import type { NextResponse } from "next/server";

export const ADMIN_TOKEN_COOKIE_NAME = "admin_token";
export const ADMIN_LAST_ACTIVE_COOKIE_NAME = "admin_last_active";
export const ADMIN_LAST_ACTIVE_STORAGE_KEY = "admin:last-active";
export const ADMIN_LOGOUT_BROADCAST_KEY = "admin:logout-broadcast";

export const ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const ADMIN_IDLE_TIMEOUT_MS = getPositiveNumber(
  process.env.NEXT_PUBLIC_ADMIN_IDLE_TIMEOUT_MS,
  3 * 60 * 60 * 1000
);
export const ADMIN_ACTIVITY_WRITE_INTERVAL_MS = 60 * 1000;
export const ADMIN_ACTIVITY_EVENT_THROTTLE_MS = 15 * 1000;

function getPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getCookieOptions(httpOnly: boolean) {
  const maxAge = ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS;

  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  };
}

export function setAdminTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_TOKEN_COOKIE_NAME, token, {
    ...getCookieOptions(true),
    priority: "high",
  });
}

export function touchAdminLastActiveCookie(
  response: NextResponse,
  value = Date.now()
) {
  response.cookies.set(ADMIN_LAST_ACTIVE_COOKIE_NAME, String(value), {
    ...getCookieOptions(false),
    priority: "high",
  });
}

export function clearAdminSessionCookies(response: NextResponse) {
  response.cookies.set(ADMIN_TOKEN_COOKIE_NAME, "", {
    ...getCookieOptions(true),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(ADMIN_LAST_ACTIVE_COOKIE_NAME, "", {
    ...getCookieOptions(false),
    maxAge: 0,
    expires: new Date(0),
  });
}

export function parseAdminLastActive(
  value: string | null | undefined
): number | null {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function isAdminSessionIdle(
  value: string | null | undefined,
  now = Date.now()
) {
  const parsed = parseAdminLastActive(value);

  if (!parsed) {
    return false;
  }

  return now - parsed > ADMIN_IDLE_TIMEOUT_MS;
}

export function getAdminSessionExpiredLoginUrl(requestUrl: string) {
  const nextUrl = new URL("/login", requestUrl);
  nextUrl.searchParams.set("reason", "session-expired");
  return nextUrl;
}

export function broadcastAdminActivity(at = Date.now()) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_LAST_ACTIVE_STORAGE_KEY, String(at));
}

export function broadcastAdminLogout(at = Date.now()) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_LAST_ACTIVE_STORAGE_KEY);
  window.localStorage.setItem(ADMIN_LOGOUT_BROADCAST_KEY, String(at));
}
