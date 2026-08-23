import express from "express";
import {
  createOnlineClass,
  getOnlineClasses,
  getOnlineClassById,
  updateOnlineClass,
  deleteOnlineClass,
  getOnlineClassToken,
} from "../controllers/onlineClassController.js";
import { isAuthenticated, authorizeRoles } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

const TEACHING_STAFF = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN];

router.use(isAuthenticated);

router
  .route("/")
  .post(authorizeRoles(...TEACHING_STAFF), createOnlineClass)
  .get(getOnlineClasses);

router
  .route("/:id")
  .get(getOnlineClassById)
  .put(authorizeRoles(...TEACHING_STAFF), updateOnlineClass)
  .delete(authorizeRoles(...TEACHING_STAFF), deleteOnlineClass);

router.post("/:id/join-token", getOnlineClassToken);

export default router;
