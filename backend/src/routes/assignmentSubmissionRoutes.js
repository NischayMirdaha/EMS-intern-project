import express from "express";

import {
  submitAssignment,
  getStudentSubmissions,
  getAssignmentSubmissions,
  editSubmission,
  markSubmission,
} from "../controllers/assignmentSubmissionController.js";

import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Student Routes

// Submit an assignment
router.post(
  "/",
  isAuthenticated,
  authorizeRoles(ROLES.STUDENT),
  submitAssignment
);

// View own submissions
router.get(
  "/student",
  isAuthenticated,
  authorizeRoles(ROLES.STUDENT),
  getStudentSubmissions
);

// Edit own submission
router.put(
  "/:id",
  isAuthenticated,
  authorizeRoles(ROLES.STUDENT),
  editSubmission
);

//Teacher Routes

// View submissions for one assignment
router.get(
  "/assignment/:assignmentId",
  isAuthenticated,
  authorizeRoles(ROLES.TEACHER),
  getAssignmentSubmissions
);

// Grade a submission
router.put(
  "/:id/grade",
  isAuthenticated,
  authorizeRoles(ROLES.TEACHER),
  markSubmission
);

export default router;