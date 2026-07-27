import pool from "../config/database.js";

// ==============================
// Create Section
// ==============================
export const createSection = async (req, res) => {
  try {
    const { class_id, section_name, class_teacher, capacity } = req.body;

    // Validation
    if (!class_id || !section_name) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Section Name are required.",
      });
    }

    // Check duplicate section in same class
    const existingSection = await pool.query(
      `SELECT * FROM sections
       WHERE class_id = $1
       AND LOWER(section_name) = LOWER($2)`,
      [class_id, section_name]
    );

    if (existingSection.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Section already exists for this class.",
      });
    }

    // Insert section
    const result = await pool.query(
      `INSERT INTO sections
      (class_id, section_name, class_teacher, capacity)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [class_id, section_name, class_teacher, capacity]
    );

    return res.status(201).json({
      success: true,
      message: "Section created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Get All Sections
// ==============================
export const getAllSections = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sections.id,
        sections.class_id,
        classes.class_name,
        sections.section_name,
        sections.class_teacher,
        sections.capacity,
        sections.created_at
      FROM sections
      JOIN classes
      ON sections.class_id = classes.id
      ORDER BY sections.id ASC
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

// ==============================
// Get Single Section
// ==============================
export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        sections.*,
        classes.class_name
      FROM sections
      JOIN classes
      ON sections.class_id = classes.id
      WHERE sections.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
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

// ==============================
// Update Section
// ==============================
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, section_name, class_teacher, capacity } = req.body;

    const result = await pool.query(
      `
      UPDATE sections
      SET
        class_id = $1,
        section_name = $2,
        class_teacher = $3,
        capacity = $4
      WHERE id = $5
      RETURNING *
      `,
      [class_id, section_name, class_teacher, capacity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Delete Section
// ==============================
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM sections WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};