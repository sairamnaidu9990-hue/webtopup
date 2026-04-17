const express = require("express");

const {
  createOrderDraft,
  getOrders,
  getPublicOrderByInvoice,
} = require("../controllers/order.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/invoice/:invoiceNumber", getPublicOrderByInvoice);
router.post("/", createOrderDraft);
router.get("/", protectAdmin, getOrders);

module.exports = router;
