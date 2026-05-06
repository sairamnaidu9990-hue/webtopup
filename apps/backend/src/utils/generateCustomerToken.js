const jwt = require("jsonwebtoken");

function generateCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer._id,
      email: customer.email,
      username: customer.username,
      scope: "customer",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.CUSTOMER_TOKEN_EXPIRES_IN || "30d",
    }
  );
}

module.exports = generateCustomerToken;
