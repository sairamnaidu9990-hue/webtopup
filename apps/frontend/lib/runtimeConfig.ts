import { headers } from "next/headers";

export const BACKEND_API_BASE =
  process.env.BACKEND_URL || "http://localhost:4000";

export async function getFrontendAppUrl(): Promise<string> {
  try {
    const headerStore = await headers();
    const host =
      headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
    const proto =
      headerStore.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Fallback to env-based URL below when request headers are unavailable.
  }

  return process.env.FRONTEND_URL || "http://localhost:3000";
}

export async function buildFrontendApiUrl(path: string): Promise<string> {
  return new URL(path, await getFrontendAppUrl()).toString();
}
