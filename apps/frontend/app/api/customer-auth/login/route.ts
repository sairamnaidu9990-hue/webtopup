import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_BASE } from "@/lib/runtimeConfig";
import { setCustomerTokenCookie } from "@/lib/customerSession";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${BACKEND_API_BASE}/api/customer-auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({
      message: "Respons backend tidak valid",
    }));

    if (!response.ok || !payload?.token) {
      return NextResponse.json(
        { message: payload?.message || "Login gagal" },
        { status: response.status }
      );
    }

    const nextResponse = NextResponse.json(
      {
        message: payload.message || "Login berhasil",
        customer: payload.customer,
      },
      { status: 200 }
    );

    setCustomerTokenCookie(nextResponse, payload.token);
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
