import pool from "../config/database.js";

// Create Question Papers Table
export const ensureQuestionPapersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS question_papers (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL,
      subject_name VARCHAR(100) NOT NULL,
      total_marks INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      instructions TEXT,
      file_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT fk_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE
    )
  `);

  // Add file_url if old table already exists
  await pool.query(`
    ALTER TABLE question_papers
    ADD COLUMN IF NOT EXISTS file_url TEXT
  `);
};

// Find Exam By ID
export const findExamByIdModel = async (exam_id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM exams
    WHERE id = $1
    `,
    [exam_id]
  );

  return result.rows[0] || null;
};

// Find Question Paper
export const findQuestionPaperModel = async (
  exam_id,
  subject_name,
  excludeId = null
) => {
  let query = `
    SELECT *
    FROM question_papers
    WHERE exam_id = $1
    AND LOWER(subject_name) = LOWER($2)
  `;

  const values = [exam_id, subject_name];

  // Used during update
  if (excludeId) {
    query += ` AND id != $3`;
    values.push(excludeId);
  }

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

// Create Question Paper
export const createQuestionPaperModel = async (
  exam_id,
  subject_name,
  total_marks,
  duration_minutes,
  instructions,
  file_url = null
) => {
  const result = await pool.query(
    `
    INSERT INTO question_papers
    (
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
      file_url
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
      file_url,
    ]
  );

  return result.rows[0];
};

// Get All Question Papers
export const getAllQuestionPapersModel = async () => {
  const result = await pool.query(`
    SELECT
      question_papers.id,
      question_papers.exam_id,
      COALESCE(exams.exam_name, 'Unassigned Exam') AS exam_name,
      question_papers.subject_name,
      question_papers.total_marks,
      question_papers.duration_minutes,
      question_papers.instructions,
      question_papers.file_url,
      question_papers.created_at
    FROM question_papers
    LEFT JOIN exams
      ON question_papers.exam_id = exams.id
    ORDER BY question_papers.id ASC
  `);

  return result.rows;
};

// Get Single Question Paper
export const getQuestionPaperByIdModel = async (id) => {
  const result = await pool.query(
    `
    SELECT
      question_papers.id,
      question_papers.exam_id,
      COALESCE(exams.exam_name, 'Unassigned Exam') AS exam_name,
      question_papers.subject_name,
      question_papers.total_marks,
      question_papers.duration_minutes,
      question_papers.instructions,
      question_papers.file_url,
      question_papers.created_at
    FROM question_papers
    LEFT JOIN exams
      ON question_papers.exam_id = exams.id
    WHERE question_papers.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
};

// Update Question Paper
export const updateQuestionPaperModel = async (
  id,
  exam_id,
  subject_name,
  total_marks,
  duration_minutes,
  instructions,
  file_url = null
) => {
  const result = await pool.query(
    `
    UPDATE question_papers
    SET
      exam_id = $1,
      subject_name = $2,
      total_marks = $3,
      duration_minutes = $4,
      instructions = $5,
      file_url = COALESCE($6, file_url)
    WHERE id = $7
    RETURNING *
    `,
    [
      exam_id,
      subject_name,
      total_marks,
      duration_minutes,
      instructions,
      file_url,
      id,
    ]
  );

  return result.rows[0] || null;
};

// Delete Question Paper
export const deleteQuestionPaperModel = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM question_papers
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
};