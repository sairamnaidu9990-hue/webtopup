const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

function getBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return "";
}

async function resolveCustomerFromToken(token) {
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded?.scope !== "customer") {
    return null;
  }

  const customer = await Customer.findById(decoded.id).select("-password");

  if (!customer || !customer.isActive) {
    return null;
  }

  return customer;
}

async function protectCustomer(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const customer = await resolveCustomerFromToken(token);

    if (!customer) {
      return res.status(401).json({
        message: "Akun customer tidak valid atau tidak aktif",
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      message:
        error?.name === "TokenExpiredError"
          ? "Sesi login telah berakhir"
          : "Token customer tidak valid",
    });
  }
}

async function attachCustomerFromToken(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      next();
      return;
    }

    const customer = await resolveCustomerFromToken(token);

    if (customer) {
      req.customer = customer;
    }
  } catch {
    // Ignore invalid optional tokens so guest checkout keeps working.
  }

  next();
}

module.exports = {
  protectCustomer,
  attachCustomerFromToken,
};
