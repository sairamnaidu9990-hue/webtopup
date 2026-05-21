import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

const VISITOR_SESSION_COOKIE = "kitagg_visitor_id";
const VISITOR_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function createVisitorSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingSessionId =
      request.cookies.get(VISITOR_SESSION_COOKIE)?.value?.trim() || "";
    const sessionId = existingSessionId || createVisitorSessionId();

    const response = await fetch(`${BACKEND_API_BASE}/api/analytics/pageview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        ...body,
        sessionId,
        userAgent: request.headers.get("user-agent") || "",
      }),
    });

    const payload = await response.json().catch(() => ({
      tracked: false,
      message: "Respons tracking visitor tidak valid",
    }));

    const nextResponse = NextResponse.json(payload, {
      status: response.status,
    });

    if (!existingSessionId) {
      nextResponse.cookies.set(VISITOR_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_SESSION_MAX_AGE_SECONDS,
      });
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        tracked: false,
        message: "Tracking visitor gagal diproses",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
