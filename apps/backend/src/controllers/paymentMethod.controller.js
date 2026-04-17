const PaymentMethod = require("../models/PaymentMethod");
const PaymentMethodCategory = require("../models/PaymentMethodCategory");

const PAYMENT_METHOD_TYPES = [
  "bank_transfer",
  "ewallet",
  "qris",
  "retail",
  "virtual_account",
];
const PAYMENT_FEE_TYPES = ["fixed", "percent"];

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

function normalizeType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PAYMENT_METHOD_TYPES.includes(normalized)
    ? normalized
    : "bank_transfer";
}

function normalizeFeeType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PAYMENT_FEE_TYPES.includes(normalized) ? normalized : "fixed";
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeCurrency(value) {
  return String(value || "IDR").trim().toUpperCase() || "IDR";
}

function isManualProvider(value) {
  return String(value || "manual").trim().toLowerCase() === "manual";
}

async function resolveCategory(categoryId) {
  const normalizedId = String(categoryId || "").trim();

  if (!normalizedId) {
    return null;
  }

  return PaymentMethodCategory.findById(normalizedId);
}

function populateCategory(query) {
  return query.populate("category", "name code order isActive");
}

exports.getPaymentMethods = async (req, res) => {
  try {
    const filter = {};
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").trim().toUpperCase();
    const type = String(req.query.type || "ALL").trim().toLowerCase();
    const category = String(req.query.category || "").trim();
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 100);
    const usePagination =
      req.query.page != null ||
      req.query.limit != null ||
      req.query.search != null ||
      req.query.status != null ||
      req.query.type != null ||
      req.query.category != null;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: regex },
        { code: regex },
        { gatewayChannelCode: regex },
        { description: regex },
      ];
    }

    if (status === "ACTIVE") {
      filter.isActive = true;
    } else if (status === "INACTIVE") {
      filter.isActive = false;
    }

    if (PAYMENT_METHOD_TYPES.includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const baseQuery = populateCategory(PaymentMethod.find(filter)).sort({
      order: 1,
      createdAt: -1,
    });

    if (!usePagination) {
      const items = await baseQuery;
      return res.status(200).json(items);
    }

    const totalItems = await PaymentMethod.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const items = await populateCategory(
      PaymentMethod.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((safePage - 1) * limit)
        .limit(limit)
    );

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
      message: "Error ambil metode pembayaran",
      error: error.message,
    });
  }
};

