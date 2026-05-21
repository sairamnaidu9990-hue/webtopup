const express = require("express");

const {
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
} = require("../controllers/workspace.controller");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/notes", protectAdmin, getWorkspaceNotes);
router.post("/notes", protectAdmin, createWorkspaceNote);
router.patch("/notes/:id", protectAdmin, updateWorkspaceNote);
router.delete("/notes/:id", protectAdmin, deleteWorkspaceNote);

router.get("/files", protectAdmin, getWorkspaceFiles);
router.post("/files", protectAdmin, createWorkspaceFile);
router.patch("/files/:id", protectAdmin, updateWorkspaceFile);
router.delete("/files/:id", protectAdmin, deleteWorkspaceFile);

router.get("/sheets", protectAdmin, getWorkspaceSheets);
router.post("/sheets", protectAdmin, createWorkspaceSheet);
router.get("/sheets/:id", protectAdmin, getWorkspaceSheetById);
router.patch("/sheets/:id", protectAdmin, updateWorkspaceSheet);
router.delete("/sheets/:id", protectAdmin, deleteWorkspaceSheet);

module.exports = router;
