const WorkspaceFile = require("../models/WorkspaceFile");
const WorkspaceNote = require("../models/WorkspaceNote");
const WorkspaceSheet = require("../models/WorkspaceSheet");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_DATA_URL_LENGTH = 7 * 1024 * 1024;
const MAX_SHEET_COLUMNS = 12;
const MAX_SHEET_ROWS = 200;
const MAX_CELL_LENGTH = 500;
const DEFAULT_SHEET_COLUMN_COUNT = 4;
const DEFAULT_SHEET_ROW_COUNT = 5;
const ALLOWED_FILE_MIME_TYPES = new Set([
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

function toStringValue(value) {
  return String(value || "").trim();
}

function buildAdminSnapshot(admin) {
  return {
    adminId: admin?._id,
    name: toStringValue(admin?.name || admin?.email || "Admin"),
    email: toStringValue(admin?.email).toLowerCase(),
    role: toStringValue(admin?.role || "admin"),
  };
}

function buildWorkspaceEntityId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNotePayload(body) {
  const title = toStringValue(body?.title).slice(0, 120);
  const content = String(body?.content || "").replace(/\r\n/g, "\n").trim();
  const color = toStringValue(body?.color || "slate").toLowerCase().slice(0, 30);
  const isPinned = Boolean(body?.isPinned);

  if (!title) {
    throw new Error("Judul catatan wajib diisi");
  }

  return {
    title,
    content: content.slice(0, 50000),
    color: color || "slate",
    isPinned,
  };
}

function normalizeWorkspaceFilePayload(body) {
  const name = toStringValue(body?.name).slice(0, 180);
  const mimeType = toStringValue(body?.mimeType).toLowerCase().slice(0, 120);
  const dataUrl = String(body?.dataUrl || "").trim();
  const size = Math.round(Number(body?.size || 0));

  if (!name) {
    throw new Error("Nama file wajib diisi");
  }

  if (!mimeType || !ALLOWED_FILE_MIME_TYPES.has(mimeType)) {
    throw new Error("Jenis file belum didukung");
  }

  if (mimeType === "image/svg+xml") {
    throw new Error("Format SVG belum didukung");
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Ukuran file maksimal 5 MB");
  }

  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new Error("Format file upload tidak valid");
  }

  if (dataUrl.length > MAX_FILE_DATA_URL_LENGTH) {
    throw new Error("Ukuran file terlalu besar untuk diproses");
  }

  return {
    name,
    mimeType,
    kind: mimeType.startsWith("image/") ? "image" : "file",
    size,
    dataUrl,
  };
}

function createDefaultColumns() {
  return Array.from({ length: DEFAULT_SHEET_COLUMN_COUNT }).map((_, index) => ({
    id: `col-${index + 1}`,
    label: `Kolom ${index + 1}`,
  }));
}

function createDefaultRows(columns) {
  return Array.from({ length: DEFAULT_SHEET_ROW_COUNT }).map((_, index) => ({
    id: `row-${index + 1}`,
    cells: Object.fromEntries(columns.map((column) => [column.id, ""])),
  }));
}

function normalizeSheetColumns(value) {
  if (!Array.isArray(value) || value.length === 0) {
    const defaults = createDefaultColumns();
    return defaults;
  }

  const columns = value
    .slice(0, MAX_SHEET_COLUMNS)
    .map((column, index) => {
      const id =
        toStringValue(column?.id).slice(0, 40) || `col-${index + 1}`;
      const label =
        toStringValue(column?.label).slice(0, 80) || `Kolom ${index + 1}`;

      return { id, label };
    });

  if (columns.length === 0) {
    return createDefaultColumns();
  }

  return columns;
}

function normalizeSheetRows(value, columns) {
  if (!Array.isArray(value) || value.length === 0) {
    return createDefaultRows(columns);
  }

  return value.slice(0, MAX_SHEET_ROWS).map((row, index) => {
    const id = toStringValue(row?.id).slice(0, 40) || `row-${index + 1}`;
    const cells = {};

    columns.forEach((column) => {
      const rawValue =
        row?.cells && typeof row.cells === "object"
          ? row.cells[column.id]
          : "";
      cells[column.id] = String(rawValue || "").slice(0, MAX_CELL_LENGTH);
    });

    return {
      id,
      cells,
    };
  });
}

function normalizeSheetPayload(body) {
  const name = toStringValue(body?.name).slice(0, 120);
  const description = String(body?.description || "").trim().slice(0, 240);

  if (!name) {
    throw new Error("Nama spreadsheet wajib diisi");
  }

  const columns = normalizeSheetColumns(body?.columns);
  const rows = normalizeSheetRows(body?.rows, columns);

  return {
    name,
    description,
    columns,
    rows,
  };
}

function serializeWorkspaceNote(note) {
  return {
    id: String(note?._id || ""),
    title: toStringValue(note?.title),
    content: String(note?.content || ""),
    color: toStringValue(note?.color || "slate"),
    isPinned: Boolean(note?.isPinned),
    createdBy: note?.createdBy
      ? {
          adminId: String(note.createdBy.adminId || ""),
          name: toStringValue(note.createdBy.name),
          email: toStringValue(note.createdBy.email),
          role: toStringValue(note.createdBy.role),
        }
      : null,
    updatedBy: note?.updatedBy
      ? {
          adminId: String(note.updatedBy.adminId || ""),
          name: toStringValue(note.updatedBy.name),
          email: toStringValue(note.updatedBy.email),
          role: toStringValue(note.updatedBy.role),
        }
      : null,
    createdAt: note?.createdAt || null,
    updatedAt: note?.updatedAt || null,
  };
}

function serializeWorkspaceFile(file) {
  return {
    id: String(file?._id || ""),
    name: toStringValue(file?.name),
    mimeType: toStringValue(file?.mimeType),
    kind: toStringValue(file?.kind || "file"),
    size: Number(file?.size || 0),
    dataUrl: String(file?.dataUrl || ""),
    uploadedBy: file?.uploadedBy
      ? {
          adminId: String(file.uploadedBy.adminId || ""),
          name: toStringValue(file.uploadedBy.name),
          email: toStringValue(file.uploadedBy.email),
          role: toStringValue(file.uploadedBy.role),
        }
      : null,
    updatedBy: file?.updatedBy
      ? {
          adminId: String(file.updatedBy.adminId || ""),
          name: toStringValue(file.updatedBy.name),
          email: toStringValue(file.updatedBy.email),
          role: toStringValue(file.updatedBy.role),
        }
      : null,
    createdAt: file?.createdAt || null,
    updatedAt: file?.updatedAt || null,
  };
}

function serializeWorkspaceSheet(sheet) {
  return {
    id: String(sheet?._id || ""),
    name: toStringValue(sheet?.name),
    description: String(sheet?.description || ""),
    columns: Array.isArray(sheet?.columns)
      ? sheet.columns.map((column) => ({
          id: toStringValue(column?.id),
          label: toStringValue(column?.label),
        }))
      : [],
    rows: Array.isArray(sheet?.rows)
      ? sheet.rows.map((row) => ({
          id: toStringValue(row?.id),
          cells:
            row?.cells instanceof Map
              ? Object.fromEntries(row.cells.entries())
              : row?.cells && typeof row.cells === "object"
                ? Object.fromEntries(
                    Object.entries(row.cells).map(([key, value]) => [
                      key,
                      String(value || ""),
                    ])
                  )
                : {},
        }))
      : [],
    createdBy: sheet?.createdBy
      ? {
          adminId: String(sheet.createdBy.adminId || ""),
          name: toStringValue(sheet.createdBy.name),
          email: toStringValue(sheet.createdBy.email),
          role: toStringValue(sheet.createdBy.role),
        }
      : null,
    updatedBy: sheet?.updatedBy
      ? {
          adminId: String(sheet.updatedBy.adminId || ""),
          name: toStringValue(sheet.updatedBy.name),
          email: toStringValue(sheet.updatedBy.email),
          role: toStringValue(sheet.updatedBy.role),
        }
      : null,
    createdAt: sheet?.createdAt || null,
    updatedAt: sheet?.updatedAt || null,
  };
}

async function getWorkspaceNotes(req, res) {
  try {
    const items = await WorkspaceNote.find()
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return res.status(200).json({
      items: items.map(serializeWorkspaceNote),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil catatan internal",
      error: error.message,
    });
  }
}

async function createWorkspaceNote(req, res) {
  try {
    const adminSnapshot = buildAdminSnapshot(req.admin);
    const payload = normalizeNotePayload(req.body);

    const note = await WorkspaceNote.create({
      ...payload,
      createdBy: adminSnapshot,
      updatedBy: adminSnapshot,
    });

    return res.status(201).json({
      message: "Catatan internal berhasil dibuat",
      item: serializeWorkspaceNote(note),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat catatan internal",
      error: error.message,
    });
  }
}

async function updateWorkspaceNote(req, res) {
  try {
    const note = await WorkspaceNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Catatan tidak ditemukan",
      });
    }

    Object.assign(note, normalizeNotePayload(req.body), {
      updatedBy: buildAdminSnapshot(req.admin),
    });
    await note.save();

    return res.status(200).json({
      message: "Catatan berhasil diperbarui",
      item: serializeWorkspaceNote(note),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui catatan",
      error: error.message,
    });
  }
}

