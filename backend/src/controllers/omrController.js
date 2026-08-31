import {
  getAllOmrTemplatesModel,
  getOmrTemplateByIdModel,
  createOmrTemplateModel,
  updateOmrTemplateModel,
  deleteOmrTemplateModel,
  saveAnswerKeyModel,
  evaluateOmrSheetModel,
  getEvaluationsByTemplateIdModel,
  deleteEvaluationModel,
  getOmrAnalyticsModel,
} from "../models/omrModel.js";

// =====================================================
// GET ALL OMR TEMPLATES
// =====================================================
export const getAllOmrTemplates = async (req, res) => {
  try {
    const templates = await getAllOmrTemplatesModel();
    return res.status(200).json({
      success: true,
      message: "OMR templates fetched successfully.",
      data: templates,
    });
  } catch (error) {
    console.error("Get All OMR Templates Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch OMR templates.",
    });
  }
};

// =====================================================
// GET SINGLE OMR TEMPLATE
// =====================================================
export const getOmrTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await getOmrTemplateByIdModel(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "OMR template not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get OMR Template By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch OMR template.",
    });
  }
};

// =====================================================
// CREATE OMR TEMPLATE
// =====================================================
export const createOmrTemplate = async (req, res) => {
  try {
    const {
      exam_id,
      title,
      subject_name,
      total_questions,
      marks_per_question,
      negative_marking,
      answer_key_json,
    } = req.body;

    if (!title || !subject_name) {
      return res.status(400).json({
        success: false,
        message: "Template title and subject name are required.",
      });
    }

    const created = await createOmrTemplateModel({
      exam_id: exam_id ? Number(exam_id) : null,
      title: title.trim(),
      subject_name: subject_name.trim(),
      total_questions: total_questions ? Number(total_questions) : 50,
      marks_per_question: marks_per_question !== undefined ? Number(marks_per_question) : 1,
      negative_marking: negative_marking !== undefined ? Number(negative_marking) : 0,
      answer_key_json: answer_key_json || {},
    });

    return res.status(201).json({
      success: true,
      message: "OMR template created successfully.",
      data: created,
    });
  } catch (error) {
    console.error("Create OMR Template Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create OMR template.",
    });
  }
};

// =====================================================
// UPDATE OMR TEMPLATE
// =====================================================
export const updateOmrTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exam_id,
      title,
      subject_name,
      total_questions,
      marks_per_question,
      negative_marking,
      answer_key_json,
    } = req.body;

    const existing = await getOmrTemplateByIdModel(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "OMR template not found.",
      });
    }

    const updated = await updateOmrTemplateModel(id, {
      exam_id: exam_id !== undefined ? (exam_id ? Number(exam_id) : null) : undefined,
      title: title ? title.trim() : undefined,
      subject_name: subject_name ? subject_name.trim() : undefined,
      total_questions: total_questions !== undefined ? Number(total_questions) : undefined,
      marks_per_question: marks_per_question !== undefined ? Number(marks_per_question) : undefined,
      negative_marking: negative_marking !== undefined ? Number(negative_marking) : undefined,
      answer_key_json,
    });

    return res.status(200).json({
      success: true,
      message: "OMR template updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update OMR Template Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update OMR template.",
    });
  }
};

// =====================================================
// DELETE OMR TEMPLATE
// =====================================================
export const deleteOmrTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteOmrTemplateModel(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "OMR template not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OMR template deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete OMR Template Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete OMR template.",
    });
  }
};

// =====================================================
// SAVE MASTER ANSWER KEY
// =====================================================
export const saveAnswerKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer_key } = req.body;

    if (!answer_key || typeof answer_key !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid answer key object is required.",
      });
    }

    const updated = await saveAnswerKeyModel(id, answer_key);

    return res.status(200).json({
      success: true,
      message: "Master answer key saved successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Save Answer Key Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save answer key.",
    });
  }
};

// =====================================================
// EVALUATE OMR SHEET
// =====================================================
export const evaluateOmrSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      student_name,
      roll_number,
      class_id,
      section_id,
      scanned_answers,
    } = req.body;

    if (!student_name) {
      return res.status(400).json({
        success: false,
        message: "Student name is required for OMR evaluation.",
      });
    }

    const evaluationResult = await evaluateOmrSheetModel({
      omr_template_id: id,
      student_name: student_name.trim(),
      roll_number: roll_number ? roll_number.trim() : "",
      class_id: class_id || null,
      section_id: section_id || null,
      scanned_answers_json: scanned_answers || {},
    });

    return res.status(201).json({
      success: true,
      message: "OMR sheet evaluated and scored successfully!",
      data: evaluationResult,
    });
  } catch (error) {
    console.error("Evaluate OMR Sheet Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to evaluate OMR sheet.",
    });
  }
};

// =====================================================
// GET TEMPLATE EVALUATIONS
// =====================================================
export const getTemplateEvaluations = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluations = await getEvaluationsByTemplateIdModel(id);

    return res.status(200).json({
      success: true,
      message: "Evaluations fetched successfully.",
      data: evaluations,
    });
  } catch (error) {
    console.error("Get Template Evaluations Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch evaluations.",
    });
  }
};

// =====================================================
// DELETE EVALUATION
// =====================================================
export const deleteEvaluation = async (req, res) => {
  try {
    const { evalId } = req.params;
    const deleted = await deleteEvaluationModel(evalId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Evaluation record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Evaluation deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete Evaluation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete evaluation.",
    });
  }
};

// =====================================================
// GET OMR STATISTICAL ANALYTICS & DISTRACTOR REPORT
// =====================================================
export const getOmrAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await getOmrAnalyticsModel(id);

    return res.status(200).json({
      success: true,
      message: "OMR analytics compiled successfully.",
      data: analytics,
    });
  } catch (error) {
    console.error("Get OMR Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to compile OMR analytics.",
    });
  }
};
