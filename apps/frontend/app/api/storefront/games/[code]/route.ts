import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!normalizedCode) {
    return NextResponse.json(
      {
        message: "Kode game tidak valid",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/games/storefront/${encodeURIComponent(
        normalizedCode
      )}`,
      {
        next: {
          revalidate: 60,
        },
      }
    );

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

