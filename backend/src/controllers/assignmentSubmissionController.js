import {
  createSubmission,
  findSubmissionsByStudent,
  findSubmissionsByAssignment,
  findSubmissionById,
  updateSubmission,
  gradeSubmission,
} from "../models/assignmentSubmissionModel.js";

import { findAssignmentById } from "../models/assignmentModel.js";

// Student submits an assignment
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionText } = req.body;

    // Validate assignment ID
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required.",
      });
    }

    const assignment = await findAssignmentById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    // Only published assignments can be submitted
    if (assignment.status !== "Published") {
      return res.status(400).json({
        success: false,
        message: "This assignment is not open for submissions.",
      });
    }

    // Check due date
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (now > dueDate) {
      return res.status(400).json({
        success: false,
        message: "Submission deadline has passed.",
      });
    }

    // Create submission
    const submission = await createSubmission({
      assignmentId,
      studentId: req.user.id,
      submissionText: submissionText?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully.",
      submission,
    });

  } catch (error) {
    console.error("Submit Assignment Error:", error);

    // Prevent duplicate submissions
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this assignment.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Student views own submissions
export const getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await findSubmissionsByStudent(req.user.id);

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get Student Submissions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Teacher views submissions for one assignment
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await findAssignmentById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    // Only the teacher who owns the assignment
    if (assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const submissions = await findSubmissionsByAssignment(assignmentId);

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get Assignment Submissions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Student updates own submission
export const editSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionText } = req.body;

    const submission = await findSubmissionById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    const assignment = await findAssignmentById(submission.assignment_id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found.",
      });
    }

    // Check if the deadline has passed
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (now > dueDate) {
      return res.status(400).json({
        success: false,
        message: "Submission can no longer be edited after the deadline.",
      });
    }

    // Update the submission (model checks ownership using studentId)
    const updatedSubmission = await updateSubmission({
      id,
      studentId: req.user.id,
      submissionText: submissionText?.trim() || null,
    });

    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found or you do not have permission to edit it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission updated successfully.",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Update Submission Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Teacher grades submission
export const markSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const marks = Number(grade);

    if (!Number.isFinite(marks) || marks < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid grade.",
      });
    }

    const submission = await findSubmissionById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    if (submission.status === "Graded") {
      return res.status(400).json({
        success: false,
        message: "This submission has already been graded.",
      });
    }

    const assignment = await findAssignmentById(submission.assignment_id);

    if (grade > assignment.max_marks) {
      return res.status(400).json({
        success: false,
        message: `Grade cannot exceed maximum marks (${assignment.max_marks}).`,
      });
    }

    if (assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const gradedSubmission = await gradeSubmission({
      id,
      grade: marks,
      feedback: feedback?.trim() || null,
    });

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully.",
      submission: gradedSubmission,
    });
  } catch (error) {
    console.error("Grade Submission Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};