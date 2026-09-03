import {
  createOnlineClass as createOnlineClassInDb,
  findOnlineClassById,
  listOnlineClasses as listOnlineClassesFromDb,
  updateOnlineClass as updateOnlineClassInDb,
  softDeleteOnlineClass,
} from "../models/onlineClassModel.js";
import { generateSfuToken } from "../services/sfuService.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler, success, failure } from "../utils/apiResponse.js";

const VALID_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"];

const isOwnerOrAdmin = (onlineClass, user) =>
  onlineClass.teacherId === user.id ||
  [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN].includes(user.role);

// POST /api/online-classes
export const createOnlineClass = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    className,
    section,
    subject,
    meetingUrl,
    scheduledAt,
    durationMinutes,
  } = req.body || {};

  if (!title?.trim() || !className?.trim() || !subject?.trim() || !scheduledAt || !durationMinutes) {
    return failure(res, {
      status: 400,
      message: "title, className, subject, scheduledAt, and durationMinutes are required.",
    });
  }

  const parsedScheduledAt = new Date(scheduledAt);
  if (Number.isNaN(parsedScheduledAt.getTime())) {
    return failure(res, { status: 400, message: "scheduledAt is not a valid date." });
  }

  const parsedDuration = Number(durationMinutes);
  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return failure(res, { status: 400, message: "durationMinutes must be a positive number." });
  }

  const onlineClass = await createOnlineClassInDb({
    title: title.trim(),
    description: description?.trim(),
    className: className.trim(),
    section: section?.trim(),
    subject: subject.trim(),
    teacherId: req.user.id,
    meetingUrl: meetingUrl?.trim() || null,
    scheduledAt: parsedScheduledAt,
    durationMinutes: parsedDuration,
    status: "scheduled",
  });

  return success(res, {
    status: 201,
    message: "Online class scheduled successfully.",
    data: onlineClass,
  });
});

// GET /api/online-classes
export const getOnlineClasses = asyncHandler(async (req, res) => {
  const { subject, status, className, section, teacherId } = req.query;

  if (req.user.role === ROLES.STUDENT) {
    if (!req.user.className) {
      return failure(res, {
        status: 400,
        messagte: "Your account has no class assigned yet.",
      });
    }

    const onlineClasses = await listOnlineClassesFromDb({
      className: req.user.className,
      section: req.user.section || undefined,
      subject,
      status,
    });

    return success(res, { message: "Online classes fetched successfully.", data: onlineClasses });
  }

  if (req.user.role === ROLES.TEACHER) {
    const onlineClasses = await listOnlineClassesFromDb({
      teacherId: req.user.id,
      className,
      section,
      subject,
      status,
    });
    return success(res, { message: "Online classes fetched successfully.", data: onlineClasses });
  }

  // Admin
  const onlineClasses = await listOnlineClassesFromDb({
    teacherId: teacherId ? Number(teacherId) : undefined,
    className,
    section,
    subject,
    status,
  });
  return success(res, { message: "Online classes fetched successfully.", data: onlineClasses });
});

// GET /api/online-classes/:id
export const getOnlineClassById = asyncHandler(async (req, res) => {
  const onlineClass = await findOnlineClassById(req.params.id);
  if (!onlineClass) {
    return failure(res, { status: 404, message: "Online class not found." });
  }

  if (req.user.role === ROLES.STUDENT) {
    const belongsToStudentClass =
      req.user.className &&
      onlineClass.className === req.user.className &&
      (!onlineClass.section || onlineClass.section === req.user.section);

    if (!belongsToStudentClass) {
      return failure(res, { status: 404, message: "Online class not found." });
    }
  } else if (req.user.role === ROLES.TEACHER && !isOwnerOrAdmin(onlineClass, req.user)) {
    return failure(res, { status: 403, message: "You can only view your own classes." });
  }

  return success(res, { message: "Online class fetched successfully.", data: onlineClass });
});

// PUT /api/online-classes/:id
export const updateOnlineClass = asyncHandler(async (req, res) => {
  const onlineClass = await findOnlineClassById(req.params.id);
  if (!onlineClass) {
    return failure(res, { status: 404, message: "Online class not found." });
  }

  if (!isOwnerOrAdmin(onlineClass, req.user)) {
    return failure(res, { status: 403, message: "You can only edit your own classes." });
  }

  const {
    title,
    description,
    className,
    section,
    subject,
    meetingUrl,
    scheduledAt,
    durationMinutes,
    status,
  } = req.body || {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return failure(res, { status: 400, message: "Invalid status." });
  }

  let parsedScheduledAt;
  if (scheduledAt !== undefined) {
    parsedScheduledAt = new Date(scheduledAt);
    if (Number.isNaN(parsedScheduledAt.getTime())) {
      return failure(res, { status: 400, message: "scheduledAt is not a valid date." });
    }
  }

  const updated = await updateOnlineClassInDb(req.params.id, {
    title: title?.trim(),
    description: description?.trim(),
    className: className?.trim(),
    section: section?.trim(),
    subject: subject?.trim(),
    meetingUrl: meetingUrl?.trim(),
    scheduledAt: parsedScheduledAt,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
    status,
  });

  return success(res, { message: "Online class updated successfully.", data: updated });
});

// DELETE /api/online-classes/:id
export const deleteOnlineClass = asyncHandler(async (req, res) => {
  const onlineClass = await findOnlineClassById(req.params.id);
  if (!onlineClass) {
    return failure(res, { status: 404, message: "Online class not found." });
  }

  if (!isOwnerOrAdmin(onlineClass, req.user)) {
    return failure(res, { status: 403, message: "You can only delete your own classes." });
  }

  await softDeleteOnlineClass(req.params.id);
  return success(res, { message: "Online class deleted successfully." });
});

// POST /api/online-classes/:id/join-token
export const getOnlineClassToken = asyncHandler(async (req, res) => {
  const onlineClass = await findOnlineClassById(req.params.id);
  if (!onlineClass) {
    return failure(res, { status: 404, message: "Online class not found." });
  }

  // Permission check
  if (req.user.role === ROLES.STUDENT) {
    const belongsToStudentClass =
      req.user.className &&
      onlineClass.className === req.user.className &&
      (!onlineClass.section || onlineClass.section === req.user.section);

    if (!belongsToStudentClass) {
      return failure(res, {
        status: 403,
        message: "You are not enrolled in this class.",
      });
    }
  }

  const isHost = isOwnerOrAdmin(onlineClass, req.user);

  // If teacher/host joins, transition scheduled class status to ongoing
  if (isHost && onlineClass.status === "scheduled") {
    await updateOnlineClassInDb(onlineClass.id, { status: "ongoing" });
  }

  const { sfuUrl, token, roomName, identity, isSfuConfigured } =
    await generateSfuToken({
      classId: onlineClass.id,
      user: req.user,
      isHost,
    });

  if (!isSfuConfigured && onlineClass.classMode !== "external") {
    return failure(res, {
      status: 503,
      message: "The LiveKit media server is not configured on the backend.",
    });
  }

  return success(res, {
    message: "SFU join token generated successfully.",
    data: {
      sfuUrl,
      token,
      roomName,
      identity,
      classMode: onlineClass.classMode,
      isSfuConfigured,
    },
  });
});
