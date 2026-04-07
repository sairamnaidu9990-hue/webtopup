const Game = require("../models/Game");

// GET ALL GAMES
exports.getGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: "Error ambil game" });
  }
};

// CREATE GAME
exports.createGame = async (req, res) => {
  try {
    const { name, code, logo, provider } = req.body;

    const game = new Game({ name, code, logo, provider, });

    await game.save();

    res.status(201).json({
      message: "Game berhasil dibuat",
      game,
    });
  } catch (err) {
    res.status(500).json({ message: "Error create game" });
  }
};

// UPDATE GAME
exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Game.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json({
      message: "Game berhasil diupdate",
      game: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Error update game" });
  }
};

// DELETE GAME
exports.deleteGame = async (req, res) => {
  try {
    const { id } = req.params;

    await Game.findByIdAndDelete(id);

    res.json({ message: "Game berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Error delete game" });
  }
};