const express = require("express");

const {
  getAnalyticsSummary,
  trackVisitorPageView,
} = require("../controllers/analytics.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/pageview", trackVisitorPageView);
router.get("/summary", protectAdmin, getAnalyticsSummary);

module.exports = router;
