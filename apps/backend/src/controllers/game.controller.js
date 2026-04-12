const Game = require("../models/Game");
const Variant = require("../models/Variant");
const {
  ORDER_PLACEHOLDER,
  isBlank,
  isExplicitOrder,
  toOrderNumber,
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

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

// GET ALL GAMES
exports.getGames = async (req, res) => {
  try {
    await normalizeGameOrders();
    await normalizeGameCategories();
    const filter = {};

    if (req.query.status) {
      filter.status = String(req.query.status).trim().toUpperCase();
    }

    if (req.query.syncSource) {
      filter.syncSource = String(req.query.syncSource).trim().toLowerCase();
    }

    if (req.query.isTrending) {
      filter.isTrending = String(req.query.isTrending).trim().toLowerCase() === "true";
    }

    const games = await Game.find(filter).sort({
      catalogOrder: 1,
      name: 1,
      createdAt: -1,
    });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: "Error ambil game" });
  }
};

exports.getStorefrontGames = async (req, res) => {
  try {
    await normalizeGameOrders();
    await normalizeGameCategories();
    const baseFilter = { status: "ACTIVE" };

    if (req.query.syncSource) {
      baseFilter.syncSource = String(req.query.syncSource).trim().toLowerCase();
    }

    const [trendingGames, allGames] = await Promise.all([
      Game.find({
        ...baseFilter,
        isTrending: true,
      })
        .sort({
          trendingOrder: 1,
          catalogOrder: 1,
          name: 1,
        })
        .select("name code logo bannerUrl provider category status syncSource isTrending trendingOrder catalogOrder"),
      Game.find(baseFilter)
        .sort({
          catalogOrder: 1,
          name: 1,
        })
        .select("name code logo bannerUrl provider category status syncSource isTrending trendingOrder catalogOrder"),
    ]);

    return res.status(200).json({
      trendingGames,
      allGames,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error ambil storefront games",
    });
  }
};

exports.getStorefrontGameDetail = async (req, res) => {
  try {
    await normalizeGameCategories();
    const code = normalizeCode(req.params.code);

    if (!code) {
      return res.status(400).json({
        message: "Code game tidak valid",
      });
    }

    const game = await Game.findOne({
      code,
      status: "ACTIVE",
    }).select(
      "name code logo bannerUrl provider category status syncSource isTrending trendingOrder catalogOrder inputs"
    );

    if (!game) {
      return res.status(404).json({
        message: "Game tidak ditemukan",
      });
    }

    const variants = await Variant.find({
      game: game._id,
      status: "ACTIVE",
    })
      .sort({
        price: 1,
        basePrice: 1,
        name: 1,
      })
      .select(
        "name providerCode productCode basePrice markup price currency duration region logo status syncSource"
      );

    return res.status(200).json({
      game,
      variants,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error ambil detail storefront game",
    });
  }
};

// CREATE GAME
exports.createGame = async (req, res) => {
  try {
    const {
      name,
      code,
      logo = "",
      bannerUrl = "",
      category = DEFAULT_GAME_CATEGORY,
      provider = "",
      status = "ACTIVE",
      isTrending = false,
      trendingOrder = 9999,
      catalogOrder = 9999,
      inputs = [],
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name dan code wajib diisi" });
    }

    const normalizedCode = normalizeCode(code);
    const existing = await Game.findOne({ code: normalizedCode });
    const configuredCategories = await getConfiguredGameCategories();

    if (existing) {
      return res.status(409).json({ message: "Code game sudah digunakan" });
    }

    const isTrendingValue = toBoolean(isTrending, false);
    const catalogOrderValue = isBlank(catalogOrder)
      ? await getNextGameOrder("catalogOrder")
      : toOrderNumber(catalogOrder, ORDER_PLACEHOLDER);
    const trendingOrderValue = isTrendingValue
      ? isBlank(trendingOrder)
        ? await getNextGameOrder("trendingOrder", { isTrending: true })
        : toOrderNumber(trendingOrder, ORDER_PLACEHOLDER)
      : ORDER_PLACEHOLDER;

    const game = new Game({
      name,
      code: normalizedCode,
      logo,
      bannerUrl,
      category: normalizeGameCategory(
        category,
        configuredCategories,
        configuredCategories[0] || DEFAULT_GAME_CATEGORY
      ),
      provider,
      status: String(status || "ACTIVE").toUpperCase(),
      isTrending: isTrendingValue,
      trendingOrder: trendingOrderValue,
      catalogOrder: catalogOrderValue,
      inputs: normalizeGameInputs(inputs),
      syncSource: "manual",
    });

    await game.save();
    await normalizeGameOrders();

    res.status(201).json({
      message: "Game berhasil dibuat",
      game,
    });
  } catch (err) {
    res.status(500).json({ message: "Error create game" });
  }
};

// UPDATE GAME
exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = { ...req.body };
    const currentGame = await Game.findById(id);
    const configuredCategories = await getConfiguredGameCategories();

    if (!currentGame) {
      return res.status(404).json({ message: "Game tidak ditemukan" });
    }

    if (req.body.code) {
      const normalizedCode = normalizeCode(req.body.code);
      const duplicate = await Game.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Code game sudah digunakan" });
      }

      updatePayload.code = normalizedCode;
    }

    if (req.body.status) {
      updatePayload.status = String(req.body.status).toUpperCase();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "category")) {
      updatePayload.category = normalizeGameCategory(
        req.body.category,
        configuredCategories,
        currentGame.category || configuredCategories[0] || DEFAULT_GAME_CATEGORY
      );
    }

    const nextIsTrending =
      req.body.isTrending != null
        ? toBoolean(req.body.isTrending, false)
        : currentGame.isTrending;

    if (req.body.isTrending != null) {
      updatePayload.isTrending = nextIsTrending;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "catalogOrder")) {
      updatePayload.catalogOrder = isBlank(req.body.catalogOrder)
        ? currentGame.catalogOrder
        : toOrderNumber(req.body.catalogOrder, currentGame.catalogOrder);
    }

    if (!nextIsTrending) {
      updatePayload.trendingOrder = ORDER_PLACEHOLDER;
    } else if (Object.prototype.hasOwnProperty.call(req.body, "trendingOrder")) {
      updatePayload.trendingOrder = isBlank(req.body.trendingOrder)
        ? isExplicitOrder(currentGame.trendingOrder)
          ? currentGame.trendingOrder
          : await getNextGameOrder("trendingOrder", { isTrending: true })
        : toOrderNumber(req.body.trendingOrder, currentGame.trendingOrder);
    }

    if (req.body.inputs && !Array.isArray(req.body.inputs)) {
      return res.status(400).json({ message: "Inputs harus berupa array" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "inputs")) {
      updatePayload.inputs = normalizeGameInputs(req.body.inputs);
    }

    const updated = await Game.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });
    await normalizeGameOrders();

    res.json({
      message: "Game berhasil diupdate",
      game: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Error update game" });
  }
};

// DELETE GAME
exports.deleteGame = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGame = await Game.findByIdAndDelete(id);

    if (!deletedGame) {
      return res.status(404).json({ message: "Game tidak ditemukan" });
    }

    await Variant.deleteMany({ game: id });

    res.json({ message: "Game berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Error delete game" });
  }
};
