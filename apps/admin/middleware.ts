import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_LAST_ACTIVE_COOKIE_NAME,
  ADMIN_TOKEN_COOKIE_NAME,
  clearAdminSessionCookies,
  getAdminSessionExpiredLoginUrl,
  isAdminSessionIdle,
  touchAdminLastActiveCookie,
} from "./lib/adminSession";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value;
  const lastActive = req.cookies.get(ADMIN_LAST_ACTIVE_COOKIE_NAME)?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login";
  const isProtectedPage = !isAuthPage;

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isAdminSessionIdle(lastActive)) {
    const response = isProtectedPage
      ? NextResponse.redirect(getAdminSessionExpiredLoginUrl(req.url))
      : NextResponse.next();

    clearAdminSessionCookies(response);
    return response;
  }

  if (token && isAuthPage) {
    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    touchAdminLastActiveCookie(response);
    return response;
  }

  const response = NextResponse.next();

  if (token && (isProtectedPage || isAuthPage)) {
    touchAdminLastActiveCookie(response);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/admins/:path*",
    "/monitoring/:path*",
    "/payment-methods/:path*",
    "/website-settings/:path*",
    "/provider-control/:path*",
    "/games/:path*",
    "/products/:path*",
    "/variants/:path*",
    "/orders/:path*",
    "/customers/:path*",
    "/reviews/:path*",
    "/promo-codes/:path*",
    "/team-chat/:path*",
    "/workspace/:path*",
  ],
};
