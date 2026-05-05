const mongoose = require("mongoose");

const adminSnapshotSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: "admin",
      trim: true,
    },
  },
  { _id: false }
);

const adminTeamMessageSchema = new mongoose.Schema(
  {
    roomKey: {
      type: String,
      default: "global",
      trim: true,
      lowercase: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    sender: {
      type: adminSnapshotSchema,
      required: true,
    },
  },
  { timestamps: true }
);

adminTeamMessageSchema.index({ roomKey: 1, createdAt: -1 });

module.exports = mongoose.model("AdminTeamMessage", adminTeamMessageSchema);