exports.getPublicPaymentMethods = async (req, res) => {
  try {
    const items = await populateCategory(
      PaymentMethod.find({ isActive: true })
        .sort({ order: 1, createdAt: -1 })
        .select(
          "name code provider logo type feeType feeValue currency gatewayChannelCode description order category"
        )
    );

    const visibleItems = items.filter(
      (item) => !item.category || item.category.isActive !== false
    );

    return res.status(200).json({
      items: visibleItems,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil metode pembayaran publik",
      error: error.message,
    });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const {
      name,
      code,
      provider = "manual",
      logo = "",
      type = "bank_transfer",
      category = "",
      feeType = "fixed",
      feeValue = 0,
      currency = "IDR",
      gatewayChannelCode = "",
      description = "",
      accountHolderName = "",
      accountNumber = "",
      isActive = true,
      order = 9999,
    } = req.body;

    if (!String(name || "").trim() || !String(code || "").trim()) {
      return res.status(400).json({
        message: "Nama dan kode metode pembayaran wajib diisi",
      });
    }

    const normalizedCode = normalizeCode(code);
    const duplicate = await PaymentMethod.findOne({ code: normalizedCode });

    if (duplicate) {
      return res.status(409).json({
        message: "Kode metode pembayaran sudah digunakan",
      });
    }

    const normalizedProvider = String(provider || "manual").trim();
    const normalizedAccountHolderName = String(accountHolderName || "").trim();
    const normalizedAccountNumber = String(accountNumber || "").trim();

    if (
      isManualProvider(normalizedProvider) &&
      (!normalizedAccountHolderName || !normalizedAccountNumber)
    ) {
      return res.status(400).json({
        message: "Nama rekening dan nomor rekening wajib diisi untuk metode pembayaran manual",
      });
    }

    const categoryDocument = await resolveCategory(category);

    if (category && !categoryDocument) {
      return res.status(400).json({
        message: "Kategori metode pembayaran tidak valid",
      });
    }

    const item = await PaymentMethod.create({
      name: String(name).trim(),
      code: normalizedCode,
      provider: normalizedProvider,
      category: categoryDocument?._id || null,
      logo: String(logo || "").trim(),
      type: normalizeType(type),
      feeType: normalizeFeeType(feeType),
      feeValue: toNumber(feeValue),
      currency: normalizeCurrency(currency),
      gatewayChannelCode: String(gatewayChannelCode || "").trim(),
      description: String(description || "").trim(),
      accountHolderName: normalizedAccountHolderName,
      accountNumber: normalizedAccountNumber,
      isActive: Boolean(isActive),
      order: toNumber(order, 9999),
    });

    const created = await populateCategory(PaymentMethod.findById(item._id));

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({
      message: "Error create metode pembayaran",
      error: error.message,
    });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const currentItem = await PaymentMethod.findById(req.params.id);

    if (!currentItem) {
      return res.status(404).json({
        message: "Metode pembayaran tidak ditemukan",
      });
    }

    const updatePayload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      updatePayload.name = String(req.body.name || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
      const normalizedCode = normalizeCode(req.body.code);

      if (!normalizedCode) {
        return res.status(400).json({
          message: "Kode metode pembayaran wajib diisi",
        });
      }

      const duplicate = await PaymentMethod.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Kode metode pembayaran sudah digunakan",
        });
      }

      updatePayload.code = normalizedCode;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "type")) {
      updatePayload.type = normalizeType(req.body.type);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "feeType")) {
      updatePayload.feeType = normalizeFeeType(req.body.feeType);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "feeValue")) {
      updatePayload.feeValue = toNumber(req.body.feeValue);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "currency")) {
      updatePayload.currency = normalizeCurrency(req.body.currency);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "order")) {
      updatePayload.order = toNumber(req.body.order, currentItem.order || 9999);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      updatePayload.isActive = Boolean(req.body.isActive);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "provider")) {
      updatePayload.provider = String(req.body.provider || "manual").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "category")) {
      const categoryDocument = await resolveCategory(req.body.category);

      if (req.body.category && !categoryDocument) {
        return res.status(400).json({
          message: "Kategori metode pembayaran tidak valid",
        });
      }

      updatePayload.category = categoryDocument?._id || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "logo")) {
      updatePayload.logo = String(req.body.logo || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "gatewayChannelCode")) {
      updatePayload.gatewayChannelCode = String(
        req.body.gatewayChannelCode || ""
      ).trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      updatePayload.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "accountHolderName")) {
      updatePayload.accountHolderName = String(
        req.body.accountHolderName || ""
      ).trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "accountNumber")) {
      updatePayload.accountNumber = String(req.body.accountNumber || "").trim();
    }

    const nextProvider = Object.prototype.hasOwnProperty.call(updatePayload, "provider")
      ? updatePayload.provider
      : currentItem.provider;
    const nextAccountHolderName = Object.prototype.hasOwnProperty.call(
      updatePayload,
      "accountHolderName"
    )
      ? updatePayload.accountHolderName
      : currentItem.accountHolderName;
    const nextAccountNumber = Object.prototype.hasOwnProperty.call(
      updatePayload,
      "accountNumber"
    )
      ? updatePayload.accountNumber
      : currentItem.accountNumber;

    if (
      isManualProvider(nextProvider) &&
      (!nextAccountHolderName || !nextAccountNumber)
    ) {
      return res.status(400).json({
        message: "Nama rekening dan nomor rekening wajib diisi untuk metode pembayaran manual",
      });
    }

    const updated = await populateCategory(
      PaymentMethod.findByIdAndUpdate(req.params.id, updatePayload, {
        new: true,
      })
    );

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({
      message: "Error update metode pembayaran",
      error: error.message,
    });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const deleted = await PaymentMethod.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Metode pembayaran tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Metode pembayaran berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error hapus metode pembayaran",
      error: error.message,
    });
  }
};
