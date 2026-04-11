const Game = require("../models/Game");

const ORDER_PLACEHOLDER = 9999;

function isBlank(value) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function isExplicitOrder(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed < ORDER_PLACEHOLDER;
}

function toOrderNumber(value, fallback = ORDER_PLACEHOLDER) {
  if (isBlank(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.trunc(parsed)
    : fallback;
}

async function getNextGameOrder(field, filter = {}) {
  const game = await Game.findOne({
    ...filter,
    [field]: { $gte: 0, $lt: ORDER_PLACEHOLDER },
  })
    .sort({ [field]: -1 })
    .select(field)
    .lean();

  const currentValue = Number(game?.[field]);
  return Number.isFinite(currentValue) ? Math.trunc(currentValue) + 1 : 1;
}

async function normalizeGameOrders() {
  const [unorderedCatalogGames, unorderedTrendingGames, nonTrendingGames] =
    await Promise.all([
      Game.find({
        $or: [
          { catalogOrder: { $exists: false } },
          { catalogOrder: null },
          { catalogOrder: { $lt: 0 } },
          { catalogOrder: { $gte: ORDER_PLACEHOLDER } },
        ],
      })
        .sort({ createdAt: 1, name: 1 })
        .select("_id"),
      Game.find({
        isTrending: true,
        $or: [
          { trendingOrder: { $exists: false } },
          { trendingOrder: null },
          { trendingOrder: { $lt: 0 } },
          { trendingOrder: { $gte: ORDER_PLACEHOLDER } },
        ],
      })
        .sort({ createdAt: 1, name: 1 })
        .select("_id"),
      Game.find({
        isTrending: false,
        trendingOrder: { $gte: 0, $lt: ORDER_PLACEHOLDER },
      }).select("_id"),
    ]);

  if (
    unorderedCatalogGames.length === 0 &&
    unorderedTrendingGames.length === 0 &&
    nonTrendingGames.length === 0
  ) {
    return;
  }

  let [nextCatalogOrder, nextTrendingOrder] = await Promise.all([
    getNextGameOrder("catalogOrder"),
    getNextGameOrder("trendingOrder", { isTrending: true }),
  ]);

  const operations = [];

  for (const game of unorderedCatalogGames) {
    operations.push({
      updateOne: {
        filter: { _id: game._id },
        update: {
          $set: {
            catalogOrder: nextCatalogOrder,
          },
        },
      },
    });

    nextCatalogOrder += 1;
  }

  for (const game of unorderedTrendingGames) {
    operations.push({
      updateOne: {
        filter: { _id: game._id },
        update: {
          $set: {
            trendingOrder: nextTrendingOrder,
          },
        },
      },
    });

    nextTrendingOrder += 1;
  }

  for (const game of nonTrendingGames) {
    operations.push({
      updateOne: {
        filter: { _id: game._id },
        update: {
          $set: {
            trendingOrder: ORDER_PLACEHOLDER,
          },
        },
      },
    });
  }

  if (operations.length > 0) {
    await Game.bulkWrite(operations);
  }
}

module.exports = {
  ORDER_PLACEHOLDER,
  isBlank,
  isExplicitOrder,
  toOrderNumber,
  getNextGameOrder,
  normalizeGameOrders,
};
