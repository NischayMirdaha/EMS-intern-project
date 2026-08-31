import express from "express";
import {
  getAllOnlineExams,
  getOnlineExamById,
  createOnlineExam,
  updateOnlineExam,
  deleteOnlineExam,
  getExamQuestions,
  saveExamQuestions,
  startExamAttempt,
  submitExamAttempt,
  getExamSubmissions,
  getAttemptDetails,
} from "../controllers/onlineExamController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ONLINE EXAM CRUD
// ==========================================
router.get("/", getAllOnlineExams);
router.get("/:id", getOnlineExamById);

router.post(
  "/",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  createOnlineExam
);

router.put(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  updateOnlineExam
);

router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  deleteOnlineExam
);

// ==========================================
// QUESTIONS MANAGEMENT
// ==========================================
router.get("/:id/questions", getExamQuestions);

router.post(
  "/:id/questions",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  saveExamQuestions
);

// ==========================================
// STUDENT TEST ENGINE (Start, Submit, View Submissions)
// ==========================================
router.post("/:id/start", startExamAttempt);
router.post("/:id/submit", submitExamAttempt);

router.get(
  "/:id/submissions",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  getExamSubmissions
);

router.get("/attempts/:attemptId", getAttemptDetails);

export default router;
