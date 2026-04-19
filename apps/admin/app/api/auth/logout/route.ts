import { NextResponse } from "next/server";
import { clearAdminSessionCookies } from "@/lib/adminSession";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout berhasil",
  });

  clearAdminSessionCookies(response);

  return response;
}
