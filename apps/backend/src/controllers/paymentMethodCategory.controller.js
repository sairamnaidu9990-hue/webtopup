const PaymentMethod = require("../models/PaymentMethod");
const PaymentMethodCategory = require("../models/PaymentMethodCategory");

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function normalizeCode(value, fallbackName = "") {
  const direct = String(value || "").trim().toUpperCase();

  if (direct) {
    return direct;
  }

  return String(fallbackName || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "PAYMENT_CATEGORY";
}

exports.getPaymentMethodCategories = async (req, res) => {
  try {
    const filter = {};
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").trim().toUpperCase();
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 100);
    const usePagination =
      req.query.page != null ||
      req.query.limit != null ||
      req.query.search != null ||
      req.query.status != null;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    if (status === "ACTIVE") {
      filter.isActive = true;
    } else if (status === "INACTIVE") {
      filter.isActive = false;
    }

    if (!usePagination) {
      const items = await PaymentMethodCategory.find(filter).sort({
        order: 1,
        createdAt: -1,
      });
      return res.status(200).json(items);
    }

    const totalItems = await PaymentMethodCategory.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const items = await PaymentMethodCategory.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      items,
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil kategori metode pembayaran",
      error: error.message,
    });
  }
};

exports.createPaymentMethodCategory = async (req, res) => {
  try {
    const {
      name,
      code = "",
      description = "",
      isActive = true,
      order = 9999,
    } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({
        message: "Nama kategori metode pembayaran wajib diisi",
      });
    }

    const normalizedCode = normalizeCode(code, name);
    const duplicate = await PaymentMethodCategory.findOne({ code: normalizedCode });

    if (duplicate) {
      return res.status(409).json({
        message: "Kode kategori metode pembayaran sudah digunakan",
      });
    }

    const item = await PaymentMethodCategory.create({
      name: String(name).trim(),
      code: normalizedCode,
      description: String(description || "").trim(),
      isActive: Boolean(isActive),
      order: toNumber(order, 9999),
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({
      message: "Error create kategori metode pembayaran",
      error: error.message,
    });
  }
};

exports.updatePaymentMethodCategory = async (req, res) => {
  try {
    const currentItem = await PaymentMethodCategory.findById(req.params.id);

    if (!currentItem) {
      return res.status(404).json({
        message: "Kategori metode pembayaran tidak ditemukan",
      });
    }

    const updatePayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const normalizedName = String(req.body.name || "").trim();

      if (!normalizedName) {
        return res.status(400).json({
          message: "Nama kategori metode pembayaran wajib diisi",
        });
      }

      updatePayload.name = normalizedName;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
      const normalizedCode = normalizeCode(
        req.body.code,
        updatePayload.name || currentItem.name
      );
      const duplicate = await PaymentMethodCategory.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Kode kategori metode pembayaran sudah digunakan",
        });
      }

      updatePayload.code = normalizedCode;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      updatePayload.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "order")) {
      updatePayload.order = toNumber(req.body.order, currentItem.order || 9999);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      updatePayload.isActive = Boolean(req.body.isActive);
    }

    const updated = await PaymentMethodCategory.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Error update kategori metode pembayaran",
      error: error.message,
    });
  }
};

exports.deletePaymentMethodCategory = async (req, res) => {
  try {
    const deleted = await PaymentMethodCategory.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Kategori metode pembayaran tidak ditemukan",
      });
    }

    await PaymentMethod.updateMany(
      { category: req.params.id },
      {
        $set: {
          category: null,
        },
      }
    );

    return res.status(200).json({
      message: "Kategori metode pembayaran berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error hapus kategori metode pembayaran",
      error: error.message,
    });
  }
};
