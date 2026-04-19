const express = require("express");

const {
  createOrderDraft,
  getOrderDashboard,
  getOrders,
  getPublicOrderByInvoice,
  getRecentPublicOrders,
  markManualOrderAsPaid,
  tokopayCallback,
} = require("../controllers/order.controller");
const { protectAdmin } = require("../middleware/authMiddleware");
const { createRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

const publicInvoiceLookupRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 120,
  message:
    "Terlalu banyak permintaan cek invoice. Coba lagi beberapa saat lagi.",
});

const publicRecentOrdersRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 90,
  message:
    "Terlalu banyak permintaan transaksi terbaru. Coba lagi beberapa saat lagi.",
});

const createOrderRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  maxRequests: 25,
  message:
    "Terlalu banyak percobaan membuat pesanan. Coba lagi beberapa saat lagi.",
});

router.get("/tokopay/callback", tokopayCallback);
router.post("/tokopay/callback", tokopayCallback);
router.get(
  "/invoice/:invoiceNumber",
  publicInvoiceLookupRateLimit,
  getPublicOrderByInvoice
);
router.get("/recent", publicRecentOrdersRateLimit, getRecentPublicOrders);
router.post("/", createOrderRateLimit, createOrderDraft);
router.get("/dashboard", protectAdmin, getOrderDashboard);
router.get("/", protectAdmin, getOrders);
router.patch("/:id/mark-paid", protectAdmin, markManualOrderAsPaid);

module.exports = router;
