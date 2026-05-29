const Article = require("../models/Article");

const DEFAULT_PUBLIC_LIMIT = 6;
const DEFAULT_ADMIN_LIMIT = 20;
const MAX_ADMIN_LIMIT = 100;

function toStringValue(value) {
  return String(value || "").trim();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildAdminSnapshot(admin) {
  return {
    adminId: admin?._id,
    name: toStringValue(admin?.name || admin?.email || "Admin"),
    email: toStringValue(admin?.email).toLowerCase(),
    role: toStringValue(admin?.role || "admin"),
  };
}

function slugifyText(value) {
  return toStringValue(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const cleanBaseSlug = slugifyText(baseSlug) || `artikel-${Date.now()}`;
  let candidate = cleanBaseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Article.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();

    if (!existing) {
      return candidate;
    }

    candidate = `${cleanBaseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildExcerpt(title, excerpt, content) {
  const nextExcerpt = toStringValue(excerpt);

  if (nextExcerpt) {
    return nextExcerpt.slice(0, 360);
  }

  const normalizedContent = String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedContent) {
    return `${title} - artikel terbaru dari KITAGG.`.slice(0, 360);
  }

  return normalizedContent.slice(0, 360);
}

function estimateReadingMinutes(content) {
  const words = String(content || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  if (words <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(words / 180));
}

function serializeArticle(article) {
  return {
    _id: String(article?._id || ""),
    title: toStringValue(article?.title),
    slug: toStringValue(article?.slug),
    excerpt: toStringValue(article?.excerpt),
    content: String(article?.content || ""),
    coverImageUrl: toStringValue(article?.coverImageUrl),
    status: toStringValue(article?.status || "DRAFT"),
    isFeatured: Boolean(article?.isFeatured),
    sortOrder: Number(article?.sortOrder ?? 9999),
    readingMinutes: estimateReadingMinutes(article?.content),
    publishedAt: article?.publishedAt || null,
    createdAt: article?.createdAt || null,
    updatedAt: article?.updatedAt || null,
    createdBy: article?.createdBy
      ? {
          adminId: String(article.createdBy.adminId || ""),
          name: toStringValue(article.createdBy.name),
          email: toStringValue(article.createdBy.email),
          role: toStringValue(article.createdBy.role),
        }
      : null,
    updatedBy: article?.updatedBy
      ? {
          adminId: String(article.updatedBy.adminId || ""),
          name: toStringValue(article.updatedBy.name),
          email: toStringValue(article.updatedBy.email),
          role: toStringValue(article.updatedBy.role),
        }
      : null,
  };
}

function serializeArticleSummary(article) {
  return {
    ...serializeArticle(article),
    content: "",
  };
}

async function normalizeArticlePayload(body, options = {}) {
  const title = toStringValue(body?.title).slice(0, 180);
  const rawSlug = toStringValue(body?.slug).slice(0, 220);
  const content = String(body?.content || "").replace(/\r\n/g, "\n").trim();
  const excerpt = buildExcerpt(title, body?.excerpt, content);
  const coverImageUrl = toStringValue(body?.coverImageUrl).slice(0, 1200);
  const status = toStringValue(body?.status || "DRAFT").toUpperCase();
  const isFeatured = Boolean(body?.isFeatured);
  const sortOrder = Number.isFinite(Number(body?.sortOrder))
    ? Number(body?.sortOrder)
    : 9999;

  if (!title) {
    throw new Error("Judul artikel wajib diisi");
  }

  if (!content) {
    throw new Error("Isi artikel wajib diisi");
  }

  if (!["DRAFT", "PUBLISHED"].includes(status)) {
    throw new Error("Status artikel tidak valid");
  }

  const slug = await ensureUniqueSlug(
    rawSlug || title,
    options.excludeId || null
  );

  const normalized = {
    title,
    slug,
    excerpt,
    content: content.slice(0, 50000),
    coverImageUrl,
    status,
    isFeatured,
    sortOrder,
  };

  if (status === "PUBLISHED") {
    normalized.publishedAt =
      body?.publishedAt && !Number.isNaN(new Date(body.publishedAt).getTime())
        ? new Date(body.publishedAt)
        : options.existingPublishedAt || new Date();
  } else {
    normalized.publishedAt = null;
  }

  return normalized;
}

async function getPublicArticles(req, res) {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(
      toPositiveInteger(req.query.limit, DEFAULT_PUBLIC_LIMIT),
      24
    );
    const skip = (page - 1) * limit;
    const search = toStringValue(req.query.search);

    const query = {
      status: "PUBLISHED",
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Article.find(query)
        .sort({ isFeatured: -1, sortOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      items: items.map(serializeArticleSummary),
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil artikel publik",
      error: error.message,
    });
  }
}

async function getPublicArticleBySlug(req, res) {
  try {
    const slug = slugifyText(req.params.slug);

    if (!slug) {
      return res.status(400).json({
        message: "Slug artikel tidak valid",
      });
    }

    const article = await Article.findOne({
      slug,
      status: "PUBLISHED",
    }).lean();

    if (!article) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    return res.status(200).json({
      item: serializeArticle(article),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil detail artikel",
      error: error.message,
    });
  }
}

async function getAdminArticles(req, res) {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(
      toPositiveInteger(req.query.limit, DEFAULT_ADMIN_LIMIT),
      MAX_ADMIN_LIMIT
    );
    const skip = (page - 1) * limit;
    const search = toStringValue(req.query.search);
    const status = toStringValue(req.query.status).toUpperCase();

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    if (["DRAFT", "PUBLISHED"].includes(status)) {
      query.status = status;
    }

    const [items, totalItems] = await Promise.all([
      Article.find(query)
        .sort({ status: 1, isFeatured: -1, sortOrder: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query),
    ]);

    return res.status(200).json({
      items: items.map(serializeArticle),
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil daftar artikel",
      error: error.message,
    });
  }
}

async function createArticle(req, res) {
  try {
    const adminSnapshot = buildAdminSnapshot(req.admin);
    const payload = await normalizeArticlePayload(req.body);

    const article = await Article.create({
      ...payload,
      createdBy: adminSnapshot,
      updatedBy: adminSnapshot,
    });

    return res.status(201).json({
      message: "Artikel berhasil dibuat",
      item: serializeArticle(article),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat artikel",
      error: error.message,
    });
  }
}

async function updateArticle(req, res) {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    const payload = await normalizeArticlePayload(req.body, {
      excludeId: article._id,
      existingPublishedAt: article.publishedAt,
    });

    Object.assign(article, payload, {
      updatedBy: buildAdminSnapshot(req.admin),
    });

    await article.save();

    return res.status(200).json({
      message: "Artikel berhasil diperbarui",
      item: serializeArticle(article),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui artikel",
      error: error.message,
    });
  }
}

async function deleteArticle(req, res) {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: "Artikel tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Artikel berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus artikel",
      error: error.message,
    });
  }
}

module.exports = {
  createArticle,
  deleteArticle,
  getAdminArticles,
  getPublicArticleBySlug,
  getPublicArticles,
  updateArticle,
};
