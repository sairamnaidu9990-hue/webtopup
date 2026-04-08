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
  testBangJeff,
} = require("../controllers/product.controller");


router.post("/sync/games", syncGames);
router.post("/sync/details", syncGameDetails);
router.post("/sync/variants", syncVariants);
router.post("/sync/all", syncCatalog);


// GET all products
router.get("/", getProducts);
router.get("/test/bangjeff", testBangJeff);

// CREATE product
router.post("/", createProduct);

// UPDATE product
router.patch("/:id", updateProduct);

// DELETE product
router.delete("/:id", deleteProduct);

module.exports = router;
