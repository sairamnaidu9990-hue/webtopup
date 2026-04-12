const mongoose = require("mongoose");

function normalizeVariantCategories(categories) {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories
    .map((category, index) => {
      const name = String(category?.name || "").trim();

      if (!name) {
        return null;
      }

      const normalized = {
        name,
        order: index + 1,
      };

      const rawId = String(category?._id || category?.id || "").trim();

      if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
        normalized._id = new mongoose.Types.ObjectId(rawId);
      }

      return normalized;
    })
    .filter(Boolean);
}

function extractVariantCategoryIds(categories) {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories
    .map((category) => String(category?._id || "").trim())
    .filter(Boolean);
}

function resolveVariantCategoryId(game, categoryId) {
  const normalizedId = String(categoryId || "").trim();

  if (!normalizedId) {
    return "";
  }

  const categoryIds = extractVariantCategoryIds(game?.variantCategories);

  return categoryIds.includes(normalizedId) ? normalizedId : null;
}

function getVariantCategoryName(game, categoryId) {
  const normalizedId = String(categoryId || "").trim();

  if (!normalizedId || !Array.isArray(game?.variantCategories)) {
    return "";
  }

  const category = game.variantCategories.find(
    (item) => String(item?._id || "").trim() === normalizedId
  );

  return String(category?.name || "").trim();
}

module.exports = {
  normalizeVariantCategories,
  extractVariantCategoryIds,
  resolveVariantCategoryId,
  getVariantCategoryName,
};
