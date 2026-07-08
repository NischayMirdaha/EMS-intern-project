import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  verifyOtp,
  verifyRegistrationOtp,
} from "../controllers/userController.js";

import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authMiddleware.js";

import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", isAuthenticated, getCurrentUser);
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
