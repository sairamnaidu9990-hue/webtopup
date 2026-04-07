const express = require("express");
const router = express.Router();

const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

// GET all products
router.get("/", getProducts);

// CREATE product
router.post("/", createProduct);

// UPDATE product
router.patch("/:id", updateProduct);

// DELETE product
router.delete("/:id", deleteProduct);

module.exports = router;