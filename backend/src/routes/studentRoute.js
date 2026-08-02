import express from "express";
import {
  createStudentProfile,
  updateStudentProfile,
  getStudentProfile,
  listStudents,
  addStudentDocument,
  listStudentDocuments,
  addAcademicRecord,
  listAcademicHistory,
  addHealthRecord,
  listHealthRecords,
  addDisciplinaryRecord,
  listDisciplinaryRecords,
  addScholarship,
  listScholarships,
  createOrUpdateAlumniProfile,
  listAlumni,
} from "../student/studentController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticated, authorizeRoles("admin", "administrator"), listStudents);
router.get("/alumni", isAuthenticated, authorizeRoles("admin", "administrator"), listAlumni);
router.get("/:studentId", isAuthenticated, getStudentProfile);
router.post("/", isAuthenticated, authorizeRoles("admin", "administrator"), createStudentProfile);
router.put("/:studentId", isAuthenticated, authorizeRoles("admin", "administrator"), updateStudentProfile);

router.post(
  "/:studentId/documents",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  addStudentDocument
);
router.get(
  "/:studentId/documents",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  listStudentDocuments
);

router.post(
  "/:studentId/academic-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  addAcademicRecord
);
router.get(
  "/:studentId/academic-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  listAcademicHistory
);

router.post(
  "/:studentId/health-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  addHealthRecord
);
router.get(
  "/:studentId/health-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  listHealthRecords
);

router.post(
  "/:studentId/disciplinary-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  addDisciplinaryRecord
);
router.get(
  "/:studentId/disciplinary-records",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  listDisciplinaryRecords
);

router.post(
  "/:studentId/scholarships",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  addScholarship
);
router.get(
  "/:studentId/scholarships",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  listScholarships
);

router.post(
  "/:studentId/alumni",
  isAuthenticated,
  authorizeRoles("admin", "administrator"),
  createOrUpdateAlumniProfile
);

export default router;
