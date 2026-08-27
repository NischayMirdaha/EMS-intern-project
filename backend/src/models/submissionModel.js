import pool from "../config/database.js";
import { SUBMISSION_STATUS } from "../constants/assignmentStatus.js";

const mapSubmission = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    submissionText: row.submission_text,
    attachmentUrl: row.attachment_url,
    attachmentOriginalName: row.attachment_original_name,
    isLate: row.is_late,
    marksObtained: row.marks_obtained,
    feedback: row.feedback,
    gradedBy: row.graded_by,
    gradedAt: row.graded_at,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
};

export const ensureSubmissionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      submission_text TEXT,
      attachment_url TEXT,
      is_late BOOLEAN NOT NULL DEFAULT FALSE,
      marks_obtained INTEGER,
      feedback TEXT,
      graded_by INTEGER REFERENCES users(id),
      graded_at TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT '${SUBMISSION_STATUS.SUBMITTED}',
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      -- One submission per student per assignment. Resubmitting before the
      -- due date overwrites it (see upsertSubmission) rather than creating
      -- duplicate rows.
      UNIQUE (assignment_id, student_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id);
  `);

  await pool.query(`
    ALTER TABLE assignment_submissions
    ADD COLUMN IF NOT EXISTS attachment_original_name VARCHAR(255)
  `);
};

// Insert on first submission, overwrite on resubmission — a student should
// only ever have one row per assignment. Resubmitting resets status back to
// "submitted" and clears any previous grade, since the teacher is now
// grading different content.
export const upsertSubmission = async ({
  assignmentId,
  studentId,
  submissionText,
  attachmentUrl,
  attachmentOriginalName,
  isLate,
}) => {
  const result = await pool.query(
    `
      INSERT INTO assignment_submissions
        (assignment_id, student_id, submission_text, attachment_url, attachment_original_name, is_late, status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, '${SUBMISSION_STATUS.SUBMITTED}', NOW())
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET
        submission_text = EXCLUDED.submission_text,
        attachment_url = EXCLUDED.attachment_url,
        attachment_original_name = EXCLUDED.attachment_original_name,
        is_late = EXCLUDED.is_late,
        status = '${SUBMISSION_STATUS.SUBMITTED}',
        marks_obtained = NULL,
        feedback = NULL,
        graded_by = NULL,
        graded_at = NULL,
        submitted_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `,
    [
      assignmentId,
      studentId,
      submissionText || null,
      attachmentUrl || null,
      attachmentOriginalName || null,
      isLate,
    ]
  );

  return mapSubmission(result.rows[0]);
};

export const findSubmissionById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM assignment_submissions WHERE id = $1`,
    [id]
  );

  return mapSubmission(result.rows[0]);
};

export const findSubmissionByAssignmentAndStudent = async (
  assignmentId,
  studentId
) => {
  const result = await pool.query(
    `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2`,
    [assignmentId, studentId]
  );

  return mapSubmission(result.rows[0]);
};

export const listSubmissionsForAssignment = async (assignmentId) => {
  const result = await pool.query(
    `
      SELECT * FROM assignment_submissions
      WHERE assignment_id = $1
      ORDER BY submitted_at ASC
    `,
    [assignmentId]
  );

  return result.rows.map(mapSubmission);
};

export const gradeSubmission = async ({
  id,
  marksObtained,
  feedback,
  gradedBy,
}) => {
  const result = await pool.query(
    `
      UPDATE assignment_submissions
      SET marks_obtained = $1,
          feedback = $2,
          graded_by = $3,
          graded_at = NOW(),
          status = '${SUBMISSION_STATUS.GRADED}',
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [marksObtained, feedback || null, gradedBy, id]
  );

  return mapSubmission(result.rows[0]);
};
