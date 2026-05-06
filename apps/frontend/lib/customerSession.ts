import type { NextResponse } from "next/server";

export const CUSTOMER_TOKEN_COOKIE_NAME = "customer_token";
export const CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setCustomerTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(CUSTOMER_TOKEN_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearCustomerTokenCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_TOKEN_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}
