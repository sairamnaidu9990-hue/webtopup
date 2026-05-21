const AdminTeamMessage = require("../models/AdminTeamMessage");
const {
  broadcastTeamChatCleared,
  broadcastTeamChatMessage,
  broadcastTeamChatRead,
} = require("../realtime/realtimeServer");

const DEFAULT_ROOM_KEY = "global";
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const MAX_ATTACHMENT_COUNT = 4;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_DATA_URL_LENGTH = 8 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function toPositiveInteger(value, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeMessageText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
}

function normalizeRoomKey(value) {
  return String(value || DEFAULT_ROOM_KEY)
    .trim()
    .toLowerCase();
}

function normalizeAttachmentName(value, index) {
  const fallback = `lampiran-${index + 1}`;
  return String(value || fallback).trim().slice(0, 180) || fallback;
}

function serializeSeenByEntry(entry) {
  return {
    adminId: String(entry?.adminId || ""),
    name: String(entry?.name || "").trim(),
    email: String(entry?.email || "").trim(),
    role: String(entry?.role || "").trim(),
    seenAt: entry?.seenAt || null,
  };
}

function serializeAttachment(attachment) {
  return {
    id: String(attachment?.id || ""),
    kind: String(attachment?.kind || "file").trim().toLowerCase(),
    name: String(attachment?.name || "").trim(),
    mimeType: String(attachment?.mimeType || "")
      .trim()
      .toLowerCase(),
    size: Number(attachment?.size || 0),
    dataUrl: String(attachment?.dataUrl || "").trim(),
  };
}

