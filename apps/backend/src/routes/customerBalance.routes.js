const express = require("express");

const {
  createCustomerBalanceTopup,
  getCurrentCustomerBalanceTransactions,
} = require("../controllers/customerBalance.controller");
const { protectCustomer } = require("../middleware/customerAuthMiddleware");

const router = express.Router();

router.use(protectCustomer);

router.get("/transactions", getCurrentCustomerBalanceTransactions);
router.post("/topups", createCustomerBalanceTopup);

module.exports = router;
