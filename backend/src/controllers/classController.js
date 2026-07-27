import pool from "../config/database.js";

// Create Class
export const createClass = async (req, res) => {
  try {
    const { class_name, description } = req.body;

    // Validate input
    if (!class_name) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }

    // Check if class already exists
    const existingClass = await pool.query(
      "SELECT * FROM classes WHERE LOWER(class_name) = LOWER($1)",
      [class_name]
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
      [class_name, description]
    );

    return res.status(201).json({
      success: true,
      message: "Class created successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Classes
export const getAllClasses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM classes ORDER BY id ASC"
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Class
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM classes WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
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

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, description } = req.body;

    const result = await pool.query(
      `UPDATE classes
       SET class_name=$1,
           description=$2
       WHERE id=$3
       RETURNING *`,
      [class_name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
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

    const result = await pool.query(
      "DELETE FROM classes WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};