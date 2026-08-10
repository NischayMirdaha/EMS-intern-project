import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  verifyOtp,
  verifyRegistrationOtp,
  updateUserClassController,
} from "../controllers/userController.js";

import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authMiddleware.js";

import { ROLES } from "../constants/roles.js";

const router = express.Router();

const STAFF_ROLES = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", isAuthenticated, getCurrentUser);
router.put("/class", isAuthenticated, authorizeRoles(...STAFF_ROLES), updateUserClassController);
router.put("/:id/class", isAuthenticated, authorizeRoles(...STAFF_ROLES), updateUserClassController);
router.post("/verify-otp", verifyOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.get("/admin-only", isAuthenticated, authorizeRoles(ROLES.SUPER_ADMIN), (_req, res) =>
  res.json({ success: true, message: "Admin access granted." })
);
router.get("/school-admin-only", isAuthenticated, authorizeRoles(ROLES.SCHOOL_ADMIN), (_req, res) =>
  res.json({ success: true, message: "School Admin access granted." })
);  
router.get("/teacher-only", isAuthenticated, authorizeRoles(ROLES.TEACHER), (_req, res) =>
  res.json({ success: true, message: "Teacher access granted." })
);
router.get("/student-only", isAuthenticated, authorizeRoles(ROLES.STUDENT), (_req, res) =>
  res.json({ success: true, message: "Student access granted." })
);

export default router;
