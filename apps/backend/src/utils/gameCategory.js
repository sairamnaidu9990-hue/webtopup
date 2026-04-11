const Game = require("../models/Game");

const GAME_CATEGORIES = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];

const DEFAULT_GAME_CATEGORY = GAME_CATEGORIES[0];

function normalizeGameCategory(value, fallback = DEFAULT_GAME_CATEGORY) {
  const normalized = String(value || "").trim().toLowerCase();
  const matched = GAME_CATEGORIES.find(
    (category) => category.toLowerCase() === normalized
  );

  return matched || fallback;
}

async function normalizeGameCategories() {
  const invalidGames = await Game.find({
    $or: [
      { category: { $exists: false } },
      { category: null },
      { category: "" },
      { category: { $nin: GAME_CATEGORIES } },
    ],
  })
    .select("_id")
    .lean();

  if (invalidGames.length === 0) {
    return;
  }

  await Game.updateMany(
    {
      _id: { $in: invalidGames.map((game) => game._id) },
    },
    {
      $set: {
        category: DEFAULT_GAME_CATEGORY,
      },
    }
  );
}

module.exports = {
  GAME_CATEGORIES,
  DEFAULT_GAME_CATEGORY,
  normalizeGameCategory,
  normalizeGameCategories,
};
