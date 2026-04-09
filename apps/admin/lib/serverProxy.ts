import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api";

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
  return req.cookies.get("admin_token")?.value || "";
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

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

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
  return NextResponse.json(data, { status: response.status });
}
