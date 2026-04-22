const bcrypt = require("bcryptjs");
const Admin = require("../models/admin");

const ALLOWED_ROLES = ["super_admin", "admin"];

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  return ALLOWED_ROLES.includes(normalized) ? normalized : null;
}

function toBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function serializeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: 1, name: 1 });

    return res.status(200).json({
      admins: admins.map(serializeAdmin),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data admin",
      error: error.message,
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role = "admin", isActive = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nama, email, dan password wajib diisi",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);

    if (!normalizedRole) {
      return res.status(400).json({
        message: "Role admin tidak valid",
      });
    }

    const existing = await Admin.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        message: "Email admin sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const admin = await Admin.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      isActive: toBoolean(isActive, true),
    });

    return res.status(201).json({
      message: "Admin berhasil dibuat",
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat admin",
      error: error.message,
    });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    const updatePayload = {};

    if (req.body.name != null) {
      updatePayload.name = String(req.body.name).trim();
    }

    if (req.body.email != null) {
      const normalizedEmail = normalizeEmail(req.body.email);
      const duplicate = await Admin.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Email admin sudah digunakan",
        });
      }

      updatePayload.email = normalizedEmail;
    }

    if (req.body.role != null) {
      const normalizedRole = normalizeRole(req.body.role);

      if (!normalizedRole) {
        return res.status(400).json({
          message: "Role admin tidak valid",
        });
      }

      updatePayload.role = normalizedRole;
    }

    if (req.body.isActive != null) {
      const nextIsActive = toBoolean(req.body.isActive, admin.isActive);

      if (String(req.admin?._id) === String(admin._id) && !nextIsActive) {
        return res.status(400).json({
          message: "Kamu tidak bisa menonaktifkan akun yang sedang dipakai",
        });
      }

      if (!nextIsActive) {
        const activeAdminCount = await Admin.countDocuments({
          _id: { $ne: admin._id },
          isActive: true,
        });

        if (activeAdminCount === 0) {
          return res.status(400).json({
            message: "Minimal harus ada satu admin aktif",
          });
        }
      }

      updatePayload.isActive = nextIsActive;
    }

    const updated = await Admin.findByIdAndUpdate(id, updatePayload, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      message: "Admin berhasil diperbarui",
      admin: serializeAdmin(updated),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui admin",
      error: error.message,
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.admin?._id) === String(id)) {
      return res.status(400).json({
        message: "Kamu tidak bisa menghapus akun yang sedang dipakai",
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    const remainingAdminCount = await Admin.countDocuments({
      _id: { $ne: admin._id },
    });

    if (remainingAdminCount === 0) {
      return res.status(400).json({
        message: "Minimal harus ada satu akun admin",
      });
    }

    await Admin.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Admin berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus admin",
      error: error.message,
    });
  }
};

exports.changeOwnPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Password lama dan password baru wajib diisi",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        message: "Password baru minimal 8 karakter",
      });
    }

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Password lama tidak sesuai",
      });
    }

    admin.password = await bcrypt.hash(String(newPassword), 10);
    await admin.save();

    return res.status(200).json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui password",
      error: error.message,
    });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "Password baru wajib diisi",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        message: "Password baru minimal 8 karakter",
      });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    admin.password = await bcrypt.hash(String(newPassword), 10);
    await admin.save();

    return res.status(200).json({
      message: "Password admin berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui password admin",
      error: error.message,
    });
  }
};
