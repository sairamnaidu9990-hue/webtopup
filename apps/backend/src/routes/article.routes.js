const express = require("express");

const {
  createArticle,
  deleteArticle,
  getAdminArticles,
  getPublicArticleBySlug,
  getPublicArticles,
  updateArticle,
} = require("../controllers/article.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", getPublicArticles);
router.get("/public/:slug", getPublicArticleBySlug);
router.get("/", protectAdmin, getAdminArticles);
router.post("/", protectAdmin, createArticle);
router.patch("/:id", protectAdmin, updateArticle);
router.delete("/:id", protectAdmin, deleteArticle);

module.exports = router;
