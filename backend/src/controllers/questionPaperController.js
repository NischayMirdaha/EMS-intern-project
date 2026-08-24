import {
  findExamByIdModel,
  findQuestionPaperModel,
  createQuestionPaperModel,
  getAllQuestionPapersModel,
  getQuestionPaperByIdModel,
  updateQuestionPaperModel,
  deleteQuestionPaperModel,
} from "../models/questionPaperModel.js";

import { uploadPDFToCloudinary } from "../services/cloudinaryService.js";

// =====================================================
// CREATE QUESTION PAPER
// =====================================================

export const createQuestionPaper = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
    } = req.body;

    // Required Validation
    if (
      !exam_id ||
      !subject_name ||
      !total_marks ||
      !duration_minutes
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    // Check if exam exists
    const exam = await findExamByIdModel(exam_id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Check duplicate subject paper
    const existingPaper = await findQuestionPaperModel(
      exam_id,
      subject_name
    );

    if (existingPaper) {
      return res.status(400).json({
        success: false,
        message: "Question paper already exists for this subject.",
      });
    }

    // Upload PDF to Cloudinary
    let file_url = null;

    if (req.file) {
      const uploadResult = await uploadPDFToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      file_url = uploadResult.secure_url;
    }

    // Create Question Paper
    const questionPaper = await createQuestionPaperModel(
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
      file_url
    );

    return res.status(201).json({
      success: true,
      message: "Question paper created successfully.",
      data: questionPaper,
    });

  } catch (error) {
    console.error("Create Question Paper Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// GET ALL QUESTION PAPERS
// =====================================================

export const getAllQuestionPapers = async (req, res) => {
  try {
    const questionPapers = await getAllQuestionPapersModel();

    return res.status(200).json({
      success: true,
      data: questionPapers,
    });

  } catch (error) {
    console.error("Get All Question Papers Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// GET SINGLE QUESTION PAPER
// =====================================================

export const getQuestionPaperById = async (req, res) => {
  try {
    const { id } = req.params;

    const questionPaper = await getQuestionPaperByIdModel(id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: questionPaper,
    });

  } catch (error) {
    console.error("Get Question Paper Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// UPDATE QUESTION PAPER
// =====================================================

export const updateQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
    } = req.body;

    // Required Validation
    if (
      !exam_id ||
      !subject_name ||
      !total_marks ||
      !duration_minutes
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    // Check if exam exists
    const exam = await findExamByIdModel(exam_id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Check duplicate subject paper
    const existingPaper = await findQuestionPaperModel(
      exam_id,
      subject_name,
      id
    );

    if (existingPaper) {
      return res.status(400).json({
        success: false,
        message: "Question paper already exists for this subject.",
      });
    }

    // Get existing question paper
    const existingQuestionPaper =
      await getQuestionPaperByIdModel(id);

    if (!existingQuestionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    // Keep old file URL if no new file is uploaded
    let file_url = existingQuestionPaper.file_url || null;

    // Upload new PDF if provided
    if (req.file) {
      const uploadResult = await uploadPDFToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      file_url = uploadResult.secure_url;
    }

    // Update Question Paper
    const questionPaper = await updateQuestionPaperModel(
      id,
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
      file_url
    );

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question paper updated successfully.",
      data: questionPaper,
    });

  } catch (error) {
    console.error("Update Question Paper Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// DELETE QUESTION PAPER
// =====================================================

export const deleteQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    const questionPaper = await deleteQuestionPaperModel(id);

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question paper deleted successfully.",
    });

  } catch (error) {
    console.error("Delete Question Paper Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// STREAM QUESTION PAPER (INLINE VIEW AS PDF)
// =====================================================

export const streamQuestionPaperFile = async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await getQuestionPaperByIdModel(id);

    if (!paper || !paper.file_url) {
      return res.status(404).send("Question paper file not found.");
    }

    const response = await fetch(paper.file_url);
    if (!response.ok) {
      return res.status(response.status).send("Failed to retrieve file from Cloudinary.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = (paper.subject_name || "Question_Paper").replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}_Question_Paper.pdf"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");

    return res.send(buffer);
  } catch (error) {
    console.error("Stream Question Paper Error:", error);
    return res.status(500).send("Error streaming question paper.");
  }
};


// =====================================================
// DOWNLOAD QUESTION PAPER (ATTACHMENT WITH .PDF EXTENSION)
// =====================================================

export const downloadQuestionPaperFile = async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await getQuestionPaperByIdModel(id);

    if (!paper || !paper.file_url) {
      return res.status(404).send("Question paper file not found.");
    }

    const response = await fetch(paper.file_url);
    if (!response.ok) {
      return res.status(response.status).send("Failed to retrieve file from Cloudinary.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = (paper.subject_name || "Question_Paper").replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Question_Paper.pdf"`);
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);
  } catch (error) {
    console.error("Download Question Paper Error:", error);
    return res.status(500).send("Error downloading question paper.");
  }
};