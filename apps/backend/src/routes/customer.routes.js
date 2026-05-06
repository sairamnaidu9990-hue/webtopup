const express = require("express");
const router = express.Router();

const { getCustomers, updateCustomer } = require("../controllers/customer.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.use(protectAdmin);

router.get("/", getCustomers);
router.patch("/:id", updateCustomer);

module.exports = router;
