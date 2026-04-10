const Game = require("../models/Game");
const Variant = require("../models/Variant");

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
        .select("name code logo provider status syncSource isTrending trendingOrder catalogOrder"),
      Game.find(baseFilter)
        .sort({
          catalogOrder: 1,
          name: 1,
        })
        .select("name code logo provider status syncSource isTrending trendingOrder catalogOrder"),
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

// CREATE GAME
exports.createGame = async (req, res) => {
  try {
    const {
      name,
      code,
      logo = "",
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

    if (existing) {
      return res.status(409).json({ message: "Code game sudah digunakan" });
    }

    const game = new Game({
      name,
      code: normalizedCode,
      logo,
      provider,
      status: String(status || "ACTIVE").toUpperCase(),
      isTrending: toBoolean(isTrending, false),
      trendingOrder: toNumber(trendingOrder, 9999),
      catalogOrder: toNumber(catalogOrder, 9999),
      inputs: Array.isArray(inputs) ? inputs : [],
      syncSource: "manual",
    });

    await game.save();

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

    if (req.body.isTrending != null) {
      updatePayload.isTrending = toBoolean(req.body.isTrending, false);
    }

    if (req.body.trendingOrder != null) {
      updatePayload.trendingOrder = toNumber(req.body.trendingOrder, 9999);
    }

    if (req.body.catalogOrder != null) {
      updatePayload.catalogOrder = toNumber(req.body.catalogOrder, 9999);
    }

    if (req.body.inputs && !Array.isArray(req.body.inputs)) {
      return res.status(400).json({ message: "Inputs harus berupa array" });
    }

    const updated = await Game.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Game tidak ditemukan" });
    }

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
