const AdminTeamMessage = require("../models/AdminTeamMessage");
const { broadcastTeamChatMessage } = require("../realtime/realtimeServer");

const DEFAULT_ROOM_KEY = "global";
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function toPositiveInteger(value, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeMessageText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function serializeChatMessage(message) {
  return {
    _id: String(message?._id || ""),
    roomKey: String(message?.roomKey || DEFAULT_ROOM_KEY).trim().toLowerCase(),
    text: String(message?.text || "").trim(),
    sender: {
      adminId: String(message?.sender?.adminId || ""),
      name: String(message?.sender?.name || "").trim(),
      email: String(message?.sender?.email || "").trim(),
      role: String(message?.sender?.role || "").trim(),
    },
    createdAt: message?.createdAt || null,
    updatedAt: message?.updatedAt || null,
  };
}

async function getAdminTeamMessages(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const roomKey = String(req.query.roomKey || DEFAULT_ROOM_KEY)
      .trim()
      .toLowerCase();

    const items = await AdminTeamMessage.find({ roomKey })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      items: items.reverse().map(serializeChatMessage),
      limit,
      roomKey,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pesan chat tim",
      error: error.message,
    });
  }
}

async function createAdminTeamMessage(req, res) {
  try {
    const text = normalizeMessageText(req.body?.text);
    const roomKey = String(req.body?.roomKey || DEFAULT_ROOM_KEY)
      .trim()
      .toLowerCase();

    if (!text) {
      return res.status(400).json({
        message: "Pesan chat tidak boleh kosong",
      });
    }

    const message = await AdminTeamMessage.create({
      roomKey,
      text,
      sender: {
        adminId: req.admin._id,
        name: req.admin.name || req.admin.email || "Admin",
        email: req.admin.email || "",
        role: req.admin.role || "admin",
      },
    });

    const serialized = serializeChatMessage(message);
    broadcastTeamChatMessage(serialized);

    return res.status(201).json({
      message: "Pesan chat berhasil dikirim",
      item: serialized,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengirim pesan chat",
      error: error.message,
    });
  }
}

module.exports = {
  getAdminTeamMessages,
  createAdminTeamMessage,
};
