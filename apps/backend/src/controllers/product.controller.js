const Product = require("../models/Product");
const Game = require("../models/Game");
const ProviderBalanceLog = require("../models/ProviderBalanceLog");
const Variant = require("../models/Variant");
const calculatePrice = require("../utils/calculatePrice");
const createSyncLog = require("../utils/createSyncLog");
const {
  ORDER_PLACEHOLDER,
  isExplicitOrder,
  getNextGameOrder,
  normalizeGameOrders,
} = require("../utils/gameOrder");
const {
  DEFAULT_GAME_CATEGORY,
  getConfiguredGameCategories,
  normalizeGameCategory,
  normalizeGameCategories,
} = require("../utils/gameCategory");
const { normalizeGameInputs } = require("../utils/gameInput");
const {
  getBangjeffProducts,
  getBangjeffProductDetail,
  getBangjeffVariants,
  getBangjeffBalance,
} = require("../services/bangjeff.service");

const DEFAULT_REGION = String(process.env.BANGJEFF_REGION || "ID").toUpperCase();
const parsedDefaultVariantMarkup = Number(process.env.DEFAULT_VARIANT_MARKUP);
const DEFAULT_VARIANT_MARKUP = Number.isFinite(parsedDefaultVariantMarkup)
  ? parsedDefaultVariantMarkup
  : 0;

function getRegion(req) {
  const region = req.body?.region || req.query?.region || DEFAULT_REGION;

  return String(region || DEFAULT_REGION).trim().toUpperCase();
}

