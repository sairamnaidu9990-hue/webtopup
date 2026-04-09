const express = require("express");
const router = express.Router();

const { getSyncLogs } = require("../controllers/syncLog.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/", protectAdmin, getSyncLogs);

module.exports = router;
