const express = require("express");
const router = express.Router();

const {
  clearAdminTeamMessages,
  getAdminTeamMessages,
  markAdminTeamMessagesRead,
  createAdminTeamMessage,
} = require("../controllers/adminTeamChat.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/", protectAdmin, getAdminTeamMessages);
router.post("/", protectAdmin, createAdminTeamMessage);
router.patch("/", protectAdmin, markAdminTeamMessagesRead);
router.delete("/", protectAdmin, clearAdminTeamMessages);

module.exports = router;
