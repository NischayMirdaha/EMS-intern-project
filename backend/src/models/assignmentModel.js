import pool from "../config/database.js";

export const createAssignment = async ({title, description, instructions, dueDate, maxMarks, status, teacherId}) => {
  const result = await pool.query(
    `
      INSERT INTO assignments (
        title,
        description,
        instructions,
        due_date,
        max_marks,
        status,
        teacher_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [title, description, instructions, dueDate, maxMarks, status, teacherId]
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

export const updateAssignment = async ({id, title, description, instructions, dueDate, maxMarks, status, teacherId}) => {
  const result = await pool.query(
    `
      UPDATE assignments
      SET title = $1,
          description = $2,
          instructions = $3,
          due_date = $4,
          max_marks = $5,
          status = $6,
          updated_at = NOW()
      WHERE id = $7
        AND teacher_id = $8
      RETURNING *
    `,
    [title, description, instructions, dueDate, maxMarks, status, id, teacherId]
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