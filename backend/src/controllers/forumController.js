import {
  createThread as createThreadInDb,
  findThreadById,
  listThreads as listThreadsFromDb,
  updateThread as updateThreadInDb,
  softDeleteThread,
  createReply as createReplyInDb,
  listRepliesForThread,
  findReplyById,
  updateReply as updateReplyInDb,
  softDeleteReply,
} from "../models/forumModel.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler, success, failure } from "../utils/apiResponse.js";

const isAuthorOrAdmin = (resource, user) =>
  resource.authorId === user.id ||
  [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN].includes(user.role);

// ═══════════════════════════════════════════════════════════════
//  THREADS
// ═══════════════════════════════════════════════════════════════

// POST /api/forums
// Any authenticated user can start a discussion thread.
export const createThread = asyncHandler(async (req, res) => {
  const { title, body, className, section, subject } = req.body || {};

  if (!title?.trim() || !body?.trim()) {
    return failure(res, {
      status: 400,
      message: "title and body are required.",
    });
  }

  const thread = await createThreadInDb({
    title: title.trim(),
    body: body.trim(),
    className: className?.trim(),
    section: section?.trim(),
    subject: subject?.trim(),
    authorId: req.user.id,
  });

  return success(res, {
    status: 201,
    message: "Thread created successfully.",
    data: thread,
  });
});

// GET /api/forums
// Students see threads scoped to their class (+ school-wide threads).
// Teachers see everything (or can filter). Admins see everything.
export const getThreads = asyncHandler(async (req, res) => {
  const { className, section, subject } = req.query;

  if (req.user.role === ROLES.STUDENT) {
    const threads = await listThreadsFromDb({
      className: req.user.className,
      section: req.user.section || undefined,
      subject,
    });
    return success(res, { message: "Threads fetched successfully.", data: threads });
  }

  // Teacher / Admin — use optional query filters
  const threads = await listThreadsFromDb({
    className,
    section,
    subject,
  });
  return success(res, { message: "Threads fetched successfully.", data: threads });
});

// GET /api/forums/:threadId
export const getThreadById = asyncHandler(async (req, res) => {
  const thread = await findThreadById(req.params.threadId);
  if (!thread) {
    return failure(res, { status: 404, message: "Thread not found." });
  }

  return success(res, { message: "Thread fetched successfully.", data: thread });
});

// PUT /api/forums/:threadId
// Author can edit title/body. Admins/teachers can also pin or lock.
export const updateThread = asyncHandler(async (req, res) => {
  const thread = await findThreadById(req.params.threadId);
  if (!thread) {
    return failure(res, { status: 404, message: "Thread not found." });
  }

  if (!isAuthorOrAdmin(thread, req.user)) {
    return failure(res, { status: 403, message: "You can only edit your own threads." });
  }

  const { title, body, className, section, subject, isPinned, isLocked } =
    req.body || {};

  // Only teaching staff / admins can pin or lock threads
  const isStaff = [ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN].includes(
    req.user.role
  );

  const updated = await updateThreadInDb(req.params.threadId, {
    title: title?.trim(),
    body: body?.trim(),
    className: className?.trim(),
    section: section?.trim(),
    subject: subject?.trim(),
    isPinned: isStaff ? isPinned : undefined,
    isLocked: isStaff ? isLocked : undefined,
  });

  return success(res, { message: "Thread updated successfully.", data: updated });
});

// DELETE /api/forums/:threadId
export const deleteThread = asyncHandler(async (req, res) => {
  const thread = await findThreadById(req.params.threadId);
  if (!thread) {
    return failure(res, { status: 404, message: "Thread not found." });
  }

  if (!isAuthorOrAdmin(thread, req.user)) {
    return failure(res, { status: 403, message: "You can only delete your own threads." });
  }

  await softDeleteThread(req.params.threadId);
  return success(res, { message: "Thread deleted successfully." });
});

// ═══════════════════════════════════════════════════════════════
//  REPLIES
// ═══════════════════════════════════════════════════════════════

// POST /api/forums/:threadId/replies
export const addReply = asyncHandler(async (req, res) => {
  const thread = await findThreadById(req.params.threadId);
  if (!thread) {
    return failure(res, { status: 404, message: "Thread not found." });
  }

  if (thread.isLocked) {
    return failure(res, {
      status: 400,
      message: "This thread is locked. No new replies are allowed.",
    });
  }

  const { body } = req.body || {};
  if (!body?.trim()) {
    return failure(res, { status: 400, message: "body is required." });
  }

  const reply = await createReplyInDb({
    threadId: thread.id,
    body: body.trim(),
    authorId: req.user.id,
  });

  return success(res, {
    status: 201,
    message: "Reply posted successfully.",
    data: reply,
  });
});

// GET /api/forums/:threadId/replies
export const getReplies = asyncHandler(async (req, res) => {
  const thread = await findThreadById(req.params.threadId);
  if (!thread) {
    return failure(res, { status: 404, message: "Thread not found." });
  }

  const replies = await listRepliesForThread(thread.id);
  return success(res, { message: "Replies fetched successfully.", data: replies });
});

// PUT /api/forums/:threadId/replies/:replyId
export const editReply = asyncHandler(async (req, res) => {
  const reply = await findReplyById(req.params.replyId);
  if (!reply) {
    return failure(res, { status: 404, message: "Reply not found." });
  }

  if (!isAuthorOrAdmin(reply, req.user)) {
    return failure(res, { status: 403, message: "You can only edit your own replies." });
  }

  const { body } = req.body || {};
  if (!body?.trim()) {
    return failure(res, { status: 400, message: "body is required." });
  }

  const updated = await updateReplyInDb(reply.id, body.trim());
  return success(res, { message: "Reply updated successfully.", data: updated });
});

// DELETE /api/forums/:threadId/replies/:replyId
export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await findReplyById(req.params.replyId);
  if (!reply) {
    return failure(res, { status: 404, message: "Reply not found." });
  }

  if (!isAuthorOrAdmin(reply, req.user)) {
    return failure(res, { status: 403, message: "You can only delete your own replies." });
  }

  await softDeleteReply(reply.id);
  return success(res, { message: "Reply deleted successfully." });
});
