const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  getMe,
  logoutAdmin,
} = require("../controllers/authController");

const { protectAdmin } = require("../middleware/authMiddleware");

router.post("/login", loginAdmin);
router.get("/me", protectAdmin, getMe);
router.post("/logout", logoutAdmin);

module.exports = router;