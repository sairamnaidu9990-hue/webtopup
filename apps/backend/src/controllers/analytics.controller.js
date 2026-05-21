const VisitorEvent = require("../models/VisitorEvent");
const { logError } = require("../utils/appLogger");

const DEFAULT_SUMMARY_DAYS = 7;
const MAX_PATH_LENGTH = 300;
const ANALYTICS_TIMEZONE = "Asia/Jakarta";
const BOT_USER_AGENT_PATTERN =
  /bot|spider|crawl|slurp|preview|facebookexternalhit|bingpreview|pinterest|whatsapp|telegrambot|discordbot|googleweblight|lighthouse/i;

function toStringValue(value) {
  return String(value || "").trim();
}

function normalizeHost(value) {
  return toStringValue(value).toLowerCase().replace(/^www\./, "");
}

function normalizePath(value) {
  const raw = toStringValue(value);

  if (!raw) {
    return "/";
  }

  const pathname = raw.startsWith("/") ? raw : `/${raw}`;
  return pathname.slice(0, MAX_PATH_LENGTH);
}

function normalizeFullPath(path, value) {
  const raw = toStringValue(value);

  if (!raw) {
    return path;
  }

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return normalized.slice(0, 600);
}

function getTimeZoneDayKey(date = new Date(), timeZone = ANALYTICS_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getRecentDayKeys(days, now = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const nextDate = new Date(now);
    nextDate.setUTCDate(nextDate.getUTCDate() - index);
    return getTimeZoneDayKey(nextDate);
  });
}

function isBotUserAgent(userAgent) {
  return BOT_USER_AGENT_PATTERN.test(toStringValue(userAgent));
}

function detectDeviceType(userAgent) {
  const normalized = toStringValue(userAgent).toLowerCase();

  if (!normalized) {
    return "desktop";
  }

  if (/tablet|ipad/.test(normalized)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod/.test(normalized)) {
    return "mobile";
  }

  return "desktop";
}

function normalizeReferrer(referrer, siteHost) {
  const value = toStringValue(referrer);

  if (!value) {
    return {
      referrer: "",
      referrerHost: "",
      referrerSource: "Direct",
    };
  }

  try {
    const url = new URL(value);
    const referrerHost = normalizeHost(url.host);
    const normalizedSiteHost = normalizeHost(siteHost);

    return {
      referrer: value.slice(0, 700),
      referrerHost,
      referrerSource:
        normalizedSiteHost && referrerHost === normalizedSiteHost
          ? "Internal"
          : referrerHost || "Direct",
    };
  } catch {
    return {
      referrer: value.slice(0, 700),
      referrerHost: "",
      referrerSource: "Unknown",
    };
  }
}

function serializeAnalyticsSummary({
  todayVisitors,
  todayPageviews,
  last7DaysVisitors,
  last7DaysPageviews,
  topPages,
  topReferrers,
  topDevices,
  generatedAt,
}) {
  return {
    todayVisitors: Number(todayVisitors || 0),
    todayPageviews: Number(todayPageviews || 0),
    last7DaysVisitors: Number(last7DaysVisitors || 0),
    last7DaysPageviews: Number(last7DaysPageviews || 0),
    topPages: Array.isArray(topPages) ? topPages : [],
    topReferrers: Array.isArray(topReferrers) ? topReferrers : [],
    topDevices: Array.isArray(topDevices) ? topDevices : [],
    generatedAt: generatedAt || new Date().toISOString(),
  };
}

