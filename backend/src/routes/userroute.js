import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  verifyOtp,
  verifyRegistrationOtp,
  changePassword,
} from "../controllers/userController.js";

import {
  authorizeRoles,
  isAuthenticated,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", isAuthenticated, getCurrentUser);
router.post("/change-password", isAuthenticated, changePassword);
router.post("/verify-otp", verifyOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.get("/admin-only", isAuthenticated, authorizeRoles("admin"), (_req, res) =>
  res.json({ success: true, message: "Admin access granted." })
);

export default router;
