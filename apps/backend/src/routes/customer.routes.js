const express = require("express");
const router = express.Router();

const {
  getCustomers,
  updateCustomer,
} = require("../controllers/customer.controller");
const {
  adjustCustomerBalanceByAdmin,
  getCustomerBalanceTransactionsByAdmin,
} = require("../controllers/customerBalance.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.use(protectAdmin);

router.get("/", getCustomers);
router.patch("/:id", updateCustomer);
router.get("/:id/balance-transactions", getCustomerBalanceTransactionsByAdmin);
router.post("/:id/balance-adjustments", adjustCustomerBalanceByAdmin);

module.exports = router;
