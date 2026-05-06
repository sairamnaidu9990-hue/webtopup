const express = require("express");
const cors = require("cors");
const { requestContext } = require("./src/middleware/requestContext");
const { requestLogger } = require("./src/middleware/requestLogger");
const { notFoundHandler } = require("./src/middleware/notFoundHandler");
const { errorHandler } = require("./src/middleware/errorHandler");
const appLogRoutes = require("./src/routes/appLog.routes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/admin.routes");
const customerAuthRoutes = require("./src/routes/customerAuth.routes");
const customerBalanceRoutes = require("./src/routes/customerBalance.routes");
const customerRoutes = require("./src/routes/customer.routes");
const adminTeamChatRoutes = require("./src/routes/adminTeamChat.routes");
const gameRoutes = require("./src/routes/game.routes");
const orderRoutes = require("./src/routes/order.routes");
const paymentMethodRoutes = require("./src/routes/paymentMethod.routes");
const paymentMethodCategoryRoutes = require("./src/routes/paymentMethodCategory.routes");
const promoCodeRoutes = require("./src/routes/promoCode.routes");
const productRoutes = require("./src/routes/product.routes");
const reviewRoutes = require("./src/routes/review.routes");
const siteSettingRoutes = require("./src/routes/siteSetting.routes");
const syncLogRoutes = require("./src/routes/syncLog.routes");
const variantRoutes = require("./src/routes/variant.routes");
const app = express();

app.set("trust proxy", Number.parseInt(process.env.TRUST_PROXY || "1", 10) || 1);
app.disable("x-powered-by");

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  ...String(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || uniqueAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }

  next();
});
app.use(requestContext);
app.use(requestLogger);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "100kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URLENCODED_BODY_LIMIT || "100kb",
  })
);

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/auth", authRoutes);
app.use("/api/customer-auth", customerAuthRoutes);
app.use("/api/customer-balance", customerBalanceRoutes);
app.use("/api/app-logs", appLogRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin-team-chat", adminTeamChatRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/payment-method-categories", paymentMethodCategoryRoutes);
app.use("/api/promo-codes", promoCodeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/site-settings", siteSettingRoutes);
app.use("/api/sync-logs", syncLogRoutes);
app.use("/api/variants", variantRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
