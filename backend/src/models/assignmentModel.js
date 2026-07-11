import pool from "../config/database.js";

export const createAssignment = async ({title, description, dueDate, teacherId}) => {
  const result = await pool.query(
    `
      INSERT INTO assignments (
        title,
        description,
        due_date,
        teacher_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [title, description, dueDate, teacherId]
  );

  return result.rows[0];
};

export const findAssignmentsByTeacher = async (teacherId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM assignments
      WHERE teacher_id = $1
      ORDER BY created_at DESC
    `,
    [teacherId]
  );

  return result.rows;
};

export const findAssignmentById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM assignments
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

export const updateAssignment = async ({id, title, description, dueDate, teacherId,}) => {
  const result = await pool.query(
    `
      UPDATE assignments
      SET title = $1,
          description = $2,
          due_date = $3,
          updated_at = NOW()
      WHERE id = $4
        AND teacher_id = $5
      RETURNING *
    `,
    [title, description, dueDate, id, teacherId]
  );

  return result.rows[0];
};

export const deleteAssignment = async ({id, teacherId}) => {
  const result = await pool.query(
    `
      DELETE FROM assignments
      WHERE id = $1
        AND teacher_id = $2
      RETURNING *
    `,
    [id, teacherId]
  );

  return result.rows[0];
};