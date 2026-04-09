const express = require("express");
const router = express.Router();

const {
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


// GET all products
router.get("/", getProducts);

// CREATE product
router.post("/", createProduct);

// UPDATE product
router.patch("/:id", updateProduct);

// DELETE product
router.delete("/:id", deleteProduct);

module.exports = router;
