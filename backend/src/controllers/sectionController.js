import pool from "../config/database.js";

// ==============================
// Create Section
// ==============================
export const createSection = async (req, res) => {
  try {
    const { class_id, section_name, class_teacher, capacity } = req.body;
    const trimmedSectionName = String(section_name || "").trim();

    // Validation
    if (!class_id || !trimmedSectionName) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Section Name are required.",
      });
    }

    if (isNaN(parseInt(class_id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID format.",
      });
    }

    // Verify parent class exists
    const classExists = await pool.query(
      "SELECT id, class_name FROM classes WHERE id = $1",
      [class_id]
    );

    if (classExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target class not found.",
      });
    }

    // Check duplicate section in same class
    const existingSection = await pool.query(
      `SELECT * FROM sections
       WHERE class_id = $1
       AND LOWER(TRIM(section_name)) = LOWER($2)`,
      [class_id, trimmedSectionName]
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
      [
        class_id,
        trimmedSectionName,
        class_teacher ? String(class_teacher).trim() : null,
        capacity ? parseInt(capacity, 10) : 40,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Section created successfully.",
      data: {
        ...result.rows[0],
        class_name: classExists.rows[0].class_name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Get All Sections (Optional ?class_id=X)
// ==============================
export const getAllSections = async (req, res) => {
  try {
    const { class_id } = req.query;

    let query = `
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
    `;
    const values = [];

    if (class_id) {
      if (isNaN(parseInt(class_id, 10))) {
        return res.status(400).json({
          success: false,
          message: "Invalid class ID filter.",
        });
      }
      query += ` WHERE sections.class_id = $1`;
      values.push(class_id);
    }

    query += ` ORDER BY sections.id ASC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      total_sections: result.rows.length,
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

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

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
    const trimmedSectionName = String(section_name || "").trim();

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

    if (!class_id || !trimmedSectionName) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Section Name are required.",
      });
    }

    // Verify parent class exists
    const classExists = await pool.query(
      "SELECT id, class_name FROM classes WHERE id = $1",
      [class_id]
    );

    if (classExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Target class not found.",
      });
    }

    // Check duplicate section name in the same class (excluding current section)
    const duplicate = await pool.query(
      `SELECT id FROM sections
       WHERE class_id = $1
       AND LOWER(TRIM(section_name)) = LOWER($2)
       AND id != $3`,
      [class_id, trimmedSectionName, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Another section with this name already exists in this class.",
      });
    }

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
      [
        class_id,
        trimmedSectionName,
        class_teacher ? String(class_teacher).trim() : null,
        capacity ? parseInt(capacity, 10) : 40,
        id,
      ]
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
      data: {
        ...result.rows[0],
        class_name: classExists.rows[0].class_name,
      },
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

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

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