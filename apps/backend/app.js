const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/admin.routes");
const gameRoutes = require("./src/routes/game.routes");
const orderRoutes = require("./src/routes/order.routes");
const paymentMethodRoutes = require("./src/routes/paymentMethod.routes");
const productRoutes = require("./src/routes/product.routes");
const siteSettingRoutes = require("./src/routes/siteSetting.routes");
const syncLogRoutes = require("./src/routes/syncLog.routes");
const variantRoutes = require("./src/routes/variant.routes");
const app = express();

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

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/products", productRoutes);
app.use("/api/site-settings", siteSettingRoutes);
app.use("/api/sync-logs", syncLogRoutes);
app.use("/api/variants", variantRoutes);

module.exports = app;
