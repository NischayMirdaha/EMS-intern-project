import pool from "../config/database.js";

// Create Question Paper
export const createQuestionPaper = async (req, res) => {
  try {
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
    const exam = await pool.query(
      "SELECT * FROM exams WHERE id = $1",
      [exam_id]
    );

    if (exam.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Check duplicate subject paper for same exam
    const existingPaper = await pool.query(
      `
      SELECT * FROM question_papers
      WHERE exam_id = $1
      AND LOWER(subject_name) = LOWER($2)
      `,
      [exam_id, subject_name]
    );

    if (existingPaper.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Question paper already exists for this subject.",
      });
    }

    // Create Question Paper
    const result = await pool.query(
      `
      INSERT INTO question_papers
      (
        exam_id,
        subject_name,
        total_marks,
        duration_minutes,
        instructions
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        exam_id,
        subject_name,
        total_marks,
        duration_minutes,
        instructions,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Question paper created successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get All Question Papers
export const getAllQuestionPapers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        question_papers.id,
        question_papers.exam_id,
        exams.exam_name,
        question_papers.subject_name,
        question_papers.total_marks,
        question_papers.duration_minutes,
        question_papers.instructions,
        question_papers.created_at
      FROM question_papers
      JOIN exams
        ON question_papers.exam_id = exams.id
      ORDER BY question_papers.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get Single Question Paper
export const getQuestionPaperById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        question_papers.id,
        question_papers.exam_id,
        exams.exam_name,
        question_papers.subject_name,
        question_papers.total_marks,
        question_papers.duration_minutes,
        question_papers.instructions,
        question_papers.created_at
      FROM question_papers
      JOIN exams
        ON question_papers.exam_id = exams.id
      WHERE question_papers.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Update Question Paper
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
    const exam = await pool.query(
      "SELECT * FROM exams WHERE id = $1",
      [exam_id]
    );

    if (exam.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Check duplicate subject paper
    const existingPaper = await pool.query(
      `
      SELECT * FROM question_papers
      WHERE exam_id = $1
      AND LOWER(subject_name) = LOWER($2)
      AND id != $3
      `,
      [exam_id, subject_name, id]
    );

    if (existingPaper.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Question paper already exists for this subject.",
      });
    }

    // Update Question Paper
    const result = await pool.query(
      `
      UPDATE question_papers
      SET
        exam_id = $1,
        subject_name = $2,
        total_marks = $3,
        duration_minutes = $4,
        instructions = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        exam_id,
        subject_name,
        total_marks,
        duration_minutes,
        instructions,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question paper not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question paper updated successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Delete Question Paper
export const deleteQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM question_papers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};