async function trackVisitorPageView(req, res) {
  try {
    const sessionId = toStringValue(req.body?.sessionId);
    const path = normalizePath(req.body?.path);
    const fullPath = normalizeFullPath(path, req.body?.fullPath || path);
    const siteHost = normalizeHost(req.body?.siteHost);
    const title = toStringValue(req.body?.title).slice(0, 200);
    const userAgent = toStringValue(req.body?.userAgent || req.get("user-agent")).slice(
      0,
      500
    );
    const isBot = isBotUserAgent(userAgent);

    if (!sessionId) {
      return res.status(400).json({
        message: "Session visitor tidak valid",
      });
    }

    if (isBot) {
      return res.status(202).json({
        tracked: false,
        ignored: true,
        reason: "bot",
      });
    }

    const referrerInfo = normalizeReferrer(req.body?.referrer, siteHost);
    const now = new Date();
    const utm = req.body?.utm && typeof req.body.utm === "object" ? req.body.utm : {};

    await VisitorEvent.create({
      sessionId,
      dayKey: getTimeZoneDayKey(now),
      path,
      fullPath,
      title,
      referrer: referrerInfo.referrer,
      referrerHost: referrerInfo.referrerHost,
      referrerSource: referrerInfo.referrerSource,
      siteHost,
      utmSource: toStringValue(utm.source).slice(0, 120),
      utmMedium: toStringValue(utm.medium).slice(0, 120),
      utmCampaign: toStringValue(utm.campaign).slice(0, 160),
      utmTerm: toStringValue(utm.term).slice(0, 160),
      utmContent: toStringValue(utm.content).slice(0, 160),
      deviceType: detectDeviceType(userAgent),
      userAgent,
      isBot: false,
      occurredAt: now,
    });

    return res.status(201).json({
      tracked: true,
      sessionId,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "analytics",
      message: "Error track visitor pageview",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });

    return res.status(500).json({
      message: "Gagal menyimpan tracking visitor",
      error: error.message,
    });
  }
}

async function getAnalyticsSummary(req, res) {
  try {
    const recentDayKeys = getRecentDayKeys(DEFAULT_SUMMARY_DAYS);
    const todayKey = recentDayKeys[0];
    const summaryWindowFilter = {
      isBot: { $ne: true },
      dayKey: { $in: recentDayKeys },
    };

    const [
      todayVisitorsDistinct,
      todayPageviews,
      last7VisitorsDistinct,
      last7Pageviews,
      topPages,
      topReferrers,
      topDevices,
    ] = await Promise.all([
      VisitorEvent.distinct("sessionId", {
        isBot: { $ne: true },
        dayKey: todayKey,
      }),
      VisitorEvent.countDocuments({
        isBot: { $ne: true },
        dayKey: todayKey,
      }),
      VisitorEvent.distinct("sessionId", summaryWindowFilter),
      VisitorEvent.countDocuments(summaryWindowFilter),
      VisitorEvent.aggregate([
        { $match: summaryWindowFilter },
        {
          $group: {
            _id: "$path",
            pageviews: { $sum: 1 },
            uniqueVisitors: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            _id: 0,
            path: "$_id",
            pageviews: 1,
            uniqueVisitors: { $size: "$uniqueVisitors" },
          },
        },
        { $sort: { pageviews: -1, path: 1 } },
        { $limit: 5 },
      ]),
      VisitorEvent.aggregate([
        { $match: summaryWindowFilter },
        {
          $group: {
            _id: "$referrerSource",
            visits: { $sum: 1 },
            uniqueVisitors: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            _id: 0,
            source: "$_id",
            visits: 1,
            uniqueVisitors: { $size: "$uniqueVisitors" },
          },
        },
        { $sort: { visits: -1, source: 1 } },
        { $limit: 5 },
      ]),
      VisitorEvent.aggregate([
        { $match: summaryWindowFilter },
        {
          $group: {
            _id: "$deviceType",
            visits: { $sum: 1 },
            uniqueVisitors: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            _id: 0,
            deviceType: "$_id",
            visits: 1,
            uniqueVisitors: { $size: "$uniqueVisitors" },
          },
        },
        { $sort: { visits: -1, deviceType: 1 } },
      ]),
    ]);

    return res.status(200).json(
      serializeAnalyticsSummary({
        todayVisitors: todayVisitorsDistinct.length,
        todayPageviews,
        last7DaysVisitors: last7VisitorsDistinct.length,
        last7DaysPageviews: last7Pageviews,
        topPages,
        topReferrers,
        topDevices,
        generatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "analytics",
      message: "Error ambil ringkasan analytics visitor",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });

    return res.status(500).json({
      message: "Gagal mengambil ringkasan visitor analytics",
      error: error.message,
    });
  }
}

module.exports = {
  getAnalyticsSummary,
  trackVisitorPageView,
};
