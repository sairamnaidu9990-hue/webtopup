const express = require("express");
const { getAppLogs } = require("../controllers/appLog.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protectAdmin);
router.get("/", getAppLogs);

module.exports = router;
