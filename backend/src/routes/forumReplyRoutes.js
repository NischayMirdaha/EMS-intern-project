import express from "express";
import {
  addReply,
  getReplies,
  editReply,
  deleteReply,
} from "../controllers/forumController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

// mergeParams: true so we can access :threadId from the parent router
const router = express.Router({ mergeParams: true });

router.use(isAuthenticated);

router
  .route("/")
  .post(addReply)
  .get(getReplies);

router
  .route("/:replyId")
  .put(editReply)
  .delete(deleteReply);

export default router;