function isSupportedAttachmentMimeType(mimeType) {
  return (
    ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType) ||
    (mimeType.startsWith("image/") && mimeType !== "image/svg+xml")
  );
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const attachments = value
    .slice(0, MAX_ATTACHMENT_COUNT)
    .map((attachment, index) => {
      const mimeType = String(attachment?.mimeType || "")
        .trim()
        .toLowerCase();
      const dataUrl = String(attachment?.dataUrl || "").trim();
      const size = Number(attachment?.size || 0);

      if (!mimeType || !isSupportedAttachmentMimeType(mimeType)) {
        throw new Error("Jenis file lampiran tidak didukung");
      }

      if (
        !dataUrl.startsWith(`data:${mimeType};base64,`) &&
        !dataUrl.startsWith("data:application/octet-stream;base64,")
      ) {
        throw new Error("Format file lampiran tidak valid");
      }

      if (
        !Number.isFinite(size) ||
        size <= 0 ||
        size > MAX_ATTACHMENT_SIZE_BYTES
      ) {
        throw new Error(
          "Ukuran lampiran maksimal 5 MB untuk setiap file"
        );
      }

      if (dataUrl.length > MAX_ATTACHMENT_DATA_URL_LENGTH) {
        throw new Error("Lampiran terlalu besar untuk dikirim");
      }

      return {
        id:
          String(attachment?.id || "").trim() ||
          `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        kind: mimeType.startsWith("image/") ? "image" : "file",
        name: normalizeAttachmentName(attachment?.name, index),
        mimeType,
        size,
        dataUrl,
      };
    });

  const totalAttachmentSize = attachments.reduce(
    (sum, attachment) => sum + Number(attachment.size || 0),
    0
  );

  if (totalAttachmentSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
    throw new Error(
      "Total ukuran lampiran maksimal 10 MB untuk setiap pesan"
    );
  }

  return attachments;
}

function hasSeenMessage(message, adminId) {
  return Array.isArray(message?.seenBy)
    ? message.seenBy.some(
        (entry) => String(entry?.adminId || "") === String(adminId || "")
      )
    : false;
}

function buildSeenBySnapshot(admin) {
  return {
    adminId: admin?._id,
    name: admin?.name || admin?.email || "Admin",
    email: admin?.email || "",
    role: admin?.role || "admin",
    seenAt: new Date(),
  };
}

function applySeenByToMessages(messages, adminSnapshot) {
  const updatedIds = [];

  const operations = messages
    .filter((message) => !hasSeenMessage(message, adminSnapshot.adminId))
    .map((message) => {
      updatedIds.push(String(message._id));
      return {
        updateOne: {
          filter: {
            _id: message._id,
            "seenBy.adminId": { $ne: adminSnapshot.adminId },
          },
          update: {
            $push: {
              seenBy: adminSnapshot,
            },
          },
        },
      };
    });

  return {
    operations,
    updatedIds,
  };
}

function serializeChatMessage(message) {
  return {
    _id: String(message?._id || ""),
    roomKey: normalizeRoomKey(message?.roomKey || DEFAULT_ROOM_KEY),
    text: String(message?.text || "").trim(),
    sender: {
      adminId: String(message?.sender?.adminId || ""),
      name: String(message?.sender?.name || "").trim(),
      email: String(message?.sender?.email || "").trim(),
      role: String(message?.sender?.role || "").trim(),
    },
    attachments: Array.isArray(message?.attachments)
      ? message.attachments.map(serializeAttachment)
      : [],
    seenBy: Array.isArray(message?.seenBy)
      ? message.seenBy.map(serializeSeenByEntry)
      : [],
    createdAt: message?.createdAt || null,
    updatedAt: message?.updatedAt || null,
  };
}

async function getAdminTeamMessages(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const roomKey = normalizeRoomKey(req.query.roomKey || DEFAULT_ROOM_KEY);

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
    const roomKey = normalizeRoomKey(req.body?.roomKey || DEFAULT_ROOM_KEY);
    const attachments = normalizeAttachments(req.body?.attachments);

    if (!text && attachments.length === 0) {
      return res.status(400).json({
        message: "Pesan chat atau lampiran wajib diisi",
      });
    }

    const message = await AdminTeamMessage.create({
      roomKey,
      text,
      attachments,
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

async function markAdminTeamMessagesRead(req, res) {
  try {
    const roomKey = normalizeRoomKey(req.body?.roomKey || DEFAULT_ROOM_KEY);
    const messageIds = Array.isArray(req.body?.messageIds)
      ? req.body.messageIds
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      : [];

    const query = {
      roomKey,
      "sender.adminId": { $ne: req.admin._id },
    };

    if (messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const messages = await AdminTeamMessage.find(query)
      .select("_id sender seenBy roomKey")
      .lean();

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({
        message: "Tidak ada pesan baru untuk ditandai sudah dibaca",
        roomKey,
        updatedIds: [],
      });
    }

    const seenSnapshot = buildSeenBySnapshot(req.admin);
    const { operations, updatedIds } = applySeenByToMessages(
      messages,
      seenSnapshot
    );

    if (operations.length > 0) {
      await AdminTeamMessage.bulkWrite(operations, { ordered: false });
      broadcastTeamChatRead({
        roomKey,
        messageIds: updatedIds,
        seenBy: serializeSeenByEntry(seenSnapshot),
      });
    }

    return res.status(200).json({
      message: "Status baca chat berhasil diperbarui",
      roomKey,
      updatedIds,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui status baca chat",
      error: error.message,
    });
  }
}

async function clearAdminTeamMessages(req, res) {
  try {
    const roomKey = normalizeRoomKey(req.body?.roomKey || req.query.roomKey || DEFAULT_ROOM_KEY);
    const deletion = await AdminTeamMessage.deleteMany({ roomKey });

    broadcastTeamChatCleared({
      roomKey,
      deletedCount: Number(deletion?.deletedCount || 0),
      clearedBy: {
        adminId: String(req.admin?._id || ""),
        name: String(req.admin?.name || req.admin?.email || "Admin").trim(),
        email: String(req.admin?.email || "").trim(),
        role: String(req.admin?.role || "admin").trim(),
      },
    });

    return res.status(200).json({
      message: "Chat tim berhasil dibersihkan",
      roomKey,
      deletedCount: Number(deletion?.deletedCount || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membersihkan chat tim",
      error: error.message,
    });
  }
}

module.exports = {
  clearAdminTeamMessages,
  getAdminTeamMessages,
  markAdminTeamMessagesRead,
  createAdminTeamMessage,
};
