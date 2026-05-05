const ProviderSyncSetting = require("../models/ProviderSyncSetting");
const {
  DEFAULT_PROVIDER_SYNC_TIMEZONE,
  buildDefaultBangjeffSyncActions,
  normalizeBangjeffSyncActions,
  normalizeProviderSyncTimezone,
} = require("../utils/providerSyncSettings");

const DEFAULT_PROVIDER = "bangjeff";
const DEFAULT_REGION = String(process.env.BANGJEFF_REGION || "ID")
  .trim()
  .toUpperCase();

function getRegion(req) {
  return String(req.query?.region || req.body?.region || DEFAULT_REGION)
    .trim()
    .toUpperCase();
}

async function getOrCreateProviderSyncSetting(provider, region) {
  const normalizedProvider = String(provider || DEFAULT_PROVIDER)
    .trim()
    .toLowerCase();
  const normalizedRegion = String(region || DEFAULT_REGION)
    .trim()
    .toUpperCase();

  let setting = await ProviderSyncSetting.findOne({
    provider: normalizedProvider,
    region: normalizedRegion,
  });

  if (!setting) {
    setting = await ProviderSyncSetting.create({
      provider: normalizedProvider,
      region: normalizedRegion,
      timezone: DEFAULT_PROVIDER_SYNC_TIMEZONE,
      actions: buildDefaultBangjeffSyncActions(),
    });
  }

  return setting;
}

function serializeProviderSyncSetting(setting) {
  const actions = normalizeBangjeffSyncActions(
    setting?.actions,
    buildDefaultBangjeffSyncActions()
  );

  return {
    provider: String(setting?.provider || DEFAULT_PROVIDER).trim().toLowerCase(),
    region: String(setting?.region || DEFAULT_REGION).trim().toUpperCase(),
    timezone: normalizeProviderSyncTimezone(setting?.timezone),
    actions: actions.map((item) => ({
      key: item.key,
      label: item.label,
      enabled: Boolean(item.enabled),
      time: item.time,
      lastRunAt: item.lastRunAt || null,
      lastRunStatus: String(item.lastRunStatus || "IDLE").trim().toUpperCase(),
      lastError: String(item.lastError || "").trim(),
    })),
    updatedAt: setting?.updatedAt || null,
  };
}

async function getProviderSyncSetting(req, res) {
  try {
    const setting = await getOrCreateProviderSyncSetting(
      DEFAULT_PROVIDER,
      getRegion(req)
    );

    return res.status(200).json({
      syncSetting: serializeProviderSyncSetting(setting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pengaturan auto sync BangJeff",
      error: error.message,
    });
  }
}

async function updateProviderSyncSetting(req, res) {
  try {
    const setting = await getOrCreateProviderSyncSetting(
      DEFAULT_PROVIDER,
      getRegion(req)
    );

    if (req.body.timezone != null) {
      setting.timezone = normalizeProviderSyncTimezone(req.body.timezone);
    }

    if (Array.isArray(req.body.actions)) {
      setting.actions = normalizeBangjeffSyncActions(
        req.body.actions,
        setting.actions
      );
    }

    setting.updatedBy = req.admin
      ? {
          adminId: req.admin._id,
          name: req.admin.name || "",
          email: req.admin.email || "",
        }
      : setting.updatedBy;

    await setting.save();

    return res.status(200).json({
      message: "Pengaturan auto sync BangJeff berhasil diperbarui",
      syncSetting: serializeProviderSyncSetting(setting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui pengaturan auto sync BangJeff",
      error: error.message,
    });
  }
}

module.exports = {
  getOrCreateProviderSyncSetting,
  serializeProviderSyncSetting,
  getProviderSyncSetting,
  updateProviderSyncSetting,
};
