import {
  createAssignment as createAssignmentInDb,
  findAssignmentById,
  listAssignments as listAssignmentsFromDb,
  updateAssignment as updateAssignmentInDb,
  findAssignmentsByTeacher
} from "../models/assignmentModel.js";
// Removed findStudentProfileByUserId because we use req.user directly
import { ROLES } from "../constants/roles.js";
import {
  ASSIGNMENT_STATUS,
  VALID_ASSIGNMENT_STATUSES,
} from "../constants/assignmentStatus.js";
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

// POST /api/assignments
// Roles: teacher, school_admin, super_admin
export const createAssignment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    className,
    section,
    subject,
    dueDate,
    maxMarks,
    status,
  } = req.body || {};

  if (!title?.trim() || !className?.trim() || !subject?.trim() || !dueDate) {
    return failure(res, {
      status: 400,
      message: "title, className, subject and dueDate are required.",
    });
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    return failure(res, { status: 400, message: "dueDate is not a valid date." });
  }
  if (parsedDueDate.getTime() < Date.now()) {
    return failure(res, { status: 400, message: "dueDate must be in the future." });
  }

  const resolvedStatus = status || ASSIGNMENT_STATUS.PUBLISHED;
  if (!VALID_ASSIGNMENT_STATUSES.includes(resolvedStatus)) {
    return failure(res, { status: 400, message: "Invalid status." });
  }

  const parsedMaxMarks = maxMarks !== undefined ? Number(maxMarks) : 100;
  if (!Number.isFinite(parsedMaxMarks) || parsedMaxMarks <= 0) {
    return failure(res, { status: 400, message: "maxMarks must be a positive number." });
  }

  // req.file comes from uploadAssignmentAttachment (multer), applied in
  // the route before this handler runs. Attachment is optional.
  const attachmentUrl = req.file
    ? toStoredPath(UPLOAD_SUBDIR.ASSIGNMENTS, req.file.filename)
    : undefined;
  const attachmentOriginalName = req.file?.originalname;

  // A school_admin/super_admin could theoretically create an assignment on
  // a teacher's behalf, but for now the creator is always the assignment
  // owner. Revisit if that workflow is ever needed.
  const assignment = await createAssignmentInDb({
    title: title.trim(),
    description: description?.trim(),
    className: className.trim(),
    section: section?.trim(),
    subject: subject.trim(),
    teacherId: req.user.id,
    dueDate: parsedDueDate,
    maxMarks: parsedMaxMarks,
    attachmentUrl,
    attachmentOriginalName,
    status: resolvedStatus,
  });

  return success(res, {
    status: 201,
    message: "Assignment created successfully.",
    data: assignment,
  });
});

// GET /api/assignments
// Role-aware filtering:
//   - student  -> only PUBLISHED/CLOSED assignments for their own class+section
//   - teacher  -> only their own assignments (any status), unless filtered further
//   - admin    -> everything, with optional query filters
export const getAssignments = asyncHandler(async (req, res) => {
  const { subject, status, className, section, teacherId } = req.query;

  if (req.user.role === ROLES.STUDENT) {
    if (!req.user.className) {
      return failure(res, {
        status: 400,
        message:
          "Your account has no class assigned yet. Ask your school admin to set it before you can view assignments.",
      });
    }

    const assignments = await listAssignmentsFromDb({
      className: req.user.className,
      section: req.user.section || undefined,
      subject,
      // Students never see drafts.
      status: status && status !== ASSIGNMENT_STATUS.DRAFT ? status : undefined,
    });

    const visible = assignments.filter((a) => a.status !== ASSIGNMENT_STATUS.DRAFT);
    return success(res, { message: "Assignments fetched successfully.", data: visible });
  }

  if (req.user.role === ROLES.TEACHER) {
    const assignments = await listAssignmentsFromDb({
      teacherId: req.user.id,
      className,
      section,
      subject,
      status,
    });
    return success(res, { message: "Assignments fetched successfully.", data: assignments });
  }

  // school_admin / super_admin
  const assignments = await listAssignmentsFromDb({
    teacherId: teacherId ? Number(teacherId) : undefined,
    className,
    section,
    subject,
    status,
  });
  return success(res, { message: "Assignments fetched successfully.", data: assignments });
});

// GET /api/assignments/:id
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (req.user.role === ROLES.STUDENT) {
    const belongsToStudentClass =
      req.user.className &&
      assignment.className === req.user.className &&
      (!assignment.section || assignment.section === req.user.section);

    if (assignment.status === ASSIGNMENT_STATUS.DRAFT || !belongsToStudentClass) {
      return failure(res, { status: 404, message: "Assignment not found." });
    }
  } else if (req.user.role === ROLES.TEACHER && !isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, { status: 403, message: "You can only view your own assignments." });
  }

  return success(res, { message: "Assignment fetched successfully.", data: assignment });
});

