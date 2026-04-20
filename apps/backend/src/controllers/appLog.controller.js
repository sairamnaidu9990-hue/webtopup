const AppLog = require("../models/AppLog");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const LOG_LEVELS = ["info", "warn", "error", "fatal"];

function toStringValue(value) {
  return String(value || "").trim();
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildPagination(page, limit, totalItems) {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return {
    page: safePage,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

function buildAppLogQuery(searchParams) {
  const level = toStringValue(searchParams.level).toLowerCase();
  const scope = toStringValue(searchParams.scope).toLowerCase();
  const search = toStringValue(searchParams.search);
  const query = {};

  if (LOG_LEVELS.includes(level)) {
    query.level = level;
  }

  if (scope) {
    query.scope = scope;
  }

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    query.$or = [
      { message: regex },
      { path: regex },
      { requestId: regex },
      { "actor.email": regex },
      { "error.name": regex },
      { "meta.invoiceNumber": regex },
      { "meta.orderId": regex },
    ];
  }

  return query;
}

async function getAppLogs(req, res) {
  try {
    const requestedPage = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const query = buildAppLogQuery(req.query);

    const totalItems = await AppLog.countDocuments(query);
    const pagination = buildPagination(requestedPage, limit, totalItems);
    const skip = (pagination.page - 1) * limit;

    const items = await AppLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      items,
      ...pagination,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memuat application logs",
      error: error.message,
    });
  }
}

module.exports = {
  getAppLogs,
};
