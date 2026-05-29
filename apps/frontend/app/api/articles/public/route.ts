import { NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const queryString = url.searchParams.toString();
    const endpoint = queryString
      ? `${BACKEND_API_BASE}/api/articles/public?${queryString}`
      : `${BACKEND_API_BASE}/api/articles/public`;

    const response = await fetch(endpoint, {
      next: {
        revalidate: 120,
      },
    });
    const payload = await response.json().catch(() => ({
      items: [],
      page: 1,
      limit: 6,
      totalItems: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        items: [],
        page: 1,
        limit: 6,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        message: "Backend artikel tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}
