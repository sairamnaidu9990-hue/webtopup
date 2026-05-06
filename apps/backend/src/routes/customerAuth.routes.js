const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  logoutCustomer,
} = require("../controllers/customerAuth.controller");
const { protectCustomer } = require("../middleware/customerAuthMiddleware");
const { createRateLimit } = require("../middleware/rateLimit");

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: "Terlalu banyak percobaan auth customer. Coba lagi beberapa menit lagi.",
});

router.post("/register", authRateLimit, registerCustomer);
router.post("/login", authRateLimit, loginCustomer);
router.get("/me", protectCustomer, getCurrentCustomer);
router.post("/logout", logoutCustomer);

module.exports = router;
