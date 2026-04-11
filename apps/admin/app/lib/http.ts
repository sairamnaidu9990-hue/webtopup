export async function parseJsonSafely<T = unknown>(
  response: Response
): Promise<T | null> {
  const rawText = await response.text().catch(() => "");

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    return null;
  }
}

export function getResponseMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
}
