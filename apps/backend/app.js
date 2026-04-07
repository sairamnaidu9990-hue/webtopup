const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const app = express();
const gameRoutes = require("./src/routes/game.routes");
const productRoutes = require("./src/routes/product.routes");

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/products", productRoutes);

module.exports = app;