async function deleteWorkspaceNote(req, res) {
  try {
    const note = await WorkspaceNote.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Catatan tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Catatan berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus catatan",
      error: error.message,
    });
  }
}

async function getWorkspaceFiles(req, res) {
  try {
    const search = toStringValue(req.query.search).toLowerCase();
    const items = await WorkspaceFile.find()
      .sort({ createdAt: -1 })
      .lean();

    const filteredItems = !search
      ? items
      : items.filter((item) =>
          [item.name, item.mimeType, item.kind]
            .join(" ")
            .toLowerCase()
            .includes(search)
        );

    return res.status(200).json({
      items: filteredItems.map(serializeWorkspaceFile),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil file internal",
      error: error.message,
    });
  }
}

async function createWorkspaceFile(req, res) {
  try {
    const adminSnapshot = buildAdminSnapshot(req.admin);
    const payload = normalizeWorkspaceFilePayload(req.body);

    const file = await WorkspaceFile.create({
      ...payload,
      uploadedBy: adminSnapshot,
      updatedBy: adminSnapshot,
    });

    return res.status(201).json({
      message: "File internal berhasil diunggah",
      item: serializeWorkspaceFile(file),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengunggah file internal",
      error: error.message,
    });
  }
}

async function updateWorkspaceFile(req, res) {
  try {
    const file = await WorkspaceFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        message: "File tidak ditemukan",
      });
    }

    const name = toStringValue(req.body?.name).slice(0, 180);

    if (!name) {
      return res.status(400).json({
        message: "Nama file wajib diisi",
      });
    }

    file.name = name;
    file.updatedBy = buildAdminSnapshot(req.admin);
    await file.save();

    return res.status(200).json({
      message: "Nama file berhasil diperbarui",
      item: serializeWorkspaceFile(file),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui file",
      error: error.message,
    });
  }
}

