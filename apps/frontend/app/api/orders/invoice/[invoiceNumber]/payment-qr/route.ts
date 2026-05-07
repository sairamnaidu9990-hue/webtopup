import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

type RouteContext = {
  params: Promise<{
    invoiceNumber: string;
  }>;
};

function getQrFileExtension(contentType: string) {
  const normalizedContentType = String(contentType || "").toLowerCase();

  if (normalizedContentType.includes("png")) {
    return "png";
  }

  if (normalizedContentType.includes("jpeg") || normalizedContentType.includes("jpg")) {
    return "jpg";
  }

  if (normalizedContentType.includes("webp")) {
    return "webp";
  }

  if (normalizedContentType.includes("svg")) {
    return "svg";
  }

  return "png";
}

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
    const orderResponse = await fetch(
      `${BACKEND_API_BASE}/api/orders/invoice/${encodeURIComponent(
        normalizedInvoiceNumber
      )}`,
      {
        cache: "no-store",
      }
    );

    const orderPayload = await orderResponse.json().catch(() => null);

    if (!orderResponse.ok) {
      return NextResponse.json(
        {
          message: orderPayload?.message || "Gagal mengambil invoice",
        },
        {
          status: orderResponse.status,
        }
      );
    }

    const qrLink = String(orderPayload?.order?.paymentGateway?.qrLink || "").trim();

    if (!qrLink) {
      return NextResponse.json(
        {
          message: "QR pembayaran belum tersedia",
        },
        {
          status: 404,
        }
      );
    }

    const qrResponse = await fetch(qrLink, {
      cache: "no-store",
    });

    if (!qrResponse.ok) {
      return NextResponse.json(
        {
          message: "Gagal mengambil gambar QR",
        },
        {
          status: 502,
        }
      );
    }

    const contentType = qrResponse.headers.get("content-type") || "image/png";
    const fileExtension = getQrFileExtension(contentType);
    const qrBytes = await qrResponse.arrayBuffer();

    return new NextResponse(qrBytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${normalizedInvoiceNumber}-qris.${fileExtension}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "QR pembayaran tidak dapat diunduh",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}
