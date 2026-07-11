import {
  createAssignment,
  findAssignmentsByTeacher,
  findAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../models/assignmentModel.js";

export const createTeacherAssignment = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title and due date are required.",
            });
        }

        const dueDateValue = new Date(dueDate);

        if (Number.isNaN(dueDateValue.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date format.",
            });
        }

        if (dueDateValue <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Due date must be in the future.",
            });
        }

        const assignment = await createAssignment({
            title: title.trim(),
            description: description?.trim() || null,
            dueDate: dueDateValue,
            teacherId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully.",
            assignment,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create assignment.",
            error: error.message,
        });
    }
};

export const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await findAssignmentsByTeacher(req.user.id);

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments.",
      error: error.message,
    });
  }
};

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
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assignment.",
      error: error.message,
    });
  }
};

export const updateTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and due date are required.",
      });
    }

    const dueDateValue = new Date(dueDate);

    if (Number.isNaN(dueDateValue.getTime())) {
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

    const assignment = await updateAssignment({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: dueDateValue,
      teacherId: req.user.id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or you do not have permission to update it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully.",
      assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update assignment.",
      error: error.message,
    });
  }
};

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
        message: "Assignment not found or you do not have permission to delete it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete assignment.",
      error: error.message,
    });
  }
};