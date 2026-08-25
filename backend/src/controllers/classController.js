import pool from "../config/database.js";

// Create Class
export const createClass = async (req, res) => {
  try {
    const { class_name, description } = req.body;
    const trimmedName = String(class_name || "").trim();

    // Validate input
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }

    // Check if class already exists
    const existingClass = await pool.query(
      "SELECT * FROM classes WHERE LOWER(TRIM(class_name)) = LOWER($1)",
      [trimmedName]
    );

    if (existingClass.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Class already exists.",
      });
    }

    // Insert new class
    const result = await pool.query(
      `INSERT INTO classes (class_name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [trimmedName, description || null]
    );

    return res.status(201).json({
      success: true,
      message: "Class created successfully.",
      data: {
        ...result.rows[0],
        section_count: 0,
        total_capacity: 0,
        sections: [],
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Classes with Section Counts and Details
export const getAllClasses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        classes.id,
        classes.class_name,
        classes.description,
        classes.created_at,
        COUNT(sections.id)::int AS section_count,
        COALESCE(SUM(sections.capacity), 0)::int AS total_capacity,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sections.id,
              'class_id', sections.class_id,
              'section_name', sections.section_name,
              'capacity', sections.capacity,
              'class_teacher', sections.class_teacher,
              'created_at', sections.created_at
            ) ORDER BY sections.section_name ASC
          ) FILTER (WHERE sections.id IS NOT NULL),
          '[]'
        ) AS sections
      FROM classes
      LEFT JOIN sections ON classes.id = sections.class_id
      GROUP BY classes.id
      ORDER BY classes.id ASC
    `);

    res.status(200).json({
      success: true,
      total_classes: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Class with Sections
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        classes.id,
        classes.class_name,
        classes.description,
        classes.created_at,
        COUNT(sections.id)::int AS section_count,
        COALESCE(SUM(sections.capacity), 0)::int AS total_capacity,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sections.id,
              'class_id', sections.class_id,
              'section_name', sections.section_name,
              'capacity', sections.capacity,
              'class_teacher', sections.class_teacher,
              'created_at', sections.created_at
            ) ORDER BY sections.section_name ASC
          ) FILTER (WHERE sections.id IS NOT NULL),
          '[]'
        ) AS sections
      FROM classes
      LEFT JOIN sections ON classes.id = sections.class_id
      WHERE classes.id = $1
      GROUP BY classes.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Sections for a Specific Class
export const getClassSections = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    // Check if class exists
    const classCheck = await pool.query("SELECT * FROM classes WHERE id = $1", [id]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        sections.id,
        sections.class_id,
        classes.class_name,
        sections.section_name,
        sections.class_teacher,
        sections.capacity,
        sections.created_at
      FROM sections
      JOIN classes ON sections.class_id = classes.id
      WHERE sections.class_id = $1
      ORDER BY sections.section_name ASC
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      class: classCheck.rows[0],
      section_count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, description } = req.body;
    const trimmedName = String(class_name || "").trim();

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }

    // Check duplicate name for another class
    const duplicate = await pool.query(
      "SELECT id FROM classes WHERE LOWER(TRIM(class_name)) = LOWER($1) AND id != $2",
      [trimmedName, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Another class with this name already exists.",
      });
    }

    const result = await pool.query(
      `UPDATE classes
       SET class_name=$1,
           description=$2
       WHERE id=$3
       RETURNING *`,
      [trimmedName, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    const result = await pool.query(
      "DELETE FROM classes WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class and its associated sections/exams deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};