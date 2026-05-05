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

type ForwardAdminRequestOptions = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

function authorizeAdminRequest(req: NextRequest) {
  const token = getAdminToken(req);
  const lastActive = getAdminLastActive(req);

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
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
    return {
      ok: false as const,
      response,
    };
  }

  return {
    ok: true as const,
    token,
  };
}

async function dispatchAdminRequest(
  token: string,
  options: ForwardAdminRequestOptions
) {
  return fetch(`${BACKEND_URL}${options.endpoint}`, {
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
}

async function logQueuedAdminRequestResult(
  endpoint: string,
  response: Response
) {
  if (response.ok) {
    return;
  }

  const payload = await parseBackendJson(response);
  console.error("Queued admin request failed", {
    endpoint,
    status: response.status,
    payload,
  });
}

export async function forwardAdminRequest(
  req: NextRequest,
  options: ForwardAdminRequestOptions
) {
  const authorization = authorizeAdminRequest(req);

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const response = await dispatchAdminRequest(authorization.token, options);

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

export function queueAdminRequest(
  req: NextRequest,
  options: ForwardAdminRequestOptions & {
    acceptedMessage?: string;
  }
) {
  const authorization = authorizeAdminRequest(req);

  if (!authorization.ok) {
    return authorization.response;
  }

  setImmediate(() => {
    void dispatchAdminRequest(authorization.token, options)
      .then((response) =>
        logQueuedAdminRequestResult(options.endpoint, response)
      )
      .catch((error) => {
        console.error("Queued admin request crashed", {
          endpoint: options.endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
  });

  const response = NextResponse.json(
    {
      queued: true,
      message:
        options.acceptedMessage ||
        "Permintaan sedang diproses di background.",
    },
    { status: 202 }
  );

  touchAdminLastActiveCookie(response);
  return response;
}
