import pool from "../config/database.js";

// =====================================================
// ENSURE ONLINE EXAM TABLES EXIST
// =====================================================
export const ensureOnlineExamsTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS online_exams (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      subject_name VARCHAR(150) NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      total_marks INTEGER DEFAULT 100,
      pass_marks INTEGER DEFAULT 40,
      instructions TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_questions (
      id SERIAL PRIMARY KEY,
      online_exam_id INTEGER REFERENCES online_exams(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option VARCHAR(1) NOT NULL,
      marks NUMERIC DEFAULT 1,
      explanation TEXT,
      sort_order INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_exam_attempts (
      id SERIAL PRIMARY KEY,
      online_exam_id INTEGER REFERENCES online_exams(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      student_name VARCHAR(150) NOT NULL,
      roll_number VARCHAR(50),
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      submit_time TIMESTAMP,
      score NUMERIC DEFAULT 0,
      total_marks NUMERIC DEFAULT 0,
      percentage NUMERIC DEFAULT 0,
      status VARCHAR(50) DEFAULT 'IN_PROGRESS',
      answers_json JSONB DEFAULT '{}'::jsonb,
      tab_switches_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

// =====================================================
// MODEL FUNCTIONS
// =====================================================

export const getAllOnlineExamsModel = async () => {
  const query = `
    SELECT 
      oe.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      c.id as class_id,
      (SELECT COUNT(*) FROM exam_questions eq WHERE eq.online_exam_id = oe.id) AS question_count,
      (SELECT COUNT(*) FROM student_exam_attempts sea WHERE sea.online_exam_id = oe.id) AS submission_count
    FROM online_exams oe
    LEFT JOIN exams e ON oe.exam_id = e.id
    LEFT JOIN classes c ON e.class_id = c.id
    ORDER BY oe.id DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getOnlineExamByIdModel = async (id) => {
  const query = `
    SELECT 
      oe.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      c.id as class_id,
      (SELECT COUNT(*) FROM exam_questions eq WHERE eq.online_exam_id = oe.id) AS question_count,
      (SELECT COUNT(*) FROM student_exam_attempts sea WHERE sea.online_exam_id = oe.id) AS submission_count
    FROM online_exams oe
    LEFT JOIN exams e ON oe.exam_id = e.id
    LEFT JOIN classes c ON e.class_id = c.id
    WHERE oe.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createOnlineExamModel = async ({
  exam_id,
  title,
  subject_name,
  duration_minutes,
  total_marks,
  pass_marks,
  instructions,
  is_active = true,
}) => {
  const query = `
    INSERT INTO online_exams (
      exam_id, title, subject_name, duration_minutes, total_marks, pass_marks, instructions, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    exam_id || null,
    title,
    subject_name,
    duration_minutes || 60,
    total_marks || 100,
    pass_marks || 40,
    instructions || "",
    is_active !== undefined ? is_active : true,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateOnlineExamModel = async (
  id,
  {
    exam_id,
    title,
    subject_name,
    duration_minutes,
    total_marks,
    pass_marks,
    instructions,
    is_active,
  }
) => {
  const query = `
    UPDATE online_exams
    SET 
      exam_id = COALESCE($1, exam_id),
      title = COALESCE($2, title),
      subject_name = COALESCE($3, subject_name),
      duration_minutes = COALESCE($4, duration_minutes),
      total_marks = COALESCE($5, total_marks),
      pass_marks = COALESCE($6, pass_marks),
      instructions = COALESCE($7, instructions),
      is_active = COALESCE($8, is_active)
    WHERE id = $9
    RETURNING *
  `;
  const values = [
    exam_id,
    title,
    subject_name,
    duration_minutes,
    total_marks,
    pass_marks,
    instructions,
    is_active,
    id,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteOnlineExamModel = async (id) => {
  const query = `DELETE FROM online_exams WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// =====================================================
// QUESTIONS MANAGEMENT
// =====================================================

export const getQuestionsByExamIdModel = async (
  onlineExamId,
  includeAnswer = false
) => {
  let selectClause = `id, online_exam_id, question_text, option_a, option_b, option_c, option_d, marks, sort_order`;
  if (includeAnswer) {
    selectClause += `, correct_option, explanation`;
  }
  const query = `
    SELECT ${selectClause}
    FROM exam_questions
    WHERE online_exam_id = $1
    ORDER BY sort_order ASC, id ASC
  `;
  const result = await pool.query(query, [onlineExamId]);
  return result.rows;
};

export const saveQuestionsBulkModel = async (onlineExamId, questions) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Delete existing questions
    await client.query(
      "DELETE FROM exam_questions WHERE online_exam_id = $1",
      [onlineExamId]
    );

    const insertedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const res = await client.query(
        `INSERT INTO exam_questions (
          online_exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          onlineExamId,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option.toUpperCase(),
          q.marks || 1,
          q.explanation || "",
          i + 1,
        ]
      );
      insertedQuestions.push(res.rows[0]);
    }

    await client.query("COMMIT");
    return insertedQuestions;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// STUDENT ATTEMPT & AUTO-GRADING
// =====================================================

export const createStudentAttemptModel = async ({
  online_exam_id,
  user_id,
  student_name,
  roll_number,
  class_id,
  section_id,
}) => {
  const query = `
    INSERT INTO student_exam_attempts (
      online_exam_id, user_id, student_name, roll_number, class_id, section_id, start_time, status
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'IN_PROGRESS')
    RETURNING *
  `;
  const values = [
    online_exam_id,
    user_id || null,
    student_name,
    roll_number || "",
    class_id || null,
    section_id || null,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const submitStudentAttemptModel = async ({
  attempt_id,
  answers_json,
  tab_switches_count = 0,
}) => {
  // Fetch attempt and exam
  const attemptRes = await pool.query(
    `SELECT sea.*, oe.pass_marks, oe.total_marks as exam_total_marks
     FROM student_exam_attempts sea
     JOIN online_exams oe ON sea.online_exam_id = oe.id
     WHERE sea.id = $1`,
    [attempt_id]
  );
  if (attemptRes.rows.length === 0) {
    throw new Error("Exam attempt not found.");
  }
  const attempt = attemptRes.rows[0];

  // Fetch all questions with correct answers
  const questionsRes = await pool.query(
    `SELECT * FROM exam_questions WHERE online_exam_id = $1 ORDER BY sort_order ASC`,
    [attempt.online_exam_id]
  );
  const questions = questionsRes.rows;

  let totalScore = 0;
  let maxMarks = 0;
  const detailedBreakdown = [];

  for (const q of questions) {
    const qMarks = Number(q.marks) || 1;
    maxMarks += qMarks;
    const studentAnswer = (answers_json[q.id] || "").toUpperCase();
    const isCorrect = studentAnswer === q.correct_option.toUpperCase();

    if (isCorrect) {
      totalScore += qMarks;
    }

    detailedBreakdown.push({
      question_id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      student_answer: studentAnswer,
      is_correct: isCorrect,
      marks: qMarks,
      obtained_marks: isCorrect ? qMarks : 0,
      explanation: q.explanation,
    });
  }

  const effectiveTotal = maxMarks > 0 ? maxMarks : Number(attempt.exam_total_marks) || 100;
  const percentage = effectiveTotal > 0 ? Number(((totalScore / effectiveTotal) * 100).toFixed(2)) : 0;
  const passMarks = Number(attempt.pass_marks) || 40;
  const status = percentage >= passMarks ? "PASSED" : "FAILED";

  const updateQuery = `
    UPDATE student_exam_attempts
    SET 
      submit_time = NOW(),
      score = $1,
      total_marks = $2,
      percentage = $3,
      status = $4,
      answers_json = $5,
      tab_switches_count = $6
    WHERE id = $7
    RETURNING *
  `;
  const result = await pool.query(updateQuery, [
    totalScore,
    effectiveTotal,
    percentage,
    status,
    JSON.stringify(answers_json),
    tab_switches_count,
    attempt_id,
  ]);

  return {
    attempt: result.rows[0],
    breakdown: detailedBreakdown,
    totalScore,
    totalMarks: effectiveTotal,
    percentage,
    status,
    passMarks,
  };
};

export const getSubmissionsByExamIdModel = async (onlineExamId) => {
  const query = `
    SELECT 
      sea.*,
      c.class_name,
      s.section_name
    FROM student_exam_attempts sea
    LEFT JOIN classes c ON sea.class_id = c.id
    LEFT JOIN sections s ON sea.section_id = s.id
    WHERE sea.online_exam_id = $1
    ORDER BY sea.created_at DESC
  `;
  const result = await pool.query(query, [onlineExamId]);
  return result.rows;
};

export const getAttemptByIdModel = async (attemptId) => {
  const query = `
    SELECT 
      sea.*,
      oe.title as exam_title,
      oe.subject_name,
      oe.pass_marks,
      c.class_name,
      s.section_name
    FROM student_exam_attempts sea
    JOIN online_exams oe ON sea.online_exam_id = oe.id
    LEFT JOIN classes c ON sea.class_id = c.id
    LEFT JOIN sections s ON sea.section_id = s.id
    WHERE sea.id = $1
  `;
  const result = await pool.query(query, [attemptId]);
  return result.rows[0];
};
