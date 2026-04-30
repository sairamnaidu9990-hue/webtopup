const PromoCode = require("../models/PromoCode");
const {
  escapeRegex,
  getPromoDailyUsageCount,
  normalizeApplicableCategories,
  normalizeApplicableGameIds,
  normalizeDiscountType,
  normalizeGameId,
  normalizePromoCode,
  serializePromoCode,
  toNonNegativeNumber,
  toPositiveInteger,
  validatePromoForOrder,
} = require("../utils/promoCode");

function buildApplicabilityFilter({ gameId, category }) {
  const normalizedGameId = normalizeGameId(gameId);
  const normalizedCategory = String(category || "").trim();
  const orConditions = [
    {
      $and: [
        { applicableGameIds: { $size: 0 } },
        { applicableCategories: { $size: 0 } },
      ],
    },
  ];

  if (normalizedGameId) {
    orConditions.push({ applicableGameIds: normalizedGameId });
  }

  if (normalizedCategory) {
    orConditions.push({
      $and: [
        { applicableGameIds: { $size: 0 } },
        { applicableCategories: normalizedCategory },
      ],
    });
  }

  if (orConditions.length === 1) {
    return null;
  }

  return {
    $or: orConditions,
  };
}

function serializeApplicableGames(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      _id: String(item?._id || "").trim(),
      name: String(item?.name || "").trim(),
      code: String(item?.code || "").trim().toUpperCase(),
      category: String(item?.category || "").trim(),
      logo: String(item?.logo || "").trim(),
    }))
    .filter((item) => item._id && item.name);
}

exports.getPromoCodes = async (req, res) => {
  try {
    const queryParts = [];
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").trim().toUpperCase();
    const gameId = req.query.gameId;
    const category = String(req.query.category || "").trim();
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 100);
    const usePagination =
      req.query.page != null ||
      req.query.limit != null ||
      req.query.search != null ||
      req.query.status != null ||
      req.query.gameId != null ||
      req.query.category != null;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      queryParts.push({
        $or: [{ title: regex }, { code: regex }, { description: regex }],
      });
    }

    if (status === "ACTIVE") {
      queryParts.push({ isActive: true });
    } else if (status === "INACTIVE") {
      queryParts.push({ isActive: false });
    }

    const applicabilityFilter = buildApplicabilityFilter({
      gameId,
      category,
    });

    if (applicabilityFilter) {
      queryParts.push(applicabilityFilter);
    }

    const filter =
      queryParts.length === 0
        ? {}
        : queryParts.length === 1
        ? queryParts[0]
        : { $and: queryParts };

    const baseQuery = PromoCode.find(filter)
      .populate("applicableGameIds", "name code category logo")
      .sort({ order: 1, createdAt: -1 });

    const serializeAdminItems = async (items) =>
      Promise.all(
        items.map(async (promoCode) => {
          const dailyUsageCount = await getPromoDailyUsageCount(promoCode);

          return {
            ...serializePromoCode(promoCode, {
              dailyUsageCount,
            }),
            applicableGames: serializeApplicableGames(promoCode.applicableGameIds),
          };
        })
      );

    if (!usePagination) {
      const items = await baseQuery;
      return res.status(200).json(await serializeAdminItems(items));
    }

    const totalItems = await PromoCode.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const items = await PromoCode.find(filter)
      .populate("applicableGameIds", "name code category logo")
      .sort({ order: 1, createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      items: await serializeAdminItems(items),
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil promo code",
      error: error.message,
    });
  }
};

exports.getPublicPromoCodes = async (req, res) => {
  try {
    const gameId = req.query.gameId;
    const category = String(req.query.category || "").trim();
    const subtotal = toNonNegativeNumber(req.query.subtotal, 0);
    const filter = {
      isActive: true,
    };
    const applicabilityFilter = buildApplicabilityFilter({
      gameId,
      category,
    });

    if (applicabilityFilter) {
      Object.assign(filter, applicabilityFilter);
    }

    const items = await PromoCode.find(filter).sort({ order: 1, createdAt: -1 });
    const serialized = await Promise.all(
      items.map(async (promoCode) => {
        const dailyUsageCount = await getPromoDailyUsageCount(promoCode);
        return serializePromoCode(promoCode, {
          gameId,
          category,
          subtotal,
          dailyUsageCount,
        });
      })
    );

    return res.status(200).json({
      items: serialized,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil promo code publik",
      error: error.message,
    });
  }
};

