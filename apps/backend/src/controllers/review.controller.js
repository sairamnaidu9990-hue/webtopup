const Order = require("../models/Order");
const Review = require("../models/Review");
const SiteSetting = require("../models/SiteSetting");
const { logError } = require("../utils/appLogger");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toStringValue(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return toStringValue(value).toUpperCase();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMaskedCustomerDisplay(order) {
  const countryCode = toStringValue(order?.contactDetail?.phoneCountryCode || "+62");
  const digits = toStringValue(order?.contactDetail?.phoneNumber).replace(/[^0-9]/g, "");

  if (!digits) {
    return "Pelanggan Terverifikasi";
  }

  const visibleTail = digits.slice(-4);
  const maskedHead = "*".repeat(Math.max(digits.length - 4, 2));

  return `${countryCode} ${maskedHead}${visibleTail}`.trim();
}

function serializeAdminReview(review) {
  return {
    _id: review._id,
    invoiceNumber: review.invoiceNumber,
    gameSnapshot: review.gameSnapshot,
    customerDisplay: review.customerDisplay,
    rating: Number(review.rating || 0),
    comment: toStringValue(review.comment),
    isCommentHidden: Boolean(review.isCommentHidden),
    adminNote: toStringValue(review.adminNote),
    createdAt: review.createdAt || null,
    updatedAt: review.updatedAt || null,
  };
}

function serializePublicReviewEntry(review) {
  return {
    _id: review._id,
    invoiceNumber: toStringValue(review.invoiceNumber),
    gameSnapshot: {
      name: toStringValue(review.gameSnapshot?.name),
      code: normalizeCode(review.gameSnapshot?.code),
      provider: toStringValue(review.gameSnapshot?.provider),
      category: toStringValue(review.gameSnapshot?.category),
      logo: toStringValue(review.gameSnapshot?.logo),
    },
    customerDisplay: toStringValue(review.customerDisplay) || "Pelanggan Terverifikasi",
    rating: Number(review.rating || 0),
    comment: toStringValue(review.comment),
    createdAt: review.createdAt || null,
  };
}

function serializeOrderReviewState(order, review) {
  const normalizedStatus = normalizeCode(order?.status);
  const hasReviewed = Boolean(review);

  return {
    canSubmit: normalizedStatus === "SUCCESS" && !hasReviewed,
    hasSubmitted: hasReviewed,
    review: review
      ? {
          rating: Number(review.rating || 0),
          comment: toStringValue(review.comment),
          createdAt: review.createdAt || null,
        }
      : null,
  };
}

function buildRatingBreakdown(items = []) {
  const countMap = new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      Number(item?._id || 0),
      Number(item?.count || 0),
    ])
  );

  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: countMap.get(rating) || 0,
  }));
}

function buildPublicReviewFilter(query = {}) {
  const gameCode = normalizeCode(query.gameCode);
  const filter = {
    isCommentHidden: false,
  };

  if (gameCode) {
    filter["gameSnapshot.code"] = gameCode;
  }

  return {
    gameCode,
    filter,
  };
}

async function createPublicReview(req, res) {
  try {
    const invoiceNumber = normalizeCode(req.body?.invoiceNumber);
    const rating = Number(req.body?.rating || 0);
    const comment = toStringValue(req.body?.comment);

    if (!invoiceNumber) {
      return res.status(400).json({
        message: "Invoice wajib diisi",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating wajib diisi antara 1 sampai 5",
      });
    }

    const order = await Order.findOne({ invoiceNumber });

    if (!order) {
      return res.status(404).json({
        message: "Invoice tidak ditemukan",
      });
    }

    if (normalizeCode(order.status) !== "SUCCESS") {
      return res.status(400).json({
        message: "Review hanya bisa dikirim setelah transaksi berhasil",
      });
    }

    const existingReview = await Review.findOne({ order: order._id });

    if (existingReview) {
      return res.status(400).json({
        message: "Review untuk invoice ini sudah pernah dikirim",
      });
    }

    const review = await Review.create({
      order: order._id,
      invoiceNumber: order.invoiceNumber,
      game: order.game || null,
      gameSnapshot: {
        name: toStringValue(order.gameSnapshot?.name),
        code: normalizeCode(order.gameSnapshot?.code),
        provider: toStringValue(order.gameSnapshot?.provider),
        category: toStringValue(order.gameSnapshot?.category),
        logo: toStringValue(order.gameSnapshot?.logo),
      },
      customerDisplay: buildMaskedCustomerDisplay(order),
      rating,
      comment,
    });

    return res.status(201).json({
      message: "Terima kasih, ulasan kamu berhasil dikirim",
      review: serializePublicReviewEntry(review),
      reviewState: serializeOrderReviewState(order, review),
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "review",
      message: "Error kirim review publik",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        invoiceNumber: req.body?.invoiceNumber,
      },
      error,
    });

    return res.status(500).json({
      message: "Error kirim review",
      error: error.message,
    });
  }
}

