const express = require("express");

const {
  getPaymentMethodCategories,
  createPaymentMethodCategory,
  updatePaymentMethodCategory,
  deletePaymentMethodCategory,
} = require("../controllers/paymentMethodCategory.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protectAdmin, getPaymentMethodCategories);
router.post("/", protectAdmin, createPaymentMethodCategory);
router.patch("/:id", protectAdmin, updatePaymentMethodCategory);
router.delete("/:id", protectAdmin, deletePaymentMethodCategory);

module.exports = router;
