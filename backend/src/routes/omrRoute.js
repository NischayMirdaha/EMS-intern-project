import express from "express";
import {
  getAllOmrTemplates,
  getOmrTemplateById,
  createOmrTemplate,
  updateOmrTemplate,
  deleteOmrTemplate,
  saveAnswerKey,
  evaluateOmrSheet,
  getTemplateEvaluations,
  deleteEvaluation,
  getOmrAnalytics,
} from "../controllers/omrController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// OMR TEMPLATE CRUD
// ==========================================
router.get("/", getAllOmrTemplates);
router.get("/:id", getOmrTemplateById);

router.post(
  "/",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  createOmrTemplate
);

router.put(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  updateOmrTemplate
);

router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  deleteOmrTemplate
);

// ==========================================
// MASTER ANSWER KEY
// ==========================================
router.post(
  "/:id/answer-key",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  saveAnswerKey
);

// ==========================================
// OMR SHEET EVALUATION & ROSTER
// ==========================================
router.post(
  "/:id/evaluate",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  evaluateOmrSheet
);

router.get(
  "/:id/evaluations",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  getTemplateEvaluations
);

router.delete(
  "/evaluations/:evalId",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  deleteEvaluation
);

// ==========================================
// ITEM ANALYSIS & DISTRACTOR REPORT
// ==========================================
router.get(
  "/:id/analytics",
  isAuthenticated,
  authorizeRoles("teacher", "admin", "user"),
  getOmrAnalytics
);

export default router;
