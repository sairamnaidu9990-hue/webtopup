import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "8";

  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/games/storefront/search?q=${encodeURIComponent(
        search
      )}&limit=${encodeURIComponent(limit)}`,
      {
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({ items: [] }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        items: [],
      },
      {
        status: 200,
      }
    );
  }
}
