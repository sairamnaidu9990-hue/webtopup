const SiteSetting = require("../models/SiteSetting");

const defaultSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
};

function normalizeDomain(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return rawValue;
  }
}

async function getOrCreateSiteSetting() {
  let siteSetting = await SiteSetting.findOne();

  if (!siteSetting) {
    siteSetting = await SiteSetting.create(defaultSiteSetting);
  }

  return siteSetting;
}

function serializeSiteSetting(siteSetting) {
  return {
    siteName: siteSetting.siteName || defaultSiteSetting.siteName,
    siteLogoUrl: siteSetting.siteLogoUrl || "",
    siteFaviconUrl: siteSetting.siteFaviconUrl || "",
    siteDomain: siteSetting.siteDomain || "",
    siteTitle: siteSetting.siteTitle || defaultSiteSetting.siteTitle,
    siteDescription:
      siteSetting.siteDescription || defaultSiteSetting.siteDescription,
    updatedAt: siteSetting.updatedAt || null,
  };
}

exports.getPublicSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();

    return res.status(200).json({
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pengaturan website",
      error: error.message,
    });
  }
};

exports.getAdminSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();

    return res.status(200).json({
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pengaturan website",
      error: error.message,
    });
  }
};

exports.updateSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();

    if (req.body.siteName != null) {
      siteSetting.siteName = String(req.body.siteName).trim();
    }

    if (req.body.siteLogoUrl != null) {
      siteSetting.siteLogoUrl = String(req.body.siteLogoUrl).trim();
    }

    if (req.body.siteFaviconUrl != null) {
      siteSetting.siteFaviconUrl = String(req.body.siteFaviconUrl).trim();
    }

    if (req.body.siteDomain != null) {
      siteSetting.siteDomain = normalizeDomain(req.body.siteDomain);
    }

    if (req.body.siteTitle != null) {
      siteSetting.siteTitle = String(req.body.siteTitle).trim();
    }

    if (req.body.siteDescription != null) {
      siteSetting.siteDescription = String(req.body.siteDescription).trim();
    }

    siteSetting.updatedBy = req.admin
      ? {
          adminId: req.admin._id,
          name: req.admin.name || "",
          email: req.admin.email || "",
        }
      : siteSetting.updatedBy;

    await siteSetting.save();

    return res.status(200).json({
      message: "Pengaturan website berhasil diperbarui",
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui pengaturan website",
      error: error.message,
    });
  }
};
