import express from "express";
import {
  createThread,
  getThreads,
  getThreadById,
  updateThread,
  deleteThread,
} from "../controllers/forumController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import replyRoutes from "./forumReplyRoutes.js";

const router = express.Router();


router.use(isAuthenticated);

router
  .route("/")
  .post(createThread)
  .get(getThreads);

router
  .route("/:threadId")
  .get(getThreadById)
  .put(updateThread)
  .delete(deleteThread);

// Mount reply routes under /:threadId/replies
router.use("/:threadId/replies", replyRoutes);

export default router;
