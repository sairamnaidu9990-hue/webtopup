const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  const products = await Product.find().populate("game");
  res.json(products);
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      game,
      basePrice,
      markup,
      providerCode,
      logo,
    } = req.body;

    console.log("BODY:", req.body); 

    if (!name || !game || !basePrice || !markup) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const price = Math.ceil(
      Number(basePrice) + (Number(basePrice) * Number(markup)) / 100
    );

    const product = new Product({
      name,
      game,
      basePrice,
      markup,
      price, 
      providerCode,
      logo,
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ message: "Error create product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { basePrice, markup } = req.body;

    let price;

    if (basePrice && markup) {
      price = Math.ceil(basePrice + (basePrice * markup) / 100);
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(price && { price }),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error delete product" });
  }
};