function getRequestedProductCode(req) {
  const productCode = req.body?.productCode || req.query?.productCode;

  return productCode ? String(productCode).trim().toUpperCase() : "";
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getErrorMessage(error, fallbackMessage) {
  return error?.bangjeff?.message || error?.message || fallbackMessage;
}

function getBalanceLogSource(req) {
  const source = String(req.query?.source || req.body?.source || "")
    .trim()
    .toLowerCase();

  if (["dashboard_auto", "manual_refresh", "sync_refresh"].includes(source)) {
    return source;
  }

  return "dashboard_auto";
}

function getBalanceChangeType(deltaValue) {
  if (deltaValue > 0) {
    return "UP";
  }

  if (deltaValue < 0) {
    return "DOWN";
  }

  return "SAME";
}

async function createProviderBalanceLog({
  provider,
  region,
  membership,
  currency,
  balanceValue,
  source,
  admin,
}) {
  try {
    const previousLog = await ProviderBalanceLog.findOne({
      provider,
      region,
    })
      .sort({ createdAt: -1 })
      .select("balanceValue");

    const previousBalanceValue = toNumber(previousLog?.balanceValue);
    const deltaValue = balanceValue - previousBalanceValue;

    return await ProviderBalanceLog.create({
      provider,
      region,
      membership,
      currency,
      balanceValue,
      previousBalanceValue,
      deltaValue,
      changeType: getBalanceChangeType(deltaValue),
      source,
      triggeredBy: admin
        ? {
            adminId: admin._id || null,
            name: admin.name || "",
            email: admin.email || "",
            role: admin.role || "",
          }
        : undefined,
    });
  } catch (error) {
    console.error("Failed to write provider balance log:", error.message);
    return null;
  }
}

function serializeProviderBalanceLog(item) {
  return {
    _id: String(item?._id || ""),
    provider: String(item?.provider || "").trim(),
    region: String(item?.region || "").trim().toUpperCase(),
    membership: String(item?.membership || "").trim(),
    currency: String(item?.currency || "IDR").trim().toUpperCase(),
    balanceValue: toNumber(item?.balanceValue),
    previousBalanceValue: toNumber(item?.previousBalanceValue),
    deltaValue: toNumber(item?.deltaValue),
    changeType: String(item?.changeType || "SAME").trim().toUpperCase(),
    source: String(item?.source || "dashboard_auto").trim().toLowerCase(),
    triggeredBy: {
      name: String(item?.triggeredBy?.name || "").trim(),
      email: String(item?.triggeredBy?.email || "").trim(),
      role: String(item?.triggeredBy?.role || "").trim(),
    },
    createdAt: item?.createdAt || null,
    updatedAt: item?.updatedAt || null,
  };
}

function trimSyncErrors(errors, limit = 15) {
  return errors.slice(0, limit);
}

function normalizeRemoteStatus(status, fallback = "INACTIVE") {
  const normalized = String(status || fallback).trim().toUpperCase();
  return normalized || fallback;
}

function resolveSyncedGameStatus(existingGame, remoteStatus) {
  const nextRemoteStatus = normalizeRemoteStatus(
    remoteStatus,
    existingGame?.status || "INACTIVE"
  );

  if (
    existingGame?.statusLockedByAdmin ||
    (existingGame?.status === "INACTIVE" && nextRemoteStatus === "ACTIVE")
  ) {
    return {
      status: "INACTIVE",
      statusLockedByAdmin: true,
    };
  }

  return {
    status: nextRemoteStatus,
    statusLockedByAdmin: false,
  };
}

function resolveSyncedVariantStatus(existingVariant, remoteStatus) {
  const nextRemoteStatus = normalizeRemoteStatus(
    remoteStatus,
    existingVariant?.status || "INACTIVE"
  );

  if (
    existingVariant?.statusLockedByAdmin ||
    (existingVariant?.status === "INACTIVE" && nextRemoteStatus === "ACTIVE")
  ) {
    return {
      status: "INACTIVE",
      statusLockedByAdmin: true,
    };
  }

  return {
    status: nextRemoteStatus,
    statusLockedByAdmin: false,
  };
}

async function startSyncLog(logPayload) {
  return createSyncLog({
    ...logPayload,
    status: "PROCESSING",
    summary: {
      startedAt: new Date().toISOString(),
    },
  });
}

async function finalizeSyncLog(syncLog, logPayload, finalPayload) {
  if (syncLog?._id) {
    await createSyncLog.updateSyncLog(syncLog._id, finalPayload);
    return;
  }

  await createSyncLog({
    ...logPayload,
    ...finalPayload,
  });
}

async function syncGamesData(region) {
  const remoteGames = await getBangjeffProducts(region);

  if (!Array.isArray(remoteGames)) {
    throw new Error("BangJeff product response is invalid");
  }

  const seenCodes = [];
  const configuredCategories = await getConfiguredGameCategories();
  let nextCatalogOrder = await getNextGameOrder("catalogOrder");
  const summary = {
    totalRemote: remoteGames.length,
    created: 0,
    updated: 0,
    markedInactive: 0,
  };

  for (const item of remoteGames) {
    if (!item?.code) {
      continue;
    }

    const code = String(item.code).trim().toUpperCase();
    seenCodes.push(code);

    const existing = await Game.findOne({ code });

    if (existing) {
      const syncedStatus = resolveSyncedGameStatus(existing, item.status);
      existing.name = item.name || existing.name;
      existing.status = syncedStatus.status;
      existing.statusLockedByAdmin = syncedStatus.statusLockedByAdmin;
      existing.syncSource = "bangjeff";
      existing.inputs = Array.isArray(existing.inputs) ? existing.inputs : [];
      existing.provider = existing.provider || "";
      existing.logo = existing.logo || "";
      existing.bannerUrl = existing.bannerUrl || "";
      existing.variantCategories = Array.isArray(existing.variantCategories)
        ? existing.variantCategories
        : [];
      existing.category = normalizeGameCategory(
        existing.category,
        configuredCategories,
        configuredCategories[0] || DEFAULT_GAME_CATEGORY
      );
      if (!isExplicitOrder(existing.catalogOrder)) {
        existing.catalogOrder = nextCatalogOrder;
        nextCatalogOrder += 1;
      }
      if (!existing.isTrending) {
        existing.trendingOrder = ORDER_PLACEHOLDER;
      }
      await existing.save();
      summary.updated += 1;
      continue;
    }

    await Game.create({
      code,
      name: item.name || code,
      status: item.status || "INACTIVE",
      provider: "",
      logo: "",
      bannerUrl: "",
      category: configuredCategories[0] || DEFAULT_GAME_CATEGORY,
      catalogOrder: nextCatalogOrder,
      trendingOrder: ORDER_PLACEHOLDER,
      inputs: [],
      variantCategories: [],
      syncSource: "bangjeff",
    });

    nextCatalogOrder += 1;

    summary.created += 1;
  }

  if (seenCodes.length > 0) {
    const staleGames = await Game.updateMany(
      {
        syncSource: "bangjeff",
        code: { $nin: seenCodes },
        status: { $ne: "INACTIVE" },
      },
      {
        $set: { status: "INACTIVE" },
      }
    );

    summary.markedInactive = staleGames.modifiedCount || 0;
  }

  await normalizeGameOrders();
  await normalizeGameCategories();

  return summary;
}

async function syncGameDetailsData(region, requestedProductCode = "") {
  let productCodes = [];

  if (requestedProductCode) {
    productCodes = [requestedProductCode];
  } else {
    let games = await Game.find({ syncSource: "bangjeff" }).select("code");

    if (games.length === 0) {
      await syncGamesData(region);
      games = await Game.find({ syncSource: "bangjeff" }).select("code");
    }

    productCodes = games.map((game) => game.code);
  }

  const uniqueProductCodes = [...new Set(productCodes.filter(Boolean))];
  const configuredCategories = await getConfiguredGameCategories();
  let nextCatalogOrder = await getNextGameOrder("catalogOrder");
  const summary = {
    totalRequested: uniqueProductCodes.length,
    created: 0,
    updated: 0,
    withInputs: 0,
    withoutInputs: 0,
    failed: 0,
    errors: [],
    warnings: [],
  };

  for (const productCode of uniqueProductCodes) {
    try {
      const detail = await getBangjeffProductDetail(region, productCode);
      let game = await Game.findOne({ code: productCode });
      const inputs = normalizeGameInputs(detail?.inputs);
      const isCreate = !game;

      if (!game) {
      game = new Game({
          code: productCode,
          provider: "",
          logo: "",
          bannerUrl: "",
          catalogOrder: nextCatalogOrder,
          trendingOrder: ORDER_PLACEHOLDER,
          variantCategories: [],
          syncSource: "bangjeff",
          statusLockedByAdmin: false,
        });
        nextCatalogOrder += 1;
      }

      const syncedStatus = resolveSyncedGameStatus(game, detail?.status);
      game.name = detail?.name || game.name || productCode;
      game.status = syncedStatus.status;
      game.statusLockedByAdmin = syncedStatus.statusLockedByAdmin;
      game.inputs = inputs;
      game.provider = game.provider || "";
      game.logo = game.logo || "";
      game.bannerUrl = game.bannerUrl || "";
      game.variantCategories = Array.isArray(game.variantCategories)
        ? game.variantCategories
        : [];
      game.category = normalizeGameCategory(
        game.category,
        configuredCategories,
        configuredCategories[0] || DEFAULT_GAME_CATEGORY
      );
      if (!isExplicitOrder(game.catalogOrder)) {
        game.catalogOrder = nextCatalogOrder;
        nextCatalogOrder += 1;
      }
      if (!game.isTrending) {
        game.trendingOrder = ORDER_PLACEHOLDER;
      }
      game.syncSource = "bangjeff";

      await game.save();

      if (isCreate) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }

      if (inputs.length > 0) {
        summary.withInputs += 1;
      } else {
        summary.withoutInputs += 1;
        summary.warnings.push({
          productCode,
          message: "BangJeff product detail tidak mengembalikan input.",
        });
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        productCode,
        message: getErrorMessage(error, "Error sync product detail"),
      });
    }
  }

  summary.errors = trimSyncErrors(summary.errors);
  summary.warnings = trimSyncErrors(summary.warnings);
  await normalizeGameOrders();
  await normalizeGameCategories();
  return summary;
}

