const jwt = require("jsonwebtoken");

const ADMIN_REALTIME_SCOPE = "admin-realtime";
const DEFAULT_ADMIN_REALTIME_EXPIRES_IN = "2m";

function createAdminRealtimeToken(admin) {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      scope: ADMIN_REALTIME_SCOPE,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.ADMIN_REALTIME_TOKEN_EXPIRES_IN ||
        DEFAULT_ADMIN_REALTIME_EXPIRES_IN,
    }
  );
}

function verifyAdminRealtimeToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded?.scope !== ADMIN_REALTIME_SCOPE) {
    throw new Error("Realtime token scope tidak valid");
  }

  return decoded;
}

module.exports = {
  ADMIN_REALTIME_SCOPE,
  createAdminRealtimeToken,
  verifyAdminRealtimeToken,
};
