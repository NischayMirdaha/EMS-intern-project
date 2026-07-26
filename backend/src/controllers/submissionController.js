import { findAssignmentById } from "../models/assignmentModel.js";
import {
  upsertSubmission,
  findSubmissionByAssignmentAndStudent,
  findSubmissionById,
  listSubmissionsForAssignment,
  gradeSubmission as gradeSubmissionInDb,
} from "../models/submissionModel.js";
// Removed findStudentProfileByUserId because we use req.user directly
import { ROLES } from "../constants/roles.js";
import { ASSIGNMENT_STATUS } from "../constants/assignmentStatus.js";
import { UPLOAD_SUBDIR } from "../constants/fileUpload.js";
import {
  toStoredPath,
  resolveStoredPath,
  deleteStoredFile,
} from "../utils/fileStorage.js";
import { asyncHandler, success, failure } from "../utils/apiResponse.js";

const isOwnerOrAdmin = (assignment, user) =>
  assignment.teacherId === user.id ||
  [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN].includes(user.role);

// POST /api/assignments/:id/submissions
// Role: student. Submitting again before grading overwrites the previous
// submission (see upsertSubmission) — this is a deliberate "resubmit"
// workflow, not a duplicate-prevention error.
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment || assignment.status === ASSIGNMENT_STATUS.DRAFT) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  const belongsToStudentClass =
    req.user.className &&
    assignment.className === req.user.className &&
    (!assignment.section || assignment.section === req.user.section);
  if (!belongsToStudentClass) {
    return failure(res, {
      status: 403,
      message: "This assignment is not assigned to your class.",
    });
  }

  if (assignment.status === ASSIGNMENT_STATUS.CLOSED) {
    return failure(res, {
      status: 400,
      message: "This assignment is closed and no longer accepting submissions.",
    });
  }

  const previousSubmission = await findSubmissionByAssignmentAndStudent(
    assignment.id,
    req.user.id
  );

  const { submissionText } = req.body || {};
  const attachmentUrl = req.file
    ? toStoredPath(UPLOAD_SUBDIR.SUBMISSIONS, req.file.filename)
    : previousSubmission?.attachmentUrl;
  const attachmentOriginalName = req.file
    ? req.file.originalname
    : previousSubmission?.attachmentOriginalName;

  if (!submissionText?.trim() && !attachmentUrl) {
    return failure(res, {
      status: 400,
      message: "Provide submissionText and/or an attachment file.",
    });
  }

  const isLate = new Date() > new Date(assignment.dueDate);


  const submission = await upsertSubmission({
    assignmentId: assignment.id,
    studentId: req.user.id,
    submissionText: submissionText?.trim(),
    attachmentUrl,
    attachmentOriginalName,
    isLate,
  });

  if (req.file && previousSubmission?.attachmentUrl) {
    deleteStoredFile(previousSubmission.attachmentUrl);
  }

  return success(res, {
    status: 201,
    message: isLate
      ? "Assignment submitted (marked late)."
      : "Assignment submitted successfully.",
    data: submission,
  });
});

// GET /api/assignments/:id/submissions/me
// Role: student — check their own submission + grade for one assignment.
export const getMySubmission = asyncHandler(async (req, res) => {
  const submission = await findSubmissionByAssignmentAndStudent(
    req.params.id,
    req.user.id
  );

  if (!submission) {
    return failure(res, { status: 404, message: "You haven't submitted this assignment yet." });
  }

  return success(res, { message: "Submission fetched successfully.", data: submission });
});

// GET /api/assignments/:id/submissions
// Role: teacher (owner) or admin — list all students' submissions for grading.
export const listSubmissions = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (!isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, {
      status: 403,
      message: "You can only view submissions for your own assignments.",
    });
  }

  const submissions = await listSubmissionsForAssignment(assignment.id);
  return success(res, { message: "Submissions fetched successfully.", data: submissions });
});

// PUT /api/assignments/:id/submissions/:submissionId/grade
// Role: teacher (owner) or admin.
export const gradeSubmission = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (!isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, {
      status: 403,
      message: "You can only grade submissions for your own assignments.",
    });
  }

  const { marksObtained, feedback } = req.body || {};
  const parsedMarks = Number(marksObtained);

  if (!Number.isFinite(parsedMarks) || parsedMarks < 0) {
    return failure(res, { status: 400, message: "marksObtained must be a non-negative number." });
  }
  if (parsedMarks > assignment.maxMarks) {
    return failure(res, {
      status: 400,
      message: `marksObtained cannot exceed maxMarks (${assignment.maxMarks}).`,
    });
  }

  const graded = await gradeSubmissionInDb({
    id: req.params.submissionId,
    marksObtained: parsedMarks,
    feedback,
    gradedBy: req.user.id,
  });

  if (!graded) {
    return failure(res, { status: 404, message: "Submission not found." });
  }

  return success(res, { message: "Submission graded successfully.", data: graded });
});

// GET /api/assignments/:id/submissions/:submissionId/attachment
// Role: the submitting student themself, the owning teacher, or an admin.
export const downloadSubmissionAttachment = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  const submission = await findSubmissionById(req.params.submissionId);
  if (!submission || submission.assignmentId !== assignment.id) {
    return failure(res, { status: 404, message: "Submission not found." });
  }

  const isSubmissionOwner = submission.studentId === req.user.id;
  if (!isSubmissionOwner && !isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, { status: 403, message: "You cannot view this submission." });
  }

  if (!submission.attachmentUrl) {
    return failure(res, { status: 404, message: "This submission has no attachment." });
  }

  return res.download(
    resolveStoredPath(submission.attachmentUrl),
    submission.attachmentOriginalName || "attachment"
  );
});
