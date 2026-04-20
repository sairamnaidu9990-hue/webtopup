const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { logError, logWarn } = require("../utils/appLogger");

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "")
      .toLowerCase()
      .trim();

    if (!email || !password) {
      res.locals.skipRequestLog = true;
      logWarn({
        source: "backend",
        scope: "auth",
        message: "Percobaan login admin tanpa email atau password lengkap",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url || "",
        statusCode: 400,
        meta: {
          email: normalizedEmail,
          ip: req.ip,
        },
      });
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      res.locals.skipRequestLog = true;
      logWarn({
        source: "backend",
        scope: "auth",
        message: "Percobaan login admin dengan email yang tidak terdaftar",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url || "",
        statusCode: 401,
        meta: {
          email: normalizedEmail,
          ip: req.ip,
        },
      });
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    if (!admin.isActive) {
      res.locals.skipRequestLog = true;
      logWarn({
        source: "backend",
        scope: "auth",
        message: "Percobaan login admin dari akun nonaktif",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url || "",
        statusCode: 403,
        meta: {
          email: normalizedEmail,
          adminId: admin._id,
          ip: req.ip,
        },
      });
      return res.status(403).json({
        message: "Akun admin tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      res.locals.skipRequestLog = true;
      logWarn({
        source: "backend",
        scope: "auth",
        message: "Percobaan login admin dengan password salah",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url || "",
        statusCode: 401,
        meta: {
          email: normalizedEmail,
          adminId: admin._id,
          ip: req.ip,
        },
      });
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      message: "Login berhasil",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "auth",
      message: "Gagal memproses login admin",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        ip: req.ip,
      },
      error,
    });
    return res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
}

async function getMe(req, res) {
  try {
    return res.status(200).json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        isActive: req.admin.isActive,
        createdAt: req.admin.createdAt,
        updatedAt: req.admin.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
}

async function logoutAdmin(req, res) {
  return res.status(200).json({
    message: "Logout berhasil",
  });
}

module.exports = {
  loginAdmin,
  getMe,
  logoutAdmin,
};
