import express from "express";
import { createStaffMember, deactivateStaffMember, listStaffMembers, updateStaffMember } from "../staff/staffController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticated, authorizeRoles("admin", "administrator"), listStaffMembers);
router.post("/", isAuthenticated, authorizeRoles("admin", "administrator"), createStaffMember);
router.put("/:userId", isAuthenticated, authorizeRoles("admin", "administrator"), updateStaffMember);
router.delete("/:userId", isAuthenticated, authorizeRoles("admin", "administrator"), deactivateStaffMember);

export default router;
