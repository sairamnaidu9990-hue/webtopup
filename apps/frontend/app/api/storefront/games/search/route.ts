import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "8";

  try {
    const response = await fetch(
      `${API_BASE}/api/games/storefront/search?q=${encodeURIComponent(
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
