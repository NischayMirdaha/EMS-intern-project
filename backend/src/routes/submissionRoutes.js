import express from "express";
import {
  submitAssignment,
  getMySubmission,
  listSubmissions,
  gradeSubmission,
  downloadSubmissionAttachment,
} from "../controllers/submissionController.js";
import { authorizeRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  uploadSubmissionAttachment,
  handleUploadErrors,
  cleanupOrphanedUploadOnFailure,
} from "../middleware/uploadMiddleware.js";


const router = express.Router({ mergeParams: true });

const TEACHING_STAFF = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

router
  .route("/")
  .get(authorizeRoles(...TEACHING_STAFF), listSubmissions)
  .post(
    authorizeRoles(ROLES.STUDENT),
    uploadSubmissionAttachment,
    handleUploadErrors,
    cleanupOrphanedUploadOnFailure,
    submitAssignment
  );

router.get("/me", authorizeRoles(ROLES.STUDENT), getMySubmission);

router.get("/:submissionId/attachment", downloadSubmissionAttachment);

router.put(
  "/:submissionId/grade",
  authorizeRoles(...TEACHING_STAFF),
  gradeSubmission
);

export default router;
