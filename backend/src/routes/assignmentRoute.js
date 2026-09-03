import express from "express";
import {
    createTeacherAssignment,
    getTeacherAssignments,
    getAssignment,
    updateTeacherAssignment,
    deleteTeacherAssignment
} from "../controllers/assignmentController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", isAuthenticated, authorizeRoles(ROLES.TEACHER), createTeacherAssignment);
router.get("/", isAuthenticated, authorizeRoles(ROLES.TEACHER), getTeacherAssignments);
router.get("/:id", isAuthenticated, authorizeRoles(ROLES.TEACHER), getAssignment);
router.put("/:id", isAuthenticated, authorizeRoles(ROLES.TEACHER), updateTeacherAssignment);
router.delete("/:id", isAuthenticated, authorizeRoles(ROLES.TEACHER), deleteTeacherAssignment);

export default router;