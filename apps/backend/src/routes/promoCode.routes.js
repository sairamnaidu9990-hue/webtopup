const express = require("express");

const {
  createPromoCode,
  deletePromoCode,
  getPromoCodes,
  getPublicPromoCodes,
  updatePromoCode,
  validatePublicPromoCode,
} = require("../controllers/promoCode.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", getPublicPromoCodes);
router.post("/validate", validatePublicPromoCode);
router.get("/", protectAdmin, getPromoCodes);
router.post("/", protectAdmin, createPromoCode);
router.patch("/:id", protectAdmin, updatePromoCode);
router.delete("/:id", protectAdmin, deletePromoCode);

module.exports = router;
