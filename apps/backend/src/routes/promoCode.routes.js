const express = require("express");

const {
  createPromoCode,
  deletePromoCode,
  getPromoCodes,
  getPublicPromoCodes,
  updatePromoCode,
  validatePublicPromoCode,
} = require("../controllers/promoCode.controller");
const { attachCustomerFromToken } = require("../middleware/customerAuthMiddleware");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", attachCustomerFromToken, getPublicPromoCodes);
router.post("/validate", attachCustomerFromToken, validatePublicPromoCode);
router.get("/", protectAdmin, getPromoCodes);
router.post("/", protectAdmin, createPromoCode);
router.patch("/:id", protectAdmin, updatePromoCode);
router.delete("/:id", protectAdmin, deletePromoCode);

module.exports = router;
