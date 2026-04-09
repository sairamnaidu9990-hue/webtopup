const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Akun admin tidak aktif",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
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
