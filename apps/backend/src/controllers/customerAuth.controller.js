const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");
const generateCustomerToken = require("../utils/generateCustomerToken");
const { verifyRecaptchaToken } = require("../utils/verifyRecaptcha");
const {
  generateUniqueReferralCode,
  normalizeReferralCode,
} = require("../utils/customerRewards");

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

async function ensureCustomerReferralCode(customer) {
  if (!customer || String(customer.referralCode || "").trim()) {
    return customer;
  }

  customer.referralCode = await generateUniqueReferralCode(
    customer.username || customer.name || customer.email
  );
  await customer.save();

  return customer;
}

function serializeCustomer(customer) {
  return {
    id: customer._id,
    username: customer.username,
    name: customer.name,
    email: customer.email,
    phoneCountryCode: customer.phoneCountryCode || "+62",
    phoneNumber: customer.phoneNumber || "",
    balance: Number(customer.balance || 0),
    referralCode: String(customer.referralCode || "").trim(),
    referredBy: customer.referredBy
      ? String(customer.referredBy._id || customer.referredBy)
      : "",
    loyaltyPoints: Number(customer.loyaltyPoints || 0),
    totalLoyaltyPointsEarned: Number(customer.totalLoyaltyPointsEarned || 0),
    totalLoyaltyPointsRedeemed: Number(customer.totalLoyaltyPointsRedeemed || 0),
    referralBonusGrantedAt: customer.referralBonusGrantedAt || null,
    isActive: Boolean(customer.isActive),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

async function registerCustomer(req, res) {
  try {
    const {
      username,
      name,
      email,
      phoneCountryCode = "+62",
      phoneNumber,
      password,
      referralCode,
      recaptchaToken,
    } = req.body || {};

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, {
      remoteIp: req.ip,
    });

    if (!recaptchaResult.success) {
      return res.status(recaptchaResult.statusCode || 400).json({
        message: recaptchaResult.message || "Verifikasi reCAPTCHA gagal",
      });
    }

    if (!username || !name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        message: "Username, nama, email, nomor HP, dan password wajib diisi",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const normalizedReferralCode = normalizeReferralCode(referralCode);

    if (!normalizedUsername) {
      return res.status(400).json({
        message: "Username tidak valid",
      });
    }

    const [existingUsername, existingEmail] = await Promise.all([
      Customer.findOne({ username: normalizedUsername }),
      Customer.findOne({ email: normalizedEmail }),
    ]);

    if (existingUsername) {
      return res.status(409).json({
        message: "Username sudah digunakan",
      });
    }

    if (existingEmail) {
      return res.status(409).json({
        message: "Email sudah digunakan",
      });
    }

    if (!normalizedPhoneNumber) {
      return res.status(400).json({
        message: "Nomor HP tidak valid",
      });
    }

    const existingPhoneNumber = await Customer.findOne({
      phoneNumber: normalizedPhoneNumber,
    });

    if (existingPhoneNumber) {
      return res.status(409).json({
        message: "Nomor HP sudah digunakan",
      });
    }

    let referredByCustomer = null;

    if (normalizedReferralCode) {
      referredByCustomer = await Customer.findOne({
        referralCode: normalizedReferralCode,
        isActive: true,
      }).select("_id");

      if (!referredByCustomer) {
        return res.status(404).json({
          message: "Kode referral tidak ditemukan atau sudah tidak aktif",
        });
      }
    }

    const generatedReferralCode = await generateUniqueReferralCode(normalizedUsername);

    const customer = await Customer.create({
      username: normalizedUsername,
      name: String(name).trim(),
      email: normalizedEmail,
      phoneCountryCode: String(phoneCountryCode || "+62").trim() || "+62",
      phoneNumber: normalizedPhoneNumber,
      referralCode: generatedReferralCode,
      referredBy: referredByCustomer?._id || null,
      password: await bcrypt.hash(String(password), 10),
    });

    const token = generateCustomerToken(customer);

    return res.status(201).json({
      message: "Akun berhasil dibuat",
      token,
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat akun customer",
      error: error.message,
    });
  }
}

async function loginCustomer(req, res) {
  try {
    const { login, password, recaptchaToken } = req.body || {};
    const normalizedLogin = String(login || "").trim().toLowerCase();

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, {
      remoteIp: req.ip,
    });

    if (!recaptchaResult.success) {
      return res.status(recaptchaResult.statusCode || 400).json({
        message: recaptchaResult.message || "Verifikasi reCAPTCHA gagal",
      });
    }

    if (!normalizedLogin || !password) {
      return res.status(400).json({
        message: "Username/email dan password wajib diisi",
      });
    }

    const customer = await Customer.findOne({
      $or: [{ email: normalizedLogin }, { username: normalizedLogin }],
    });

    if (!customer) {
      return res.status(401).json({
        message: "Login atau password salah",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        message: "Akun customer tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(String(password), customer.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Login atau password salah",
      });
    }

    await ensureCustomerReferralCode(customer);

    const token = generateCustomerToken(customer);

    return res.status(200).json({
      message: "Login berhasil",
      token,
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal login customer",
      error: error.message,
    });
  }
}

async function getCurrentCustomer(req, res) {
  try {
    await ensureCustomerReferralCode(req.customer);

    return res.status(200).json({
      customer: serializeCustomer(req.customer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data customer",
      error: error.message,
    });
  }
}

async function logoutCustomer(req, res) {
  return res.status(200).json({
    message: "Logout berhasil",
  });
}

module.exports = {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  logoutCustomer,
  serializeCustomer,
};
