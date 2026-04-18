const Variant = require("../models/Variant");
const Game = require("../models/Game");
const calculatePrice = require("../utils/calculatePrice");
const createSyncLog = require("../utils/createSyncLog");
const {
  resolveVariantCategoryId,
} = require("../utils/variantCategory");

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getMarkupValue(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function getSyncSourceValue(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "bangjeff" || normalized === "manual") {
    return normalized;
  }

  return null;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function applyMarkupToVariants(filter, markup) {
  const variants = await Variant.find(filter).select("_id basePrice");

  if (variants.length === 0) {
    return 0;
  }

  const operations = variants.map((variant) => {
    const basePrice = toNumber(variant.basePrice);

    return {
      updateOne: {
        filter: { _id: variant._id },
        update: {
          $set: {
            markup,
            price: calculatePrice(basePrice, markup),
          },
        },
      },
    };
  });

  const result = await Variant.bulkWrite(operations);
  return result.modifiedCount || 0;
}

exports.getVariants = async (req, res) => {
  try {
    const filter = {};
    const search = String(req.query.search || "").trim();
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 100);
    const usePagination =
      req.query.page != null ||
      req.query.limit != null ||
      req.query.search != null;

    if (req.query.game) {
      filter.game = req.query.game;
    }

    if (req.query.productCode) {
      filter.productCode = String(req.query.productCode).trim().toUpperCase();
    }

    if (req.query.status) {
      filter.status = String(req.query.status).trim().toUpperCase();
    }

    if (req.query.syncSource) {
      filter.syncSource = String(req.query.syncSource).trim().toLowerCase();
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const matchingGames = await Game.find({
        $or: [{ name: regex }, { code: regex }],
      }).distinct("_id");

      filter.$or = [
        { name: regex },
        { providerCode: regex },
        { productCode: regex },
        { region: regex },
        { currency: regex },
        ...(matchingGames.length > 0 ? [{ game: { $in: matchingGames } }] : []),
      ];
    }

    const baseQuery = Variant.find(filter)
      .populate("game", "name code variantCategories")
      .sort({ createdAt: -1 });

    if (!usePagination) {
      const variants = await baseQuery;
      return res.status(200).json(variants);
    }

    const totalItems = await Variant.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    const safePage = Math.min(page, totalPages);
    const variants = await Variant.find(filter)
      .populate("game", "name code variantCategories")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      items: variants,
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil variant",
      error: error.message,
    });
  }
};

exports.createVariant = async (req, res) => {
  try {
    const {
      game,
      name,
      providerCode,
      basePrice,
      markup = 0,
      logo = "",
      status = "ACTIVE",
      region = "ID",
      currency = "IDR",
      duration = 0,
      variantCategoryId = "",
    } = req.body;

    if (!game || !name || !providerCode || basePrice == null) {
      return res.status(400).json({ message: "Data variant tidak lengkap" });
    }

    const gameDoc = await Game.findById(game);

    if (!gameDoc) {
      return res.status(404).json({ message: "Game tidak ditemukan" });
    }

    const resolvedVariantCategoryId = resolveVariantCategoryId(
      gameDoc,
      variantCategoryId
    );

    if (resolvedVariantCategoryId === null) {
      return res.status(400).json({
        message: "Kategori variant tidak valid untuk game ini",
      });
    }

    const normalizedProviderCode = String(providerCode).trim();
    const existing = await Variant.findOne({ providerCode: normalizedProviderCode });

    if (existing) {
      return res.status(409).json({ message: "Provider code variant sudah digunakan" });
    }

    const basePriceValue = toNumber(basePrice);
    const markupValue = toNumber(markup);
    const variant = await Variant.create({
      game,
      name,
      providerCode: normalizedProviderCode,
      productCode: gameDoc.code,
      basePrice: basePriceValue,
      markup: markupValue,
      price: calculatePrice(basePriceValue, markupValue),
      logo,
      status: String(status).toUpperCase(),
      isActive: String(status).toUpperCase() === "ACTIVE",
      region: String(region).toUpperCase(),
      currency: String(currency).toUpperCase(),
      duration: toNumber(duration),
      variantCategoryId: resolvedVariantCategoryId,
      syncSource: "manual",
    });

    return res.status(201).json(variant);
  } catch (error) {
    return res.status(500).json({
      message: "Error create variant",
      error: error.message,
    });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({ message: "Variant tidak ditemukan" });
    }

    const updatePayload = { ...req.body };

    if (req.body.providerCode) {
      const normalizedProviderCode = String(req.body.providerCode).trim();
      const duplicate = await Variant.findOne({
        providerCode: normalizedProviderCode,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Provider code variant sudah digunakan" });
      }

      updatePayload.providerCode = normalizedProviderCode;
    }

    if (req.body.game) {
      const gameDoc = await Game.findById(req.body.game);

      if (!gameDoc) {
        return res.status(404).json({ message: "Game tidak ditemukan" });
      }

      updatePayload.productCode = gameDoc.code;
      const resolvedVariantCategoryId = resolveVariantCategoryId(
        gameDoc,
        Object.prototype.hasOwnProperty.call(req.body, "variantCategoryId")
          ? req.body.variantCategoryId
          : variant.variantCategoryId
      );

      if (resolvedVariantCategoryId === null) {
        return res.status(400).json({
          message: "Kategori variant tidak valid untuk game ini",
        });
      }

      updatePayload.variantCategoryId = resolvedVariantCategoryId;
    } else if (
      Object.prototype.hasOwnProperty.call(req.body, "variantCategoryId")
    ) {
      const gameDoc = await Game.findById(variant.game);

      if (!gameDoc) {
        return res.status(404).json({ message: "Game tidak ditemukan" });
      }

      const resolvedVariantCategoryId = resolveVariantCategoryId(
        gameDoc,
        req.body.variantCategoryId
      );

      if (resolvedVariantCategoryId === null) {
        return res.status(400).json({
          message: "Kategori variant tidak valid untuk game ini",
        });
      }

      updatePayload.variantCategoryId = resolvedVariantCategoryId;
    }

    if (req.body.status) {
      updatePayload.status = String(req.body.status).toUpperCase();
      updatePayload.isActive = updatePayload.status === "ACTIVE";
    }

    const nextBasePrice =
      req.body.basePrice != null
        ? toNumber(req.body.basePrice)
        : toNumber(variant.basePrice);
    const nextMarkup =
      req.body.markup != null
        ? toNumber(req.body.markup)
        : toNumber(variant.markup);

    if (req.body.basePrice != null || req.body.markup != null) {
      updatePayload.basePrice = nextBasePrice;
      updatePayload.markup = nextMarkup;
      updatePayload.price = calculatePrice(nextBasePrice, nextMarkup);
    }

    if (req.body.region) {
      updatePayload.region = String(req.body.region).toUpperCase();
    }

    if (req.body.currency) {
      updatePayload.currency = String(req.body.currency).toUpperCase();
    }

    if (req.body.duration != null) {
      updatePayload.duration = toNumber(req.body.duration);
    }

    const updated = await Variant.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
    }).populate("game");

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Error update variant",
      error: error.message,
    });
  }
};