async function syncVariantsData(region, requestedProductCode = "") {
  let games = requestedProductCode
    ? await Game.find({ code: requestedProductCode })
    : await Game.find({ syncSource: "bangjeff" });

  if (games.length === 0) {
    if (requestedProductCode) {
      await syncGameDetailsData(region, requestedProductCode);
      games = await Game.find({ code: requestedProductCode });
    } else {
      await syncGamesData(region);
      games = await Game.find({ syncSource: "bangjeff" });
    }
  }

  const summary = {
    totalGames: games.length,
    created: 0,
    updated: 0,
    markedInactive: 0,
    withoutVariants: 0,
    failedGames: 0,
    errors: [],
    warnings: [],
  };

  for (const game of games) {
    if (!game.code) {
      continue;
    }

    try {
      const remoteVariants = await getBangjeffVariants(region, game.code);

      if (!Array.isArray(remoteVariants)) {
        throw new Error("BangJeff variant response is invalid");
      }

      const seenCodes = [];

       if (remoteVariants.length === 0) {
        summary.withoutVariants += 1;
        summary.warnings.push({
          productCode: game.code,
          message: "BangJeff tidak mengembalikan variant untuk product ini.",
        });
      }

      for (const item of remoteVariants) {
        if (!item?.code) {
          continue;
        }

        const providerCode = String(item.code).trim();
        const existing = await Variant.findOne({ providerCode });
        const markup = existing
          ? toNumber(existing.markup, DEFAULT_VARIANT_MARKUP)
          : DEFAULT_VARIANT_MARKUP;
        const basePrice = toNumber(item?.price?.value);
        const syncedStatus = resolveSyncedVariantStatus(existing, item?.status);
        const variantPayload = {
          game: game._id,
          name: item.name || providerCode,
          providerCode,
          productCode: game.code,
          basePrice,
          markup,
          price: calculatePrice(basePrice, markup),
          currency: item?.price?.currency || existing?.currency || "IDR",
          duration: toNumber(item?.duration),
          region: item?.region || region,
          logo: existing?.logo || "",
          variantCategoryId: existing?.variantCategoryId || "",
          isActive: syncedStatus.status === "ACTIVE",
          status: syncedStatus.status,
          statusLockedByAdmin: syncedStatus.statusLockedByAdmin,
          syncSource: "bangjeff",
        };

        seenCodes.push(providerCode);

        if (existing) {
          Object.assign(existing, variantPayload);
          await existing.save();
          summary.updated += 1;
          continue;
        }

        await Variant.create(variantPayload);
        summary.created += 1;
      }

      const staleFilter = {
        game: game._id,
        syncSource: "bangjeff",
        status: { $ne: "INACTIVE" },
      };

      if (seenCodes.length > 0) {
        staleFilter.providerCode = { $nin: seenCodes };
      }

      const staleVariants = await Variant.updateMany(
        staleFilter,
        {
          $set: {
            status: "INACTIVE",
            isActive: false,
          },
        }
      );

      summary.markedInactive += staleVariants.modifiedCount || 0;
    } catch (error) {
      summary.failedGames += 1;
      summary.errors.push({
        productCode: game.code,
        message: getErrorMessage(error, "Error sync variant"),
      });
    }
  }

  summary.errors = trimSyncErrors(summary.errors);
  summary.warnings = trimSyncErrors(summary.warnings);
  return summary;
}

