const express = require("express");
const router = express.Router();

const {
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} = require("../controllers/variant.controller");

router.get("/", getVariants);
router.post("/", createVariant);
router.patch("/:id", updateVariant);
router.delete("/:id", deleteVariant);

module.exports = router;
