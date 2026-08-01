import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  listAllUsers,
  getUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  verifyOtp,
  verifyRegistrationOtp,
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
router.get("/admin/users", isAuthenticated, authorizeRoles("admin"), listAllUsers);
router.get("/admin/users/:id", isAuthenticated, authorizeRoles("admin"), getUserByAdmin);
router.put("/admin/users/:id", isAuthenticated, authorizeRoles("admin"), updateUserByAdmin);
router.delete("/admin/users/:id", isAuthenticated, authorizeRoles("admin"), deleteUserByAdmin);
router.post("/verify-otp", verifyOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.get("/admin-only", isAuthenticated, authorizeRoles("admin"), (_req, res) =>
  res.json({ success: true, message: "Admin access granted." })
);

export default router;
