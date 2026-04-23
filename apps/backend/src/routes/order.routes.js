const express = require("express");

const {
  bangjeffCallback,
  createOrderDraft,
  getOrderDashboard,
  getOrders,
  getPublicOrderByInvoice,
  getRecentPublicOrders,
  markManualOrderAsPaid,
  resendOrderCallback,
  resendOrderToProvider,
  tokopayCallback,
  updateOrderByAdmin,
} = require("../controllers/order.controller");
const { protectAdmin } = require("../middleware/authMiddleware");
const { createRateLimit } = require("../middleware/rateLimit");
const { createCallbackIpAllowlist } = require("../middleware/callbackSecurity");

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

const tokopayCallbackIpAllowlist = createCallbackIpAllowlist({
  providerName: "Tokopay",
  envVarName: "TOKOPAY_CALLBACK_WHITELIST",
  defaultIps: ["178.128.104.179"],
});

const bangjeffCallbackIpAllowlist = createCallbackIpAllowlist({
  providerName: "BangJeff",
  envVarName: "BANGJEFF_CALLBACK_WHITELIST",
  defaultIps: ["178.128.110.75"],
});

router.get("/tokopay/callback", tokopayCallbackIpAllowlist, tokopayCallback);
router.post("/tokopay/callback", tokopayCallbackIpAllowlist, tokopayCallback);
router.get("/bangjeff/callback", bangjeffCallbackIpAllowlist, bangjeffCallback);
router.post("/bangjeff/callback", bangjeffCallbackIpAllowlist, bangjeffCallback);
router.get(
  "/invoice/:invoiceNumber",
  publicInvoiceLookupRateLimit,
  getPublicOrderByInvoice
);
router.get("/recent", publicRecentOrdersRateLimit, getRecentPublicOrders);
router.post("/", createOrderRateLimit, createOrderDraft);
router.get("/dashboard", protectAdmin, getOrderDashboard);
router.get("/", protectAdmin, getOrders);
router.patch("/:id", protectAdmin, updateOrderByAdmin);
router.patch("/:id/mark-paid", protectAdmin, markManualOrderAsPaid);
router.post("/:id/resend-callback", protectAdmin, resendOrderCallback);
router.post("/:id/resend-provider", protectAdmin, resendOrderToProvider);

module.exports = router;
