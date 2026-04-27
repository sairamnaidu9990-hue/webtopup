const express = require("express");

const {
  createPublicReview,
  getAdminReviews,
  getPublicGameReviewSummary,
  updateReviewByAdmin,
} = require("../controllers/review.controller");
const { protectAdmin } = require("../middleware/authMiddleware");
const { createRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

const createReviewRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
  message: "Terlalu banyak percobaan kirim review. Coba lagi beberapa saat lagi.",
});

const publicReviewLookupRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 120,
  message: "Terlalu banyak permintaan data review. Coba lagi beberapa saat lagi.",
});

router.get("/game/:gameCode", publicReviewLookupRateLimit, getPublicGameReviewSummary);
router.post("/", createReviewRateLimit, createPublicReview);
router.get("/", protectAdmin, getAdminReviews);
router.patch("/:id", protectAdmin, updateReviewByAdmin);

module.exports = router;
