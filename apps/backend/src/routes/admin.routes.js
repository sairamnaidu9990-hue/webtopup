const express = require("express");
const router = express.Router();

const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  changeOwnPassword,
  updateAdminPassword,
} = require("../controllers/admin.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

router.use(protectAdmin);

router.get("/", getAdmins);
router.post("/", createAdmin);
router.patch("/change-password", changeOwnPassword);
router.patch("/:id/password", updateAdminPassword);
router.patch("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

module.exports = router;
