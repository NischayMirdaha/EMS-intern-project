import pool from "../config/database.js";

// Create Submission
export const createSubmission = async ({
  assignmentId,
  studentId,
  submissionText,
}) => {
  const result = await pool.query(
    `
    INSERT INTO assignment_submissions (
      assignment_id,
      student_id,
      submission_text
    )
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [assignmentId, studentId, submissionText]
  );

  return result.rows[0];
};

// Find Submission by ID
export const findSubmissionById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM assignment_submissions
    WHERE id = $1;
    `,
    [id]
  );

  return result.rows[0];
};

// Get Student's Submissions
export const findSubmissionsByStudent = async (studentId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM assignment_submissions
    WHERE student_id = $1
    ORDER BY submitted_at DESC;
    `,
    [studentId]
  );

  return result.rows;
};

// Get All Submissions for an Assignment
export const findSubmissionsByAssignment = async (assignmentId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM assignment_submissions
    WHERE assignment_id = $1
    ORDER BY submitted_at DESC;
    `,
    [assignmentId]
  );

  return result.rows;
};

// Update Submission
export const updateSubmission = async ({
  id,
  studentId,
  submissionText,
}) => {
  const result = await pool.query(
    `
    UPDATE assignment_submissions
    SET
      submission_text = $1,
      submitted_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND student_id = $3
    RETURNING *;
    `,
    [submissionText, id, studentId]
  );

  return result.rows[0];
};

// Grade Submission
export const gradeSubmission = async ({
  id,
  grade,
  feedback,
}) => {
  const result = await pool.query(
    `
    UPDATE assignment_submissions
    SET
      grade = $1,
      feedback = $2,
      status = 'Graded'
    WHERE id = $3
    RETURNING *;
    `,
    [grade, feedback, id]
  );

  return result.rows[0];
};

// Delete Submission (Optional)
export const deleteSubmission = async ({
  id,
  studentId,
}) => {
  const result = await pool.query(
    `
    DELETE FROM assignment_submissions
    WHERE id = $1
      AND student_id = $2
    RETURNING *;
    `,
    [id, studentId]
  );

  return result.rows[0];
};