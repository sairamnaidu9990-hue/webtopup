const { WebSocketServer } = require("ws");
const { URL } = require("url");
const { logError, logInfo, logWarn } = require("../utils/appLogger");
const { verifyAdminRealtimeToken } = require("../utils/realtimeToken");

const ADMIN_ORDERS_CHANNEL = "admin.orders";
const ADMIN_TEAM_CHAT_CHANNEL = "admin.team-chat";
const ADMIN_SYNC_LOGS_CHANNEL = "admin.sync-logs";
const PUBLIC_RECENT_ORDERS_CHANNEL = "public.recent-orders";
const RECONNECTABLE_CLOSE_CODE = 1011;
const READY_STATE_OPEN = 1;

let websocketServer = null;
const clients = new Set();

function normalizeInvoiceNumber(value) {
  return String(value || "").trim().toUpperCase();
}

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== READY_STATE_OPEN) {
    return false;
  }

  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function sendClientError(client, message, code = "BAD_REQUEST") {
  safeSend(client.ws, {
    type: "error",
    code,
    message,
  });
}

function buildOrderRealtimePayload(order) {
  return {
    orderId: String(order?._id || ""),
    invoiceNumber: normalizeInvoiceNumber(order?.invoiceNumber),
    status: normalizeInvoiceNumber(order?.status),
    paymentStatus: normalizeInvoiceNumber(order?.paymentStatus),
    providerStatus: normalizeInvoiceNumber(order?.providerStatus),
    updatedAt: order?.updatedAt
      ? new Date(order.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

function buildAdminProfile(client) {
  if (!client?.adminId) {
    return null;
  }

  return {
    adminId: client.adminId,
    name: String(client.adminName || "").trim(),
    email: String(client.adminEmail || "").trim(),
    role: String(client.adminRole || "").trim(),
  };
}

function buildSyncLogRealtimePayload(syncLog) {
  return {
    id: String(syncLog?._id || ""),
    provider: String(syncLog?.provider || "").trim().toLowerCase(),
    action: String(syncLog?.action || "").trim(),
    status: String(syncLog?.status || "").trim().toUpperCase(),
    scope: String(syncLog?.scope || "").trim(),
    updatedAt: syncLog?.updatedAt
      ? new Date(syncLog.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

function buildOnlineAdminsPayload() {
  const uniqueAdmins = new Map();

  clients.forEach((client) => {
    if (!client.isAdminAuthenticated || !client.adminId) {
      return;
    }

    if (!uniqueAdmins.has(client.adminId)) {
      uniqueAdmins.set(client.adminId, buildAdminProfile(client));
    }
  });

  return Array.from(uniqueAdmins.values()).filter(Boolean);
}

function broadcastTeamChatPresence() {
  const onlineAdmins = buildOnlineAdminsPayload();

  clients.forEach((client) => {
    if (!client.isAdminAuthenticated) {
      return;
    }

    if (!client.subscriptions.has(ADMIN_TEAM_CHAT_CHANNEL)) {
      return;
    }

    safeSend(client.ws, {
      type: "team-chat.presence",
      onlineAdmins,
    });
  });
}

function broadcastTeamChatMessage(message) {
  clients.forEach((client) => {
    if (!client.isAdminAuthenticated) {
      return;
    }

    if (!client.subscriptions.has(ADMIN_TEAM_CHAT_CHANNEL)) {
      return;
    }

    safeSend(client.ws, {
      type: "team-chat.message",
      message,
    });
  });
}

function broadcastTeamChatRead(payload) {
  clients.forEach((client) => {
    if (!client.isAdminAuthenticated) {
      return;
    }

    if (!client.subscriptions.has(ADMIN_TEAM_CHAT_CHANNEL)) {
      return;
    }

    safeSend(client.ws, {
      type: "team-chat.read",
      payload,
    });
  });
}

function broadcastTeamChatCleared(payload) {
  clients.forEach((client) => {
    if (!client.isAdminAuthenticated) {
      return;
    }

    if (!client.subscriptions.has(ADMIN_TEAM_CHAT_CHANNEL)) {
      return;
    }

    safeSend(client.ws, {
      type: "team-chat.cleared",
      payload,
    });
  });
}

function handleRealtimeMessage(client, rawMessage) {
  let payload = null;

  try {
    payload = JSON.parse(String(rawMessage || "{}"));
  } catch {
    sendClientError(client, "Format pesan realtime tidak valid", "INVALID_JSON");
    return;
  }

  switch (String(payload?.type || "")) {
    case "ping":
      safeSend(client.ws, { type: "pong" });
      return;
    case "auth.admin": {
      const token = String(payload?.token || "").trim();

      if (!token) {
        sendClientError(client, "Realtime token admin wajib diisi", "AUTH_REQUIRED");
        return;
      }

      try {
        const decoded = verifyAdminRealtimeToken(token);
        client.isAdminAuthenticated = true;
        client.adminId = String(decoded.id || "");
        client.adminName = String(decoded.name || "").trim();
        client.adminEmail = String(decoded.email || "").trim();
        client.adminRole = String(decoded.role || "").trim();

        safeSend(client.ws, {
          type: "auth.success",
          admin: buildAdminProfile(client),
        });
        broadcastTeamChatPresence();
      } catch (error) {
        sendClientError(
          client,
          error instanceof Error ? error.message : "Realtime token tidak valid",
          "AUTH_INVALID"
        );
      }
      return;
    }
    case "subscribe.admin.orders":
      if (!client.isAdminAuthenticated) {
        sendClientError(client, "Autentikasi admin belum dilakukan", "AUTH_REQUIRED");
        return;
      }

      client.subscriptions.add(ADMIN_ORDERS_CHANNEL);
      safeSend(client.ws, {
        type: "subscribed",
        channel: ADMIN_ORDERS_CHANNEL,
      });
      return;
    case "subscribe.admin.team-chat":
      if (!client.isAdminAuthenticated) {
        sendClientError(client, "Autentikasi admin belum dilakukan", "AUTH_REQUIRED");
        return;
      }

      client.subscriptions.add(ADMIN_TEAM_CHAT_CHANNEL);
      safeSend(client.ws, {
        type: "subscribed",
        channel: ADMIN_TEAM_CHAT_CHANNEL,
      });
      safeSend(client.ws, {
        type: "team-chat.presence",
        onlineAdmins: buildOnlineAdminsPayload(),
      });
      return;
    case "subscribe.admin.sync-logs":
      if (!client.isAdminAuthenticated) {
        sendClientError(client, "Autentikasi admin belum dilakukan", "AUTH_REQUIRED");
        return;
      }

      client.subscriptions.add(ADMIN_SYNC_LOGS_CHANNEL);
      safeSend(client.ws, {
        type: "subscribed",
        channel: ADMIN_SYNC_LOGS_CHANNEL,
      });
      return;
    case "subscribe.invoice": {
      const invoiceNumber = normalizeInvoiceNumber(payload?.invoiceNumber);

      if (!invoiceNumber) {
        sendClientError(client, "Invoice number wajib diisi", "INVOICE_REQUIRED");
        return;
      }

      client.subscriptions.add(`invoice:${invoiceNumber}`);
      safeSend(client.ws, {
        type: "subscribed",
        channel: `invoice:${invoiceNumber}`,
      });
      return;
    }
    case "subscribe.public.recent-orders":
      client.subscriptions.add(PUBLIC_RECENT_ORDERS_CHANNEL);
      safeSend(client.ws, {
        type: "subscribed",
        channel: PUBLIC_RECENT_ORDERS_CHANNEL,
      });
      return;
    case "unsubscribe.invoice": {
      const invoiceNumber = normalizeInvoiceNumber(payload?.invoiceNumber);

      if (!invoiceNumber) {
        return;
      }

      client.subscriptions.delete(`invoice:${invoiceNumber}`);
      safeSend(client.ws, {
        type: "unsubscribed",
        channel: `invoice:${invoiceNumber}`,
      });
      return;
    }
    default:
      sendClientError(client, "Tipe pesan realtime tidak dikenali", "UNKNOWN_TYPE");
  }
}

function initRealtimeServer(server) {
  if (websocketServer) {
    return websocketServer;
  }

  websocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    let url = null;

    try {
      url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    } catch {
      socket.destroy();
      return;
    }

    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.emit("connection", ws, request);
    });
  });

  websocketServer.on("connection", (ws, request) => {
    const client = {
      ws,
      request,
      subscriptions: new Set(),
      isAdminAuthenticated: false,
      adminId: "",
      adminName: "",
      adminEmail: "",
      adminRole: "",
    };

    clients.add(client);
    safeSend(ws, { type: "ready" });

    ws.on("message", (rawMessage) => {
      handleRealtimeMessage(client, rawMessage);
    });

    ws.on("error", (error) => {
      logWarn({
        source: "backend",
        scope: "realtime",
        message: "Koneksi websocket menerima error",
        meta: {
          remoteAddress: request.socket?.remoteAddress || "",
        },
        error,
      });
    });

    ws.on("close", () => {
      clients.delete(client);
      if (client.isAdminAuthenticated) {
        broadcastTeamChatPresence();
      }
    });
  });

  logInfo({
    source: "backend",
    scope: "realtime",
    message: "Realtime websocket server ready on /ws",
    persist: false,
  });

  return websocketServer;
}

function broadcastOrderUpdate(order, source = "system") {
  if (!order) {
    return;
  }

  const orderPayload = buildOrderRealtimePayload(order);
  const invoiceChannel = `invoice:${orderPayload.invoiceNumber}`;

  clients.forEach((client) => {
    if (!client.ws || client.ws.readyState !== READY_STATE_OPEN) {
      return;
    }

    if (client.subscriptions.has(invoiceChannel)) {
      safeSend(client.ws, {
        type: "invoice.updated",
        source,
        order: orderPayload,
      });
    }

    if (
      client.isAdminAuthenticated &&
      client.subscriptions.has(ADMIN_ORDERS_CHANNEL)
    ) {
      safeSend(client.ws, {
        type: "orders.updated",
        source,
        order: orderPayload,
        });
      }

      if (client.subscriptions.has(PUBLIC_RECENT_ORDERS_CHANNEL)) {
        safeSend(client.ws, {
          type: "recent-orders.updated",
          source,
          order: orderPayload,
        });
      }
    });
}

function broadcastSyncLogUpdate(syncLog, source = "system") {
  if (!syncLog) {
    return;
  }

  const payload = buildSyncLogRealtimePayload(syncLog);

  clients.forEach((client) => {
    if (!client.ws || client.ws.readyState !== READY_STATE_OPEN) {
      return;
    }

    if (
      client.isAdminAuthenticated &&
      client.subscriptions.has(ADMIN_SYNC_LOGS_CHANNEL)
    ) {
      safeSend(client.ws, {
        type: "sync-logs.updated",
        source,
        syncLog: payload,
      });
    }
  });
}

function shutdownRealtimeServer() {
  if (!websocketServer) {
    return;
  }

  clients.forEach((client) => {
    try {
      client.ws?.close(RECONNECTABLE_CLOSE_CODE, "Server shutdown");
    } catch {
      // Ignore cleanup errors on shutdown.
    }
  });

  clients.clear();
  websocketServer.close((error) => {
    if (error) {
      logError({
        source: "backend",
        scope: "realtime",
        message: "Gagal mematikan websocket server",
        error,
        persist: false,
      });
    }
  });
  websocketServer = null;
}

module.exports = {
  ADMIN_ORDERS_CHANNEL,
  ADMIN_SYNC_LOGS_CHANNEL,
  ADMIN_TEAM_CHAT_CHANNEL,
  PUBLIC_RECENT_ORDERS_CHANNEL,
  broadcastOrderUpdate,
  broadcastSyncLogUpdate,
  broadcastTeamChatCleared,
  broadcastTeamChatMessage,
  broadcastTeamChatRead,
  initRealtimeServer,
  shutdownRealtimeServer,
};
