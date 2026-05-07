import { NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export const revalidate = 60;

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/api/payment-methods/public`, {
      next: {
        revalidate,
      },
    });

    const payload = await response.json().catch(() => ({
      items: [],
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        items: [],
        message: "Backend tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}

