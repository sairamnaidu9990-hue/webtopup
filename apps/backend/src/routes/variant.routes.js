const express = require("express");
const router = express.Router();

const {
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  syncMarkupAllVariants,
  syncMarkupByGame,
} = require("../controllers/variant.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/", getVariants);
router.patch("/markup/all", protectAdmin, syncMarkupAllVariants);
router.patch("/markup/game/:gameId", protectAdmin, syncMarkupByGame);
router.post("/", createVariant);
router.patch("/:id", updateVariant);
router.delete("/:id", deleteVariant);

module.exports = router;
