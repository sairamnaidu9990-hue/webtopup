const ProviderSyncSetting = require("../models/ProviderSyncSetting");
const { runBangjeffSyncAction } = require("../controllers/product.controller");
const {
  DEFAULT_PROVIDER_SYNC_TIMEZONE,
  normalizeBangjeffSyncActions,
  normalizeProviderSyncTimezone,
} = require("../utils/providerSyncSettings");
const { logError, logInfo } = require("../utils/appLogger");

const CHECK_INTERVAL_MS = 30 * 1000;
const PROVIDER_NAME = "bangjeff";

let schedulerTimer = null;
let tickInProgress = false;
const inFlightActions = new Set();

function getDateParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeProviderSyncTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((item) => [item.type, item.value]));

  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    timeKey: `${map.hour}:${map.minute}`,
  };
}

function getActionDateKey(action, timezone) {
  if (!action?.lastRunAt) {
    return "";
  }

  return getDateParts(new Date(action.lastRunAt), timezone).dateKey;
}

function shouldRunAction(action, timezone, now) {
  if (!action?.enabled) {
    return false;
  }

  const currentParts = getDateParts(now, timezone);

  if (action.time !== currentParts.timeKey) {
    return false;
  }

  return getActionDateKey(action, timezone) !== currentParts.dateKey;
}

async function updateActionState(settingId, actionKey, nextState) {
  const setting = await ProviderSyncSetting.findById(settingId);

  if (!setting) {
    return null;
  }

  const actions = normalizeBangjeffSyncActions(setting.actions, setting.actions);
  const nextActions = actions.map((item) =>
    item.key === actionKey
      ? {
          ...item,
          ...nextState,
        }
      : item
  );

  setting.actions = nextActions;
  await setting.save();
  return setting;
}

async function runScheduledAction(setting, action) {
  const scheduleKey = `${setting.provider}:${setting.region}:${action.key}`;

  if (inFlightActions.has(scheduleKey)) {
    return;
  }

  inFlightActions.add(scheduleKey);

  try {
    await updateActionState(setting._id, action.key, {
      lastRunStatus: "RUNNING",
      lastError: "",
    });

    const result = await runBangjeffSyncAction({
      action: action.key,
      region: setting.region,
      admin: null,
    });

    await updateActionState(setting._id, action.key, {
      lastRunAt: new Date(),
      lastRunStatus: "SUCCESS",
      lastError: "",
    });

    logInfo({
      source: "backend",
      scope: "scheduler",
      message: `Auto sync BangJeff ${action.key} selesai`,
      meta: {
        provider: setting.provider,
        region: setting.region,
        timezone: setting.timezone,
        action: action.key,
        statusCode: result.statusCode,
      },
      persist: true,
    });
  } catch (error) {
    await updateActionState(setting._id, action.key, {
      lastRunAt: new Date(),
      lastRunStatus: "FAILED",
      lastError: error?.syncResponseBody?.error || error?.message || "Unknown error",
    });

    logError({
      source: "backend",
      scope: "scheduler",
      message: `Auto sync BangJeff ${action.key} gagal`,
      error,
      meta: {
        provider: setting.provider,
        region: setting.region,
        timezone: setting.timezone,
        action: action.key,
      },
      persist: true,
    });
  } finally {
    inFlightActions.delete(scheduleKey);
  }
}

async function tickBangjeffAutoSyncScheduler() {
  if (tickInProgress) {
    return;
  }

  tickInProgress = true;

  try {
    const settings = await ProviderSyncSetting.find({ provider: PROVIDER_NAME });
    const now = new Date();

    for (const setting of settings) {
      const timezone =
        normalizeProviderSyncTimezone(setting.timezone) ||
        DEFAULT_PROVIDER_SYNC_TIMEZONE;
      const actions = normalizeBangjeffSyncActions(setting.actions, setting.actions);

      for (const action of actions) {
        if (shouldRunAction(action, timezone, now)) {
          void runScheduledAction(setting, action);
        }
      }
    }
  } catch (error) {
    logError({
      source: "backend",
      scope: "scheduler",
      message: "Tick auto sync BangJeff gagal",
      error,
      persist: true,
    });
  } finally {
    tickInProgress = false;
  }
}

function startBangjeffAutoSyncScheduler() {
  if (schedulerTimer) {
    return;
  }

  schedulerTimer = setInterval(() => {
    void tickBangjeffAutoSyncScheduler();
  }, CHECK_INTERVAL_MS);

  void tickBangjeffAutoSyncScheduler();

  logInfo({
    source: "backend",
    scope: "scheduler",
    message: "BangJeff auto sync scheduler started",
    meta: {
      checkIntervalMs: CHECK_INTERVAL_MS,
      timezone: DEFAULT_PROVIDER_SYNC_TIMEZONE,
    },
    persist: false,
  });
}

function stopBangjeffAutoSyncScheduler() {
  if (!schedulerTimer) {
    return;
  }

  clearInterval(schedulerTimer);
  schedulerTimer = null;
}

module.exports = {
  startBangjeffAutoSyncScheduler,
  stopBangjeffAutoSyncScheduler,
};
