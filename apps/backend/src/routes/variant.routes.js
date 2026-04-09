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

router.get("/", getVariants);
router.patch("/markup/all", syncMarkupAllVariants);
router.patch("/markup/game/:gameId", syncMarkupByGame);
router.post("/", createVariant);
router.patch("/:id", updateVariant);
router.delete("/:id", deleteVariant);

module.exports = router;