async function deleteWorkspaceFile(req, res) {
  try {
    const file = await WorkspaceFile.findByIdAndDelete(req.params.id);

    if (!file) {
      return res.status(404).json({
        message: "File tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "File berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus file",
      error: error.message,
    });
  }
}

async function getWorkspaceSheets(req, res) {
  try {
    const items = await WorkspaceSheet.find()
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      items: items.map(serializeWorkspaceSheet),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil spreadsheet internal",
      error: error.message,
    });
  }
}

async function createWorkspaceSheet(req, res) {
  try {
    const adminSnapshot = buildAdminSnapshot(req.admin);
    const name = toStringValue(req.body?.name).slice(0, 120) || "Spreadsheet Baru";
    const description = String(req.body?.description || "").trim().slice(0, 240);
    const columns = createDefaultColumns();
    const rows = createDefaultRows(columns);

    const sheet = await WorkspaceSheet.create({
      name,
      description,
      columns,
      rows,
      createdBy: adminSnapshot,
      updatedBy: adminSnapshot,
    });

    return res.status(201).json({
      message: "Spreadsheet internal berhasil dibuat",
      item: serializeWorkspaceSheet(sheet),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat spreadsheet internal",
      error: error.message,
    });
  }
}

async function getWorkspaceSheetById(req, res) {
  try {
    const sheet = await WorkspaceSheet.findById(req.params.id).lean();

    if (!sheet) {
      return res.status(404).json({
        message: "Spreadsheet tidak ditemukan",
      });
    }

    return res.status(200).json({
      item: serializeWorkspaceSheet(sheet),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil spreadsheet",
      error: error.message,
    });
  }
}

async function updateWorkspaceSheet(req, res) {
  try {
    const sheet = await WorkspaceSheet.findById(req.params.id);

    if (!sheet) {
      return res.status(404).json({
        message: "Spreadsheet tidak ditemukan",
      });
    }

    Object.assign(sheet, normalizeSheetPayload(req.body), {
      updatedBy: buildAdminSnapshot(req.admin),
    });
    await sheet.save();

    return res.status(200).json({
      message: "Spreadsheet berhasil diperbarui",
      item: serializeWorkspaceSheet(sheet),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui spreadsheet",
      error: error.message,
    });
  }
}

async function deleteWorkspaceSheet(req, res) {
  try {
    const sheet = await WorkspaceSheet.findByIdAndDelete(req.params.id);

    if (!sheet) {
      return res.status(404).json({
        message: "Spreadsheet tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Spreadsheet berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus spreadsheet",
      error: error.message,
    });
  }
}

module.exports = {
  createWorkspaceFile,
  createWorkspaceNote,
  createWorkspaceSheet,
  deleteWorkspaceFile,
  deleteWorkspaceNote,
  deleteWorkspaceSheet,
  getWorkspaceFiles,
  getWorkspaceNotes,
  getWorkspaceSheetById,
  getWorkspaceSheets,
  updateWorkspaceFile,
  updateWorkspaceNote,
  updateWorkspaceSheet,
};
