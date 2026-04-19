const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  getMe,
  logoutAdmin,
} = require("../controllers/authController");

const { protectAdmin } = require("../middleware/authMiddleware");
const { createRateLimit } = require("../middleware/rateLimit");

const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message:
    "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.",
});

router.post("/login", loginRateLimit, loginAdmin);
router.get("/me", protectAdmin, getMe);
router.post("/logout", logoutAdmin);

module.exports = router;
