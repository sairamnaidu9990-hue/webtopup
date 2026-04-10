const express = require("express");
const router = express.Router();

const {
  getPublicSiteSetting,
  getAdminSiteSetting,
  updateSiteSetting,
} = require("../controllers/siteSetting.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/public", getPublicSiteSetting);
router.get("/", protectAdmin, getAdminSiteSetting);
router.patch("/", protectAdmin, updateSiteSetting);

module.exports = router;