async function getPublicGameReviewSummary(req, res) {
  try {
    const gameCode = normalizeCode(req.params.gameCode);

    if (!gameCode) {
      return res.status(400).json({
        message: "Kode game wajib diisi",
      });
    }

    const [aggregateResult, ratingBreakdownResult, commentItems, siteSetting] =
      await Promise.all([
      Review.aggregate([
        {
          $match: {
            "gameSnapshot.code": gameCode,
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            totalComments: {
              $sum: {
                $cond: [{ $gt: [{ $strLenCP: "$comment" }, 0] }, 1, 0],
              },
            },
          },
        },
      ]),
      Review.aggregate([
        {
          $match: {
            "gameSnapshot.code": gameCode,
          },
        },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
      Review.find({
        "gameSnapshot.code": gameCode,
        isCommentHidden: false,
        comment: { $ne: "" },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      SiteSetting.findOne({}, { reviewCommentsVisible: 1 }).lean(),
    ]);

    const metrics = aggregateResult[0] || {};
    const commentsVisible = Boolean(siteSetting?.reviewCommentsVisible ?? true);

    return res.status(200).json({
      summary: {
        averageRating: Number(metrics.averageRating || 0),
        totalReviews: Number(metrics.totalReviews || 0),
        totalComments: Number(metrics.totalComments || 0),
        ratingBreakdown: buildRatingBreakdown(ratingBreakdownResult),
        commentsVisible,
        recentComments: commentsVisible
          ? commentItems.map(serializePublicReviewEntry)
          : [],
      },
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "review",
      message: "Error ambil summary review game publik",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        gameCode: req.params?.gameCode,
      },
      error,
    });

    return res.status(500).json({
      message: "Error ambil summary review",
      error: error.message,
    });
  }
}

async function getPublicReviews(req, res) {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const { gameCode, filter } = buildPublicReviewFilter(req.query || {});

    const [items, totalItems, aggregateResult, ratingBreakdownResult, siteSetting] =
      await Promise.all([
        Review.find({
          ...filter,
          comment: { $ne: "" },
        })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Review.countDocuments({
          ...filter,
          comment: { $ne: "" },
        }),
        Review.aggregate([
          {
            $match: gameCode
              ? { "gameSnapshot.code": gameCode }
              : {},
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
              totalComments: {
                $sum: {
                  $cond: [{ $gt: [{ $strLenCP: "$comment" }, 0] }, 1, 0],
                },
              },
            },
          },
        ]),
        Review.aggregate([
          {
            $match: gameCode
              ? { "gameSnapshot.code": gameCode }
              : {},
          },
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
        ]),
        SiteSetting.findOne({}, { reviewCommentsVisible: 1 }).lean(),
      ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const metrics = aggregateResult[0] || {};
    const commentsVisible = Boolean(siteSetting?.reviewCommentsVisible ?? true);

    return res.status(200).json({
      items: commentsVisible ? items.map(serializePublicReviewEntry) : [],
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      summary: {
        averageRating: Number(metrics.averageRating || 0),
        totalReviews: Number(metrics.totalReviews || 0),
        totalComments: Number(metrics.totalComments || 0),
        ratingBreakdown: buildRatingBreakdown(ratingBreakdownResult),
        commentsVisible,
      },
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "review",
      message: "Error ambil daftar review publik",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        gameCode: req.query?.gameCode,
      },
      error,
    });

    return res.status(500).json({
      message: "Error ambil daftar review publik",
      error: error.message,
    });
  }
}

async function getAdminReviews(req, res) {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const search = toStringValue(req.query.search);
    const hidden = normalizeCode(req.query.hidden || "ALL");
    const rating = toPositiveInteger(req.query.rating, 0);

    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { invoiceNumber: regex },
        { "gameSnapshot.name": regex },
        { "gameSnapshot.code": regex },
        { "gameSnapshot.provider": regex },
        { customerDisplay: regex },
        { comment: regex },
        { adminNote: regex },
      ];
    }

    if (hidden === "VISIBLE") {
      filter.isCommentHidden = false;
    } else if (hidden === "HIDDEN") {
      filter.isCommentHidden = true;
    }

    if (rating >= 1 && rating <= 5) {
      filter.rating = rating;
    }

    const [items, totalItems, metrics] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            hiddenComments: {
              $sum: {
                $cond: ["$isCommentHidden", 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const summary = metrics[0] || {};

    return res.status(200).json({
      items: items.map(serializeAdminReview),
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      summary: {
        totalReviews: Number(summary.totalReviews || 0),
        averageRating: Number(summary.averageRating || 0),
        hiddenComments: Number(summary.hiddenComments || 0),
      },
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "review",
      message: "Error ambil review admin",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });

    return res.status(500).json({
      message: "Error ambil review",
      error: error.message,
    });
  }
}

async function updateReviewByAdmin(req, res) {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review tidak ditemukan",
      });
    }

    if (req.body?.isCommentHidden !== undefined) {
      review.isCommentHidden = Boolean(req.body.isCommentHidden);
    }

    if (req.body?.adminNote !== undefined) {
      review.adminNote = toStringValue(req.body.adminNote);
    }

    await review.save();

    return res.status(200).json({
      message: "Review berhasil diperbarui",
      review: serializeAdminReview(review),
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "review",
      message: "Error update review admin",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        reviewId: req.params?.id,
      },
      error,
    });

    return res.status(500).json({
      message: "Error update review",
      error: error.message,
    });
  }
}

module.exports = {
  createPublicReview,
  getAdminReviews,
  getPublicReviews,
  getPublicGameReviewSummary,
  serializeOrderReviewState,
  serializePublicReviewEntry,
  updateReviewByAdmin,
};
