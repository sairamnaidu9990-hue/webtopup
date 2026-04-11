const Game = require("../models/Game");
const SiteSetting = require("../models/SiteSetting");

const DEFAULT_GAME_CATEGORIES = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];

const DEFAULT_GAME_CATEGORY = DEFAULT_GAME_CATEGORIES[0];

function normalizeGameCategoriesList(list) {
  const source = Array.isArray(list) ? list : [];
  const deduped = [];

  for (const item of source) {
    const value = String(item || "").trim();

    if (!value) {
      continue;
    }

    if (!deduped.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      deduped.push(value);
    }
  }

  return deduped.length > 0 ? deduped : [...DEFAULT_GAME_CATEGORIES];
}

async function getConfiguredGameCategories() {
  const siteSetting = await SiteSetting.findOne()
    .select("gameCategories")
    .lean();

  return normalizeGameCategoriesList(siteSetting?.gameCategories);
}

function normalizeGameCategory(
  value,
  categories = DEFAULT_GAME_CATEGORIES,
  fallback = categories[0] || DEFAULT_GAME_CATEGORY
) {
  const normalized = String(value || "").trim().toLowerCase();
  const matched = categories.find(
    (category) => category.toLowerCase() === normalized
  );

  return matched || fallback;
}

async function normalizeGameCategories() {
  const categories = await getConfiguredGameCategories();
  const fallbackCategory = categories[0] || DEFAULT_GAME_CATEGORY;
  const invalidGames = await Game.find({
    $or: [
      { category: { $exists: false } },
      { category: null },
      { category: "" },
      { category: { $nin: categories } },
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
        category: fallbackCategory,
      },
    }
  );
}

module.exports = {
  DEFAULT_GAME_CATEGORIES,
  DEFAULT_GAME_CATEGORY,
  normalizeGameCategoriesList,
  getConfiguredGameCategories,
  normalizeGameCategory,
  normalizeGameCategories,
};
