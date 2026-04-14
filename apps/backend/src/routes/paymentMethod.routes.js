const express = require("express");

const {
  getPaymentMethods,
  getPublicPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../controllers/paymentMethod.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", getPublicPaymentMethods);
router.get("/", protectAdmin, getPaymentMethods);
router.post("/", protectAdmin, createPaymentMethod);
router.patch("/:id", protectAdmin, updatePaymentMethod);
router.delete("/:id", protectAdmin, deletePaymentMethod);

module.exports = router;