exports.syncMarkupAllVariants = async (req, res) => {
  try {
    const markup = getMarkupValue(req.body?.markup);
    const syncSource = getSyncSourceValue(req.body?.syncSource);

    if (markup == null) {
      return res.status(400).json({
        message: "Markup harus berupa angka yang valid",
      });
    }

    if (syncSource === null) {
      return res.status(400).json({
        message: "Sync source tidak valid",
      });
    }

    const filter = syncSource ? { syncSource } : {};
    const totalVariants = await Variant.countDocuments(filter);
    const updatedCount = await applyMarkupToVariants(filter, markup);
    const summary = {
      scope: "all",
      markup,
      syncSource: syncSource || "all",
      totalVariants,
      updatedCount,
    };

    await createSyncLog({
      provider: syncSource || "catalog",
      action: "sync_markup_all_variants",
      scope: "all",
      status: "SUCCESS",
      syncSource: syncSource || "all",
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync markup semua variant selesai",
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: getSyncSourceValue(req.body?.syncSource) || "catalog",
      action: "sync_markup_all_variants",
      scope: "all",
      status: "FAILED",
      syncSource: getSyncSourceValue(req.body?.syncSource) || "all",
      errorMessage: error.message,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync markup semua variant",
      error: error.message,
    });
  }
};

exports.syncMarkupByGame = async (req, res) => {
  try {
    const gameId = String(req.params.gameId || "").trim();
    const markup = getMarkupValue(req.body?.markup);
    const syncSource = getSyncSourceValue(req.body?.syncSource);

    if (!gameId) {
      return res.status(400).json({
        message: "Game wajib dipilih",
      });
    }

    if (markup == null) {
      return res.status(400).json({
        message: "Markup harus berupa angka yang valid",
      });
    }

    if (syncSource === null) {
      return res.status(400).json({
        message: "Sync source tidak valid",
      });
    }

    const game = await Game.findOne({
      _id: gameId,
      ...(syncSource ? { syncSource } : {}),
    }).select("_id name code syncSource");

    if (!game) {
      return res.status(404).json({
        message: "Game tidak ditemukan",
      });
    }

    const filter = {
      game: game._id,
      ...(syncSource ? { syncSource } : {}),
    };
    const totalVariants = await Variant.countDocuments(filter);
    const updatedCount = await applyMarkupToVariants(filter, markup);
    const summary = {
      scope: "game",
      markup,
      syncSource: syncSource || game.syncSource || "all",
      totalVariants,
      updatedCount,
      game: {
        _id: game._id,
        name: game.name,
        code: game.code,
      },
    };

    await createSyncLog({
      provider: syncSource || game.syncSource || "catalog",
      action: "sync_markup_game_variants",
      scope: "game",
      status: "SUCCESS",
      syncSource: syncSource || game.syncSource || "all",
      productCode: game.code || "",
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync markup per game selesai",
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: getSyncSourceValue(req.body?.syncSource) || "catalog",
      action: "sync_markup_game_variants",
      scope: "game",
      status: "FAILED",
      syncSource: getSyncSourceValue(req.body?.syncSource) || "all",
      productCode: "",
      errorMessage: error.message,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync markup per game",
      error: error.message,
    });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const deleted = await Variant.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Variant tidak ditemukan" });
    }

    return res.status(200).json({ message: "Variant berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({
      message: "Error delete variant",
      error: error.message,
    });
  }
};
