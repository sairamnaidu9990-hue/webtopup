import { NextResponse } from "next/server";
import { clearCustomerTokenCookie } from "@/lib/customerSession";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout berhasil",
  });

  clearCustomerTokenCookie(response);
  return response;
}
