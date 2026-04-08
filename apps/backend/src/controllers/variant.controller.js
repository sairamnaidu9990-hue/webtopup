const Variant = require("../models/Variant");
const Game = require("../models/Game");
const calculatePrice = require("../utils/calculatePrice");

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

exports.getVariants = async (req, res) => {
  try {
    const filter = {};

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

    const variants = await Variant.find(filter)
      .populate("game")
      .sort({ createdAt: -1 });

    return res.status(200).json(variants);
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
    } = req.body;

    if (!game || !name || !providerCode || basePrice == null) {
      return res.status(400).json({ message: "Data variant tidak lengkap" });
    }

    const gameDoc = await Game.findById(game);

    if (!gameDoc) {
      return res.status(404).json({ message: "Game tidak ditemukan" });
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
