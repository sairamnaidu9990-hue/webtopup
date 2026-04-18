const express = require("express");

const {
  createOrderDraft,
  getOrderDashboard,
  getOrders,
  getPublicOrderByInvoice,
  markManualOrderAsPaid,
  tokopayCallback,
} = require("../controllers/order.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/tokopay/callback", tokopayCallback);
router.post("/tokopay/callback", tokopayCallback);
router.get("/invoice/:invoiceNumber", getPublicOrderByInvoice);
router.post("/", createOrderDraft);
router.get("/dashboard", protectAdmin, getOrderDashboard);
router.get("/", protectAdmin, getOrders);
router.patch("/:id/mark-paid", protectAdmin, markManualOrderAsPaid);

module.exports = router;
