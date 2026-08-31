import {
  getAllResultsModel,
  getResultByIdModel,
  getResultsByExamIdModel,
  saveOrUpdateResultModel,
  batchProcessExamResultsModel,
  aggregateFromOnlineExamsAndOMRModel,
  recalculateRanksForExamModel,
  deleteResultModel,
  deleteResultsByExamModel,
} from "../models/resultModel.js";

// Get All Results with optional filters
export const getAllResults = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, search } = req.query;
    const results = await getAllResultsModel({
      exam_id: exam_id ? Number(exam_id) : undefined,
      class_id: class_id ? Number(class_id) : undefined,
      section_id: section_id ? Number(section_id) : undefined,
      search,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error in getAllResults:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch results.",
    });
  }
};

// Get Single Result By ID
export const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getResultByIdModel(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getResultById:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch result detail.",
    });
  }
};

// Get Full Class Results By Exam ID (With Class Stats & Ranks)
export const getResultsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const data = await getResultsByExamIdModel(examId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getResultsByExam:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch exam results.",
    });
  }
};

// Save or Update Individual Student Result
export const saveResult = async (req, res) => {
  try {
    const {
      id,
      exam_id,
      student_name,
      roll_number,
      class_id,
      section_id,
      subjects_marks_json,
      remarks,
    } = req.body;

    if (!exam_id || !student_name) {
      return res.status(400).json({
        success: false,
        message: "Exam ID and Student Name are required.",
      });
    }

    const saved = await saveOrUpdateResultModel({
      id,
      exam_id,
      student_name,
      roll_number,
      class_id,
      section_id,
      subjects_marks_json: subjects_marks_json || [],
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Student result processed and saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("Error in saveResult:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process result.",
    });
  }
};

// Batch Process Exam Results
export const batchProcessResults = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, students } = req.body;

    if (!exam_id || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: "Exam ID and array of students are required.",
      });
    }

    const resultData = await batchProcessExamResultsModel(
      exam_id,
      class_id,
      section_id,
      students
    );

    return res.status(200).json({
      success: true,
      message: `Batch result processing completed for ${students.length} students.`,
      data: resultData,
    });
  } catch (error) {
    console.error("Error in batchProcessResults:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to batch process results.",
    });
  }
};

// Auto-Aggregate From Online Exams & OMR
export const aggregateExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID parameter is required.",
      });
    }

    const aggregationResult = await aggregateFromOnlineExamsAndOMRModel(examId);

    return res.status(200).json({
      success: true,
      message: aggregationResult.message,
      data: aggregationResult,
    });
  } catch (error) {
    console.error("Error in aggregateExamResults:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to auto-aggregate exam results.",
    });
  }
};

// Manually Recalculate Ranks for an Exam
export const recalculateExamRanks = async (req, res) => {
  try {
    const { examId } = req.params;

    await recalculateRanksForExamModel(examId);
    const updated = await getResultsByExamIdModel(examId);

    return res.status(200).json({
      success: true,
      message: "Class ranks recalculation completed successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error in recalculateExamRanks:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to recalculate ranks.",
    });
  }
};

// Delete Single Result
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteResultModel(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Result record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result record deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteResult:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete result record.",
    });
  }
};

// Clear All Results for an Exam
export const clearExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const deleted = await deleteResultsByExamModel(examId);

    return res.status(200).json({
      success: true,
      message: `Cleared ${deleted.length} results for the specified exam.`,
      count: deleted.length,
    });
  } catch (error) {
    console.error("Error in clearExamResults:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear exam results.",
    });
  }
};
