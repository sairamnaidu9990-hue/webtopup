const express = require("express");
const router = express.Router();

const {
  getGames,
  createGame,
  updateGame,
  deleteGame,
} = require("../controllers/game.controller");

router.get("/", getGames);
router.post("/", createGame);
router.patch("/:id", updateGame);
router.delete("/:id", deleteGame);

module.exports = router;