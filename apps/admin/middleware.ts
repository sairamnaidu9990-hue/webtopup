import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login";
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admins") ||
    pathname.startsWith("/payment-methods") ||
    pathname.startsWith("/website-settings") ||
    pathname.startsWith("/provider-control") ||
    pathname.startsWith("/games") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/variants") ||
    pathname.startsWith("/orders");

  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admins/:path*",
    "/payment-methods/:path*",
    "/website-settings/:path*",
    "/dashboard/:path*",
    "/provider-control/:path*",
    "/games/:path*",
    "/products/:path*",
    "/variants/:path*",
    "/orders/:path*",
  ],
};
