const Customer = require("../models/Customer");
const { serializeCustomer } = require("./customerAuth.controller");

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function toBoolean(value, fallback = true) {
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

async function getCustomers(req, res) {
  try {
    const customers = await Customer.find()
      .select("-password")
      .sort({ createdAt: -1, name: 1 });

    return res.status(200).json({
      customers: customers.map(serializeCustomer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data user",
      error: error.message,
    });
  }
}

async function updateCustomer(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    if (req.body.username != null) {
      const username = normalizeUsername(req.body.username);

      if (!username) {
        return res.status(400).json({
          message: "Username tidak valid",
        });
      }

      const duplicate = await Customer.findOne({
        username,
        _id: { $ne: customer._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Username sudah digunakan",
        });
      }

      customer.username = username;
    }

    if (req.body.name != null) {
      customer.name = String(req.body.name).trim();
    }

    if (req.body.email != null) {
      const email = normalizeEmail(req.body.email);
      const duplicate = await Customer.findOne({
        email,
        _id: { $ne: customer._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Email sudah digunakan",
        });
      }

      customer.email = email;
    }

    if (req.body.phoneCountryCode != null) {
      customer.phoneCountryCode =
        String(req.body.phoneCountryCode || "+62").trim() || "+62";
    }

    if (req.body.phoneNumber != null) {
      const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);

      if (!phoneNumber) {
        return res.status(400).json({
          message: "Nomor HP tidak valid",
        });
      }

      const duplicate = await Customer.findOne({
        phoneNumber,
        _id: { $ne: customer._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Nomor HP sudah digunakan",
        });
      }

      customer.phoneNumber = phoneNumber;
    }

    if (req.body.isActive != null) {
      customer.isActive = toBoolean(req.body.isActive, customer.isActive);
    }

    await customer.save();

    return res.status(200).json({
      message: "User berhasil diperbarui",
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui user",
      error: error.message,
    });
  }
}

module.exports = {
  getCustomers,
  updateCustomer,
};
