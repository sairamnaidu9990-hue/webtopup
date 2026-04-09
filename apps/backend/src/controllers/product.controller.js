const Product = require("../models/Product");
const Game = require("../models/Game");
const Variant = require("../models/Variant");
const calculatePrice = require("../utils/calculatePrice");
const createSyncLog = require("../utils/createSyncLog");
const {
  getBangjeffProducts,
  getBangjeffProductDetail,
  getBangjeffVariants,
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

function trimSyncErrors(errors, limit = 15) {
  return errors.slice(0, limit);
}

async function syncGamesData(region) {
  const remoteGames = await getBangjeffProducts(region);

  if (!Array.isArray(remoteGames)) {
    throw new Error("BangJeff product response is invalid");
  }

  const seenCodes = [];
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
      existing.name = item.name || existing.name;
      existing.status = item.status || existing.status || "INACTIVE";
      existing.syncSource = "bangjeff";
      existing.inputs = Array.isArray(existing.inputs) ? existing.inputs : [];
      existing.provider = existing.provider || "";
      existing.logo = existing.logo || "";
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
      inputs: [],
      syncSource: "bangjeff",
    });

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
  const summary = {
    totalRequested: uniqueProductCodes.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const productCode of uniqueProductCodes) {
    try {
      const detail = await getBangjeffProductDetail(region, productCode);
      let game = await Game.findOne({ code: productCode });

      if (!game) {
        game = new Game({
          code: productCode,
          provider: "",
          logo: "",
          syncSource: "bangjeff",
        });
        summary.created += 1;
      } else {
        summary.updated += 1;
      }

      game.name = detail?.name || game.name || productCode;
      game.status = detail?.status || game.status || "INACTIVE";
      game.inputs = Array.isArray(detail?.inputs) ? detail.inputs : [];
      game.provider = game.provider || "";
      game.logo = game.logo || "";
      game.syncSource = "bangjeff";

      await game.save();
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        productCode,
        message: getErrorMessage(error, "Error sync product detail"),
      });
    }
  }

  summary.errors = trimSyncErrors(summary.errors);
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
    failedGames: 0,
    errors: [],
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
          isActive: item?.status === "ACTIVE",
          status: item?.status || "INACTIVE",
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

      if (seenCodes.length > 0) {
        const staleVariants = await Variant.updateMany(
          {
            game: game._id,
            syncSource: "bangjeff",
            providerCode: { $nin: seenCodes },
            status: { $ne: "INACTIVE" },
          },
          {
            $set: {
              status: "INACTIVE",
              isActive: false,
            },
          }
        );

        summary.markedInactive += staleVariants.modifiedCount || 0;
      }
    } catch (error) {
      summary.failedGames += 1;
      summary.errors.push({
        productCode: game.code,
        message: getErrorMessage(error, "Error sync variant"),
      });
    }
  }

  summary.errors = trimSyncErrors(summary.errors);
  return summary;
}

async function syncGames(req, res) {
  try {
    const region = getRegion(req);
    const summary = await syncGamesData(region);

    await createSyncLog({
      provider: "bangjeff",
      action: "sync_games",
      status: "SUCCESS",
      syncSource: "bangjeff",
      region,
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync product selesai",
      region,
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: "bangjeff",
      action: "sync_games",
      status: "FAILED",
      syncSource: "bangjeff",
      region: getRegion(req),
      errorMessage: getErrorMessage(error, "Sync product gagal"),
      summary: error.bangjeff || null,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync product",
      error: getErrorMessage(error, "Sync product gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncGameDetails(req, res) {
  try {
    const region = getRegion(req);
    const productCode = getRequestedProductCode(req);
    const summary = await syncGameDetailsData(region, productCode);

    await createSyncLog({
      provider: "bangjeff",
      action: "sync_game_details",
      scope: productCode ? "product" : "provider",
      status: "SUCCESS",
      syncSource: "bangjeff",
      region,
      productCode,
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync product detail selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: "bangjeff",
      action: "sync_game_details",
      scope: getRequestedProductCode(req) ? "product" : "provider",
      status: "FAILED",
      syncSource: "bangjeff",
      region: getRegion(req),
      productCode: getRequestedProductCode(req),
      errorMessage: getErrorMessage(error, "Sync product detail gagal"),
      summary: error.bangjeff || null,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync product detail",
      error: getErrorMessage(error, "Sync product detail gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncVariants(req, res) {
  try {
    const region = getRegion(req);
    const productCode = getRequestedProductCode(req);
    const summary = await syncVariantsData(region, productCode);

    await createSyncLog({
      provider: "bangjeff",
      action: "sync_variants",
      scope: productCode ? "product" : "provider",
      status: "SUCCESS",
      syncSource: "bangjeff",
      region,
      productCode,
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync variant selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: "bangjeff",
      action: "sync_variants",
      scope: getRequestedProductCode(req) ? "product" : "provider",
      status: "FAILED",
      syncSource: "bangjeff",
      region: getRegion(req),
      productCode: getRequestedProductCode(req),
      errorMessage: getErrorMessage(error, "Sync variant gagal"),
      summary: error.bangjeff || null,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync variant",
      error: getErrorMessage(error, "Sync variant gagal"),
      response: error.bangjeff || null,
    });
  }
}

async function syncCatalog(req, res) {
  try {
    const region = getRegion(req);
    const productCode = getRequestedProductCode(req);
    const games = await syncGamesData(region);
    const details = await syncGameDetailsData(region, productCode);
    const variants = await syncVariantsData(region, productCode);
    const summary = {
      games,
      details,
      variants,
    };

    await createSyncLog({
      provider: "bangjeff",
      action: "sync_catalog",
      scope: productCode ? "product" : "provider",
      status: "SUCCESS",
      syncSource: "bangjeff",
      region,
      productCode,
      summary,
      admin: req.admin || null,
    });

    return res.status(200).json({
      message: "Sync BangJeff selesai",
      region,
      productCode: productCode || null,
      summary,
    });
  } catch (error) {
    await createSyncLog({
      provider: "bangjeff",
      action: "sync_catalog",
      scope: getRequestedProductCode(req) ? "product" : "provider",
      status: "FAILED",
      syncSource: "bangjeff",
      region: getRegion(req),
      productCode: getRequestedProductCode(req),
      errorMessage: getErrorMessage(error, "Sync catalog gagal"),
      summary: error.bangjeff || null,
      admin: req.admin || null,
    });

    return res.status(500).json({
      message: "Error sync catalog BangJeff",
      error: getErrorMessage(error, "Sync catalog gagal"),
      response: error.bangjeff || null,
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
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
