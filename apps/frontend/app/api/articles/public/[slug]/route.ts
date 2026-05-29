import { NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const response = await fetch(
      `${BACKEND_API_BASE}/api/articles/public/${encodeURIComponent(slug)}`,
      {
        next: {
          revalidate: 120,
        },
      }
    );

    const payload = await response.json().catch(() => ({
      item: null,
      message: "Respons artikel tidak valid",
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        item: null,
        message: "Backend artikel tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}
