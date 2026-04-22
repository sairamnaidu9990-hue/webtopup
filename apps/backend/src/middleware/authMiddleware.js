const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

async function protectAdmin(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        message: "Admin tidak ditemukan",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Akun admin tidak aktif",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      message:
        error?.name === "TokenExpiredError"
          ? "Sesi login telah berakhir"
          : "Token tidak valid",
    });
  }
}

module.exports = {
  protectAdmin,
};