async function syncGames(req, res) {
  const region = getRegion(req);
  const logPayload = {
    provider: "bangjeff",
    action: "sync_games",
    syncSource: "bangjeff",
    region,
    admin: req.admin || null,
  };
  const syncLog = await startSyncLog(logPayload);

  try {
    const summary = await syncGamesData(region);

    await finalizeSyncLog(syncLog, logPayload, {
      status: "SUCCESS",
      summary,
    });

    return res.status(200).json({
      message: "Sync product selesai",
      region,
      summary,
    });
  } catch (error) {
    await finalizeSyncLog(syncLog, logPayload, {
      status: "FAILED",
      errorMessage: getErrorMessage(error, "Sync product gagal"),
      summary: error.bangjeff || null,
    });

    return res.status(500).json({
      message: "Error sync product",
      error: getErrorMessage(error, "Sync product gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncGameDetails(req, res) {
  const region = getRegion(req);
  const productCode = getRequestedProductCode(req);
  const logPayload = {
    provider: "bangjeff",
    action: "sync_game_details",
    scope: productCode ? "product" : "provider",
    syncSource: "bangjeff",
    region,
    productCode,
    admin: req.admin || null,
  };
  const syncLog = await startSyncLog(logPayload);

  try {
    const summary = await syncGameDetailsData(region, productCode);
    const allFailed =
      summary.totalRequested > 0 && summary.failed >= summary.totalRequested;

    await finalizeSyncLog(syncLog, logPayload, {
      status: "SUCCESS",
      summary,
    });

    return res.status(allFailed ? 502 : 200).json({
      message: allFailed
        ? "Sync product detail gagal"
        : "Sync product detail selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await finalizeSyncLog(syncLog, logPayload, {
      status: "FAILED",
      errorMessage: getErrorMessage(error, "Sync product detail gagal"),
      summary: error.bangjeff || null,
    });

    return res.status(500).json({
      message: "Error sync product detail",
      error: getErrorMessage(error, "Sync product detail gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncVariants(req, res) {
  const region = getRegion(req);
  const productCode = getRequestedProductCode(req);
  const logPayload = {
    provider: "bangjeff",
    action: "sync_variants",
    scope: productCode ? "product" : "provider",
    syncSource: "bangjeff",
    region,
    productCode,
    admin: req.admin || null,
  };
  const syncLog = await startSyncLog(logPayload);

  try {
    const summary = await syncVariantsData(region, productCode);

    await finalizeSyncLog(syncLog, logPayload, {
      status: "SUCCESS",
      summary,
    });

    return res.status(200).json({
      message: "Sync variant selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await finalizeSyncLog(syncLog, logPayload, {
      status: "FAILED",
      errorMessage: getErrorMessage(error, "Sync variant gagal"),
      summary: error.bangjeff || null,
    });

    return res.status(500).json({
      message: "Error sync variant",
      error: getErrorMessage(error, "Sync variant gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncCatalog(req, res) {
  const region = getRegion(req);
  const productCode = getRequestedProductCode(req);
  const logPayload = {
    provider: "bangjeff",
    action: "sync_catalog",
    scope: productCode ? "product" : "provider",
    syncSource: "bangjeff",
    region,
    productCode,
    admin: req.admin || null,
  };
  const syncLog = await startSyncLog(logPayload);

  try {
    const games = await syncGamesData(region);
    const details = await syncGameDetailsData(region, productCode);
    const variants = await syncVariantsData(region, productCode);
    const summary = {
      games,
      details,
      variants,
    };

    await finalizeSyncLog(syncLog, logPayload, {
      status: "SUCCESS",
      summary,
    });

    return res.status(200).json({
      message: "Sync BangJeff selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await finalizeSyncLog(syncLog, logPayload, {
      status: "FAILED",
      errorMessage: getErrorMessage(error, "Sync catalog gagal"),
      summary: error.bangjeff || null,
    });

    return res.status(500).json({
      message: "Error sync catalog BangJeff",
      error: getErrorMessage(error, "Sync catalog gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function getBalance(req, res) {
  try {
    const region = getRegion(req);
    const source = getBalanceLogSource(req);
    const balanceData = await getBangjeffBalance(region);
    const resolvedRegion = balanceData?.region || region;
    const currency = balanceData?.balance?.currency || "IDR";
    const balanceValue = toNumber(balanceData?.balance?.value);

    await createProviderBalanceLog({
      provider: "bangjeff",
      region: resolvedRegion,
      membership: balanceData?.membership || "",
      currency,
      balanceValue,
      source,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Saldo BangJeff berhasil diambil",
      region,
      data: {
        membership: balanceData?.membership || "",
        region: resolvedRegion,
        balance: {
          currency,
          value: balanceValue,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil saldo BangJeff",
      error: getErrorMessage(error, "Ambil saldo BangJeff gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function getBalanceLogs(req, res) {
  try {
    const region = getRegion(req);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 50);
    const items = await ProviderBalanceLog.find({
      provider: "bangjeff",
      region,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      items: items.map(serializeProviderBalanceLog),
      limit,
      region,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil log saldo BangJeff",
      error: error.message,
    });
  }
}

async function getProducts(req, res) {
  try {
    const filter = {};

    if (req.query.game) {
      filter.game = req.query.game;
    }

    const products = await Product.find(filter)
      .populate("game")
      .sort({ createdAt: -1 });

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil product",
      error: error.message,
    });
  }
}

async function createProduct(req, res) {
  try {
    const { name, game, basePrice, markup, providerCode, logo } = req.body;

    if (!name || !game || basePrice == null || markup == null) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const basePriceValue = toNumber(basePrice);
    const markupValue = toNumber(markup);
    const price = calculatePrice(basePriceValue, markupValue);

    const product = new Product({
      name,
      game,
      basePrice: basePriceValue,
      markup: markupValue,
      price,
      providerCode,
      logo,
    });

    await product.save();

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({
      message: "Error create product",
      error: error.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product tidak ditemukan" });
    }

    const nextBasePrice =
      req.body.basePrice != null
        ? toNumber(req.body.basePrice)
        : toNumber(product.basePrice);
    const nextMarkup =
      req.body.markup != null
        ? toNumber(req.body.markup)
        : toNumber(product.markup);

    const updatePayload = {
      ...req.body,
      ...(req.body.basePrice != null && { basePrice: nextBasePrice }),
      ...(req.body.markup != null && { markup: nextMarkup }),
    };

    if (req.body.basePrice != null || req.body.markup != null) {
      updatePayload.price = calculatePrice(nextBasePrice, nextMarkup);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Error update product",
      error: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({
      message: "Error delete product",
      error: error.message,
    });
  }
}

module.exports = {
  syncGames,
  syncGameDetails,
  syncVariants,
  syncCatalog,
  getBalance,
  getBalanceLogs,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
