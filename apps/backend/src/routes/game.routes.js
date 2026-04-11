const express = require("express");
const router = express.Router();

const {
  getGames,
  getStorefrontGames,
  getStorefrontGameDetail,
  createGame,
  updateGame,
  deleteGame,
} = require("../controllers/game.controller");

router.get("/storefront", getStorefrontGames);
router.get("/storefront/:code", getStorefrontGameDetail);
router.get("/", getGames);
router.post("/", createGame);
router.patch("/:id", updateGame);
router.delete("/:id", deleteGame);

module.exports = router;
