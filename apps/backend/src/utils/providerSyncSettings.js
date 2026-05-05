const DEFAULT_PROVIDER_SYNC_TIMEZONE =
  process.env.PROVIDER_SYNC_TIMEZONE || "Asia/Jakarta";

const BANGJEFF_SYNC_ACTION_DEFINITIONS = [
  {
    key: "games",
    label: "Sync Games",
    defaultTime: "02:00",
  },
  {
    key: "details",
    label: "Sync Input / Details",
    defaultTime: "02:10",
  },
  {
    key: "variants",
    label: "Sync Variants",
    defaultTime: "02:20",
  },
];

function normalizeProviderSyncTimezone(value) {
  const timezone = String(value || "").trim();
  return timezone || DEFAULT_PROVIDER_SYNC_TIMEZONE;
}

function normalizeSyncTime(value, fallback = "00:00") {
  const time = String(value || "")
    .trim()
    .slice(0, 5);

  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return time;
  }

  return fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function buildDefaultBangjeffSyncActions() {
  return BANGJEFF_SYNC_ACTION_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    enabled: false,
    time: definition.defaultTime,
    lastRunAt: null,
    lastRunStatus: "IDLE",
    lastError: "",
  }));
}

function normalizeBangjeffSyncActions(actions, fallbackActions = []) {
  const source = Array.isArray(actions) ? actions : [];
  const fallbackMap = new Map(
    (Array.isArray(fallbackActions) ? fallbackActions : []).map((item) => [
      String(item?.key || "").trim().toLowerCase(),
      item,
    ])
  );
  const sourceMap = new Map(
    source.map((item) => [String(item?.key || "").trim().toLowerCase(), item])
  );

  return BANGJEFF_SYNC_ACTION_DEFINITIONS.map((definition) => {
    const current = sourceMap.get(definition.key) || {};
    const fallback = fallbackMap.get(definition.key) || {};

    return {
      key: definition.key,
      label: definition.label,
      enabled: normalizeBoolean(
        current.enabled,
        normalizeBoolean(fallback.enabled, false)
      ),
      time: normalizeSyncTime(
        current.time,
        normalizeSyncTime(fallback.time, definition.defaultTime)
      ),
      lastRunAt: current.lastRunAt || fallback.lastRunAt || null,
      lastRunStatus: String(
        current.lastRunStatus || fallback.lastRunStatus || "IDLE"
      )
        .trim()
        .toUpperCase(),
      lastError: String(current.lastError || fallback.lastError || "").trim(),
    };
  });
}

module.exports = {
  DEFAULT_PROVIDER_SYNC_TIMEZONE,
  BANGJEFF_SYNC_ACTION_DEFINITIONS,
  buildDefaultBangjeffSyncActions,
  normalizeBangjeffSyncActions,
  normalizeProviderSyncTimezone,
  normalizeSyncTime,
};
