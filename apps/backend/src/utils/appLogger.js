const mongoose = require("mongoose");

const REDACTED_TEXT = "[REDACTED]";
const SENSITIVE_KEY_PATTERN =
  /(password|token|authorization|secret|signature|api[-_]?key|cookie)/i;

let AppLogModel = null;

function getAppLogModel() {
  if (!AppLogModel) {
    AppLogModel = require("../models/AppLog");
  }

  return AppLogModel;
}

function redactValue(value, depth = 0) {
  if (depth > 4) {
    return "[MaxDepth]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED_TEXT
        : redactValue(nestedValue, depth + 1);
    }

    return output;
  }

  if (typeof value === "string" && value.length > 5000) {
    return `${value.slice(0, 5000)}...[truncated]`;
  }

  return value;
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      code: error.code ? String(error.code) : "",
      stack: error.stack || "",
    };
  }

  return {
    name: "NonError",
    message: typeof error === "string" ? error : "Unknown error",
    code: "",
    stack: "",
  };
}

function normalizeActor(actor) {
  if (!actor) {
    return undefined;
  }

  return {
    adminId: actor.adminId || actor.id || null,
    email: actor.email || "",
    role: actor.role || "",
  };
}

function buildConsolePayload(level, payload) {
  return {
    timestamp: new Date().toISOString(),
    level,
    source: payload.source || "backend",
    scope: payload.scope || "application",
    message: payload.message,
    requestId: payload.requestId || "",
    method: payload.method || "",
    path: payload.path || "",
    statusCode: payload.statusCode ?? null,
    durationMs: payload.durationMs ?? null,
    actor: redactValue(normalizeActor(payload.actor)),
    meta: redactValue(payload.meta),
    error: redactValue(payload.error),
  };
}

async function persistAppLog(entry) {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    const AppLog = getAppLogModel();

    await AppLog.create({
      level: entry.level,
      scope: entry.scope || "application",
      source: entry.source || "backend",
      message: entry.message,
      requestId: entry.requestId || "",
      method: entry.method || "",
      path: entry.path || "",
      statusCode: entry.statusCode ?? null,
      durationMs: entry.durationMs ?? null,
      actor: normalizeActor(entry.actor),
      meta: redactValue(entry.meta),
      error: entry.error
        ? {
            name: entry.error.name || "",
            code: entry.error.code || "",
            stack: entry.error.stack || "",
          }
        : undefined,
    });
  } catch (persistError) {
    const fallback = buildConsolePayload("error", {
      source: "backend",
      scope: "monitoring",
      message: "Gagal menyimpan application log",
      error: serializeError(persistError),
      meta: {
        originalMessage: entry.message,
        originalScope: entry.scope,
      },
    });

    console.error(JSON.stringify(fallback));
  }
}

function shouldPersistLog(entry) {
  if (typeof entry.persist === "boolean") {
    return entry.persist;
  }

  return entry.level === "warn" || entry.level === "error" || entry.level === "fatal";
}

function writeConsoleLog(level, payload) {
  const serialized = JSON.stringify(buildConsolePayload(level, payload));

  if (level === "error" || level === "fatal") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

function logWithLevel(level, payload) {
  const normalizedPayload = {
    level,
    source: payload?.source || "backend",
    scope: payload?.scope || "application",
    message: payload?.message || "Unknown log",
    requestId: payload?.requestId || "",
    method: payload?.method || "",
    path: payload?.path || "",
    statusCode: payload?.statusCode,
    durationMs: payload?.durationMs,
    actor: payload?.actor,
    meta: payload?.meta,
    error: payload?.error ? serializeError(payload.error) : null,
    persist: payload?.persist,
  };

  writeConsoleLog(level, normalizedPayload);

  if (shouldPersistLog(normalizedPayload)) {
    void persistAppLog(normalizedPayload);
  }
}

function logInfo(payload) {
  logWithLevel("info", payload);
}

function logWarn(payload) {
  logWithLevel("warn", payload);
}

function logError(payload) {
  logWithLevel("error", payload);
}

function logFatal(payload) {
  logWithLevel("fatal", payload);
}

module.exports = {
  logInfo,
  logWarn,
  logError,
  logFatal,
  redactValue,
  serializeError,
};
