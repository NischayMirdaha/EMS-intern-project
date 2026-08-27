import express from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  downloadAssignmentAttachment,
} from "../controllers/assignmentController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  uploadAssignmentAttachment,
  handleUploadErrors,
} from "../middleware/uploadMiddleware.js";
import submissionRoutes from "./submissionRoutes.js";

const router = express.Router();

const TEACHING_STAFF = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

router.use(isAuthenticated);

router
  .route("/")
  .post(
    authorizeRoles(...TEACHING_STAFF),
    uploadAssignmentAttachment,
    handleUploadErrors,
    createAssignment
  )
  .get(getAssignments); 

router
  .route("/:id")
  .get(getAssignmentById)
  .put(
    authorizeRoles(...TEACHING_STAFF),
    uploadAssignmentAttachment,
    handleUploadErrors,
    updateAssignment
  )
  .delete(authorizeRoles(...TEACHING_STAFF), deleteAssignment);

router.get("/:id/attachment", downloadAssignmentAttachment);


router.use("/:id/submissions", submissionRoutes);

export default router;
