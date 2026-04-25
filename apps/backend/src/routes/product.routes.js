const express = require("express");
const router = express.Router();

const {
  getBalance,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  syncGames,
  syncGameDetails,
  syncVariants,
  syncCatalog,
} = require("../controllers/product.controller");
const { protectAdmin } = require("../middleware/authMiddleware");


router.post("/sync/games", protectAdmin, syncGames);
router.post("/sync/details", protectAdmin, syncGameDetails);
router.post("/sync/variants", protectAdmin, syncVariants);
router.post("/sync/all", protectAdmin, syncCatalog);
router.get("/balance", protectAdmin, getBalance);


// GET all products
router.get("/", protectAdmin, getProducts);

// CREATE product
router.post("/", protectAdmin, createProduct);

// UPDATE product
router.patch("/:id", protectAdmin, updateProduct);

// DELETE product
router.delete("/:id", protectAdmin, deleteProduct);

module.exports = router;
