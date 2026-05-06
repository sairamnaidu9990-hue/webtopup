import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/runtimeConfig";
import { CUSTOMER_TOKEN_COOKIE_NAME, clearCustomerTokenCookie } from "@/lib/customerSession";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_TOKEN_COOKIE_NAME)?.value || "";

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_API_BASE}/api/customer-auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({
      message: "Respons backend tidak valid",
    }));
    const nextResponse = NextResponse.json(payload, { status: response.status });

    if (response.status === 401 || response.status === 403) {
      clearCustomerTokenCookie(nextResponse);
    }

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
