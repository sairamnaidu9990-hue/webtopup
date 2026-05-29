import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/runtimeConfig";
import { CUSTOMER_TOKEN_COOKIE_NAME, clearCustomerTokenCookie } from "@/lib/customerSession";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_TOKEN_COOKIE_NAME)?.value || "";

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${BACKEND_API_BASE}/api/customer-rewards/redeem-promo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