// PUT /api/assignments/:id
// Only the owning teacher or an admin can update.
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (!isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, { status: 403, message: "You can only edit your own assignments." });
  }

  const {
    title,
    description,
    className,
    section,
    subject,
    dueDate,
    maxMarks,
    status,
  } = req.body || {};

  if (status !== undefined && !VALID_ASSIGNMENT_STATUSES.includes(status)) {
    return failure(res, { status: 400, message: "Invalid status." });
  }

  let parsedDueDate;
  if (dueDate !== undefined) {
    parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return failure(res, { status: 400, message: "dueDate is not a valid date." });
    }
  }

  // Replacing the attachment: delete the old file only after the DB update
  // succeeds, so a crash mid-request can't leave the DB pointing at a file
  // that no longer exists.
  const attachmentUrl = req.file
    ? toStoredPath(UPLOAD_SUBDIR.ASSIGNMENTS, req.file.filename)
    : undefined;
  const attachmentOriginalName = req.file?.originalname;

  const updated = await updateAssignmentInDb(req.params.id, {
    title: title?.trim(),
    description: description?.trim(),
    className: className?.trim(),
    section: section?.trim(),
    subject: subject?.trim(),
    dueDate: parsedDueDate,
    maxMarks: maxMarks !== undefined ? Number(maxMarks) : undefined,
    attachmentUrl,
    attachmentOriginalName,
    status,
  });

  if (req.file && assignment.attachmentUrl) {
    deleteStoredFile(assignment.attachmentUrl);
  }

  return success(res, { message: "Assignment updated successfully.", data: updated });
});

// DELETE /api/assignments/:id (soft delete)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (!isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, { status: 403, message: "You can only delete your own assignments." });
  }

  // Soft delete keeps the row for record-keeping, so the file stays too —
  // it's not actually gone, just hidden from normal queries.
  await softDeleteAssignment(req.params.id);
  return success(res, { message: "Assignment deleted successfully." });
});

// GET /api/assignments/:id/attachment
// Same visibility rules as getAssignmentById: owning teacher, admin, or a
// student in the assignment's target class.
export const downloadAssignmentAttachment = asyncHandler(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return failure(res, { status: 404, message: "Assignment not found." });
  }

  if (req.user.role === ROLES.STUDENT) {
    const belongsToStudentClass =
      req.user.className &&
      assignment.className === req.user.className &&
      (!assignment.section || assignment.section === req.user.section);

    if (assignment.status === ASSIGNMENT_STATUS.DRAFT || !belongsToStudentClass) {
      return failure(res, { status: 404, message: "Assignment not found." });
    }
  } else if (req.user.role === ROLES.TEACHER && !isOwnerOrAdmin(assignment, req.user)) {
    return failure(res, { status: 403, message: "You can only view your own assignments." });
  }

  if (!assignment.attachmentUrl) {
    return failure(res, { status: 404, message: "This assignment has no attachment." });
  }

  return res.download(
    resolveStoredPath(assignment.attachmentUrl),
    assignment.attachmentOriginalName || "attachment"
  );
});

  

const ALLOWED_STATUSES = [
  "Draft",
  "Published",
  "Closed",
  "Archived",
];

// Create Assignment
export const createTeacherAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      dueDate,
      maxMarks,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required.",
      });
    }

    const dueDateValue = new Date(dueDate);

    if (isNaN(dueDateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date.",
      });
    }

    if (dueDateValue <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be in the future.",
      });
    }
    
    const marks = Number(maxMarks);

    if (!Number.isInteger(marks) || marks <= 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum marks must be a positive integer.",
      });
    }

    const assignmentStatus = status || "Draft";

    if (!ALLOWED_STATUSES.includes(assignmentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment status.",
      });
    }

    const assignment = await createAssignment({
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions?.trim() || null,
      dueDate: dueDateValue,
      maxMarks: marks,
      status: assignmentStatus,
      teacherId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully.",
      assignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get All Assignments
export const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await findAssignmentsByTeacher(req.user.id);

    return res.status(200).json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Get Assignments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get Single Assignment
export const getAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await findAssignmentById(id);

    if (!assignment || assignment.teacher_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Get Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Update Assignment
export const updateTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      instructions,
      dueDate,
      maxMarks,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required.",
      });
    }

    const dueDateValue = new Date(dueDate);

    if (isNaN(dueDateValue.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date.",
      });
    }

    if (dueDateValue <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Due date must be in the future.",
      });
    }

    const marks = Number(maxMarks);
    if (
      maxMarks === undefined ||
      !Number.isInteger(marks) ||
      marks <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum marks must be a positive integer.",
      });
    }

    const assignmentStatus = status || "Draft";

    if (!ALLOWED_STATUSES.includes(assignmentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment status.",
      });
    }

    const assignment = await updateAssignment({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions?.trim() || null,
      dueDate: dueDateValue,
      maxMarks: marks,
      status: assignmentStatus,
      teacherId: req.user.id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully.",
      assignment,
    });
  } catch (error) {
    console.error("Update Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Delete Assignment
export const deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await deleteAssignment({
      id,
      teacherId: req.user.id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Assignment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

