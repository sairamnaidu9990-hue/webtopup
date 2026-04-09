require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await Admin.findOne({
      email: "sairamnaidu9990@gmail.com",
    });

    if (existingAdmin) {
      console.log("Admin sudah ada");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await Admin.create({
      name: "Super Admin",
      email: "sairamnaidu9990@gmail.com",
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });

    console.log("Admin berhasil dibuat:", admin.email);
    process.exit();
  } catch (error) {
    console.error("Gagal membuat admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
