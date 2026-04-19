import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api";
import {
  ADMIN_LAST_ACTIVE_COOKIE_NAME,
  ADMIN_TOKEN_COOKIE_NAME,
  clearAdminSessionCookies,
  isAdminSessionIdle,
  touchAdminLastActiveCookie,
} from "@/lib/adminSession";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value;
    const lastActive = req.cookies.get(ADMIN_LAST_ACTIVE_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (isAdminSessionIdle(lastActive)) {
      const response = NextResponse.json(
        {
          message: "Sesi admin berakhir karena tidak ada aktivitas",
          reason: "session-expired",
        },
        { status: 401 }
      );
      clearAdminSessionCookies(response);
      return response;
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();

    const response = NextResponse.json(data, { status: backendRes.status });

    if (backendRes.ok) {
      touchAdminLastActiveCookie(response);
    } else if (backendRes.status === 401 || backendRes.status === 403) {
      clearAdminSessionCookies(response);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
