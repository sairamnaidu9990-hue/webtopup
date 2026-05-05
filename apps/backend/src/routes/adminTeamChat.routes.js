const express = require("express");
const router = express.Router();

const {
  getAdminTeamMessages,
  createAdminTeamMessage,
} = require("../controllers/adminTeamChat.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/", protectAdmin, getAdminTeamMessages);
router.post("/", protectAdmin, createAdminTeamMessage);

module.exports = router;