exports.validatePublicPromoCode = async (req, res) => {
  try {
    const promoCode = req.body?.code;
    const gameId = req.body?.gameId;
    const category = req.body?.category;
    const subtotal = req.body?.subtotal;
    const result = await validatePromoForOrder({
      code: promoCode,
      gameId,
      category,
      subtotal,
      requireActive: true,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      promoCode: serializePromoCode(result.promoCode, {
        gameId,
        category,
        subtotal,
        dailyUsageCount: result.dailyUsageCount,
      }),
      discountAmount: result.discountAmount,
      message: "Kode promo berhasil diterapkan",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error validasi promo code",
      error: error.message,
    });
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const {
      title = "",
      code = "",
      description = "",
      discountType = "fixed",
      discountValue = 0,
      minimumOrderAmount = 0,
      maxDailyUses = 0,
      applicableGameIds = [],
      applicableCategories = [],
      isActive = true,
      order = 9999,
    } = req.body || {};

    const normalizedCode = normalizePromoCode(code);

    if (!normalizedCode) {
      return res.status(400).json({
        message: "Kode promo wajib diisi",
      });
    }

    if (toNonNegativeNumber(discountValue, 0) <= 0) {
      return res.status(400).json({
        message: "Nilai promo harus lebih besar dari 0",
      });
    }

    const duplicate = await PromoCode.findOne({ code: normalizedCode });

    if (duplicate) {
      return res.status(409).json({
        message: "Kode promo sudah digunakan",
      });
    }

    const normalizedApplicableGameIds = normalizeApplicableGameIds(
      applicableGameIds
    );

    const item = await PromoCode.create({
      title: String(title || "").trim(),
      code: normalizedCode,
      description: String(description || "").trim(),
      discountType: normalizeDiscountType(discountType),
      discountValue: toNonNegativeNumber(discountValue, 0),
      minimumOrderAmount: toNonNegativeNumber(minimumOrderAmount, 0),
      maxDailyUses: toPositiveInteger(maxDailyUses, 0),
      applicableGameIds: normalizedApplicableGameIds,
      applicableCategories:
        normalizedApplicableGameIds.length > 0
          ? []
          : normalizeApplicableCategories(applicableCategories),
      isActive: Boolean(isActive),
      order: toNonNegativeNumber(order, 9999),
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({
      message: "Error create promo code",
      error: error.message,
    });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const currentItem = await PromoCode.findById(req.params.id);

    if (!currentItem) {
      return res.status(404).json({
        message: "Promo code tidak ditemukan",
      });
    }

    const updatePayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      updatePayload.title = String(req.body.title || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
      const normalizedCode = normalizePromoCode(req.body.code);

      if (!normalizedCode) {
        return res.status(400).json({
          message: "Kode promo wajib diisi",
        });
      }

      const duplicate = await PromoCode.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Kode promo sudah digunakan",
        });
      }

      updatePayload.code = normalizedCode;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      updatePayload.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "discountType")) {
      updatePayload.discountType = normalizeDiscountType(req.body.discountType);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "discountValue")) {
      updatePayload.discountValue = toNonNegativeNumber(
        req.body.discountValue,
        currentItem.discountValue
      );

      if (updatePayload.discountValue <= 0) {
        return res.status(400).json({
          message: "Nilai promo harus lebih besar dari 0",
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "minimumOrderAmount")) {
      updatePayload.minimumOrderAmount = toNonNegativeNumber(
        req.body.minimumOrderAmount,
        currentItem.minimumOrderAmount
      );
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "maxDailyUses")) {
      updatePayload.maxDailyUses = toPositiveInteger(
        req.body.maxDailyUses,
        0
      );
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "applicableGameIds")) {
      const normalizedApplicableGameIds = normalizeApplicableGameIds(
        req.body.applicableGameIds
      );

      updatePayload.applicableGameIds = normalizedApplicableGameIds;
      updatePayload.applicableCategories =
        normalizedApplicableGameIds.length > 0
          ? []
          : normalizeApplicableCategories(req.body.applicableCategories);
    } else if (
      Object.prototype.hasOwnProperty.call(req.body, "applicableCategories")
    ) {
      updatePayload.applicableCategories = normalizeApplicableCategories(
        req.body.applicableCategories
      );
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      updatePayload.isActive = Boolean(req.body.isActive);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "order")) {
      updatePayload.order = toNonNegativeNumber(req.body.order, currentItem.order);
    }

    const updated = await PromoCode.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Error update promo code",
      error: error.message,
    });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Promo code tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Promo code berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error hapus promo code",
      error: error.message,
    });
  }
};
