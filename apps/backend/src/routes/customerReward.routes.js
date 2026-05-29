const express = require("express");

const {
  getCurrentCustomerRewards,
  redeemCustomerPointsToBalance,
  redeemCustomerPointsToPromo,
} = require("../controllers/customerReward.controller");
const { protectCustomer } = require("../middleware/customerAuthMiddleware");

const router = express.Router();

router.use(protectCustomer);

router.get("/me", getCurrentCustomerRewards);
router.post("/redeem-balance", redeemCustomerPointsToBalance);
router.post("/redeem-promo", redeemCustomerPointsToPromo);

module.exports = router;
