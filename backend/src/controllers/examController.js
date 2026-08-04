import pool from "../config/database.js";

// Create Exam
export const createExam = async (req, res) => {
  try {
    const {
      class_id,
      exam_name,
      exam_type,
      start_date,
      end_date,
      status,
    } = req.body;

    // Required Validation
    if (
      !class_id ||
      !exam_name ||
      !exam_type ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    // Date Validation
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date.",
      });
    }

    // Status Validation
    const validStatus = ["Upcoming", "Ongoing", "Completed"];

    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status.",
      });
    }

    // Duplicate Check
    const existingExam = await pool.query(
      `SELECT * FROM exams
       WHERE class_id = $1
       AND LOWER(exam_name) = LOWER($2)`,
      [class_id, exam_name]
    );

    if (existingExam.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Exam already exists for this class.",
      });
    }
        // Exam Date Overlap Validation
    const overlappingExam = await pool.query(
    `
    SELECT * FROM exams
    WHERE class_id = $1
    AND (
        start_date <= $3
        AND end_date >= $2
    )
    `,
    [class_id, start_date, end_date]
    );

    if (overlappingExam.rows.length > 0) {
    return res.status(400).json({
        success: false,
        message: "Exam dates overlap with another exam for this class.",
    });
    }

    // Insert Exam
    const result = await pool.query(
      `INSERT INTO exams
      (class_id, exam_name, exam_type, start_date, end_date, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        class_id,
        exam_name,
        exam_type,
        start_date,
        end_date,
        status || "Upcoming",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Exams
export const getAllExams = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        exams.id,
        classes.class_name,
        exams.exam_name,
        exams.exam_type,
        exams.start_date,
        exams.end_date,
        exams.status,
        exams.created_at
      FROM exams
      JOIN classes
      ON exams.class_id = classes.id
      ORDER BY exams.id ASC
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

// Get Single Exam
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        exams.*,
        classes.class_name
      FROM exams
      JOIN classes
      ON exams.class_id = classes.id
      WHERE exams.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
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

// Update Exam
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      class_id,
      exam_name,
      exam_type,
      start_date,
      end_date,
      status,
    } = req.body;

    // Required Validation
    if (
      !class_id ||
      !exam_name ||
      !exam_type ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    // Date Validation
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date.",
      });
    }

    // Status Validation
    const validStatus = ["Upcoming", "Ongoing", "Completed"];

    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status.",
      });
    }

    // Overlap Validation
    const overlappingExam = await pool.query(
      `
      SELECT * FROM exams
      WHERE class_id = $1
      AND id != $4
      AND (
        start_date <= $3
        AND end_date >= $2
      )
      `,
      [class_id, start_date, end_date, id]
    );

    if (overlappingExam.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Exam dates overlap with another exam for this class.",
      });
    }

    // Update Exam
    const result = await pool.query(
      `
      UPDATE exams
      SET
        class_id = $1,
        exam_name = $2,
        exam_type = $3,
        start_date = $4,
        end_date = $5,
        status = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        class_id,
        exam_name,
        exam_type,
        start_date,
        end_date,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Delete Exam
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM exams WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};