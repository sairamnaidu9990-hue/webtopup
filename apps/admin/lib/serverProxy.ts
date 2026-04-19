import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api";
import {
  ADMIN_LAST_ACTIVE_COOKIE_NAME,
  ADMIN_TOKEN_COOKIE_NAME,
  clearAdminSessionCookies,
  isAdminSessionIdle,
  touchAdminLastActiveCookie,
} from "@/lib/adminSession";

async function parseBackendJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {
      message: "Respons backend tidak valid",
    };
  }
}

export function getAdminToken(req: NextRequest) {
  return req.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value || "";
}

function getAdminLastActive(req: NextRequest) {
  return req.cookies.get(ADMIN_LAST_ACTIVE_COOKIE_NAME)?.value || "";
}

export async function forwardAdminRequest(
  req: NextRequest,
  options: {
    endpoint: string;
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  }
) {
  const token = getAdminToken(req);
  const lastActive = getAdminLastActive(req);

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

  try {
    const response = await fetch(`${BACKEND_URL}${options.endpoint}`, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined
          ? {
              "Content-Type": "application/json",
            }
          : {}),
      },
      ...(options.body !== undefined
        ? {
            body: JSON.stringify(options.body),
          }
        : {}),
      cache: "no-store",
    });

    const data = await parseBackendJson(response);
    const nextResponse = NextResponse.json(data, { status: response.status });

    if (response.ok) {
      touchAdminLastActiveCookie(nextResponse);
    } else if (response.status === 401 || response.status === 403) {
      clearAdminSessionCookies(nextResponse);
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        message: "Backend tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
