const explicitBackendWebSocketUrl =
  process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim() || "";

function normalizeWebSocketUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/ws") ? trimmed : `${trimmed}/ws`;
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function deriveProductionApiHost(hostname: string) {
  const normalized = String(hostname || "").trim().toLowerCase();

  if (!normalized) {
    return "api.kitagg.com";
  }

  if (normalized.startsWith("api.")) {
    return normalized;
  }

  const parts = normalized.split(".").filter(Boolean);

  if (parts.length >= 2) {
    return `api.${parts.slice(-2).join(".")}`;
  }

  return `api.${normalized}`;
}

export function getBackendWebSocketUrl() {
  if (explicitBackendWebSocketUrl) {
    return normalizeWebSocketUrl(explicitBackendWebSocketUrl);
  }

  if (typeof window === "undefined") {
    return "ws://127.0.0.1:4000/ws";
  }

  const { protocol, hostname } = window.location;

  if (isLocalHost(hostname)) {
    return "ws://127.0.0.1:4000/ws";
  }

  const websocketProtocol = protocol === "https:" ? "wss" : "ws";
  return `${websocketProtocol}://${deriveProductionApiHost(hostname)}/ws`;
}
