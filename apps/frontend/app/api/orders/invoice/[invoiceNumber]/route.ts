import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

type RouteContext = {
  params: Promise<{
    invoiceNumber: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { invoiceNumber } = await context.params;
  const normalizedInvoiceNumber = String(invoiceNumber || "")
    .trim()
    .toUpperCase();

  if (!normalizedInvoiceNumber) {
    return NextResponse.json(
      {
        message: "Nomor invoice tidak valid",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_API_BASE}/api/orders/invoice/${encodeURIComponent(
        normalizedInvoiceNumber
      )}`,
      {
        cache: "no-store",
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
