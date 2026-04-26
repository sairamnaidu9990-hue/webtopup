import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();
    const endpoint = queryString
      ? `${BACKEND_API_BASE}/api/promo-codes/public?${queryString}`
      : `${BACKEND_API_BASE}/api/promo-codes/public`;
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({
      message: "Respons backend tidak valid",
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Backend tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}
