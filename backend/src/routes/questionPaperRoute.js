import express from "express";

import {
  createQuestionPaper,
  getAllQuestionPapers,
  getQuestionPaperById,
  updateQuestionPaper,
  deleteQuestionPaper,
  streamQuestionPaperFile,
  downloadQuestionPaperFile,
} from "../controllers/questionPaperController.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  isAuthenticated,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE / UPLOAD QUESTION PAPER
// Teacher, Admin, User
// ==========================================

router.post(
  "/",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  upload.single("question_paper"),
  createQuestionPaper
);


// ==========================================
// GET ALL QUESTION PAPERS (Public)
// ==========================================

router.get("/", getAllQuestionPapers);


// ==========================================
// STREAM / VIEW PDF INLINE (Public)
// ==========================================

router.get("/:id/view", streamQuestionPaperFile);


// ==========================================
// DOWNLOAD PDF ATTACHMENT (Public)
// ==========================================

router.get("/:id/download", downloadQuestionPaperFile);


// ==========================================
// GET SINGLE QUESTION PAPER (Public)
// ==========================================

router.get("/:id", getQuestionPaperById);


// ==========================================
// UPDATE QUESTION PAPER
// Teacher, Admin, User
// ==========================================

router.put(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  upload.single("question_paper"),
  updateQuestionPaper
);


// ==========================================
// DELETE QUESTION PAPER
// Teacher, Admin, User
// ==========================================

router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  deleteQuestionPaper
);

export default router;