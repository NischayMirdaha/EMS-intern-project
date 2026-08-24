import pool from "../config/database.js";

// Create Classes Table
export const ensureClassesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      class_name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

// Create Class
export const createClassModel = async (class_name, description) => {
  const result = await pool.query(
    `
    INSERT INTO classes (class_name, description)
    VALUES ($1, $2)
    RETURNING *
    `,
    [class_name, description]
  );

  return result.rows[0];
};

// Get All Classes
export const getAllClassesModel = async () => {
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
    GROUP BY classes.id
    ORDER BY classes.id ASC
    `
  );

  return result.rows;
};

// Get Class By ID
export const getClassByIdModel = async (id) => {
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

  return result.rows[0];
};

// Check Duplicate Class
export const findClassByNameModel = async (class_name) => {
  const result = await pool.query(
    `
    SELECT *
    FROM classes
    WHERE LOWER(class_name) = LOWER($1)
    `,
    [class_name]
  );

  return result.rows[0];
};

// Update Class
export const updateClassModel = async (
  id,
  class_name,
  description
) => {
  const result = await pool.query(
    `
    UPDATE classes
    SET
      class_name = $1,
      description = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [class_name, description, id]
  );

  return result.rows[0];
};

// Delete Class
export const deleteClassModel = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM classes
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};