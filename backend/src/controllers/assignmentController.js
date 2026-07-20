import {
  createAssignment,
  findAssignmentsByTeacher,
  findAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../models/assignmentModel.js";

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