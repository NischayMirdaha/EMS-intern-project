import pool from "../config/database.js";

// =====================================================
// ENSURE OMR TABLES EXIST
// =====================================================
export const ensureOmrTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS omr_templates (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      subject_name VARCHAR(150) NOT NULL,
      total_questions INTEGER DEFAULT 50,
      marks_per_question NUMERIC DEFAULT 1,
      negative_marking NUMERIC DEFAULT 0,
      answer_key_json JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS omr_evaluations (
      id SERIAL PRIMARY KEY,
      omr_template_id INTEGER REFERENCES omr_templates(id) ON DELETE CASCADE,
      student_name VARCHAR(150) NOT NULL,
      roll_number VARCHAR(50),
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
      scanned_answers_json JSONB DEFAULT '{}'::jsonb,
      score NUMERIC DEFAULT 0,
      total_marks NUMERIC DEFAULT 0,
      percentage NUMERIC DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      blank_count INTEGER DEFAULT 0,
      evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

// =====================================================
// OMR TEMPLATES MODEL FUNCTIONS
// =====================================================

export const getAllOmrTemplatesModel = async () => {
  const query = `
    SELECT 
      ot.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      c.id as class_id,
      (SELECT COUNT(*) FROM omr_evaluations oe WHERE oe.omr_template_id = ot.id) AS evaluation_count
    FROM omr_templates ot
    LEFT JOIN exams e ON ot.exam_id = e.id
    LEFT JOIN classes c ON e.class_id = c.id
    ORDER BY ot.id DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getOmrTemplateByIdModel = async (id) => {
  const query = `
    SELECT 
      ot.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      c.id as class_id,
      (SELECT COUNT(*) FROM omr_evaluations oe WHERE oe.omr_template_id = ot.id) AS evaluation_count
    FROM omr_templates ot
    LEFT JOIN exams e ON ot.exam_id = e.id
    LEFT JOIN classes c ON e.class_id = c.id
    WHERE ot.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createOmrTemplateModel = async ({
  exam_id,
  title,
  subject_name,
  total_questions = 50,
  marks_per_question = 1,
  negative_marking = 0,
  answer_key_json = {},
}) => {
  const query = `
    INSERT INTO omr_templates (
      exam_id, title, subject_name, total_questions, marks_per_question, negative_marking, answer_key_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    exam_id || null,
    title,
    subject_name,
    total_questions || 50,
    marks_per_question || 1,
    negative_marking || 0,
    JSON.stringify(answer_key_json || {}),
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateOmrTemplateModel = async (
  id,
  {
    exam_id,
    title,
    subject_name,
    total_questions,
    marks_per_question,
    negative_marking,
    answer_key_json,
  }
) => {
  const query = `
    UPDATE omr_templates
    SET 
      exam_id = COALESCE($1, exam_id),
      title = COALESCE($2, title),
      subject_name = COALESCE($3, subject_name),
      total_questions = COALESCE($4, total_questions),
      marks_per_question = COALESCE($5, marks_per_question),
      negative_marking = COALESCE($6, negative_marking),
      answer_key_json = COALESCE($7, answer_key_json)
    WHERE id = $8
    RETURNING *
  `;
  const values = [
    exam_id,
    title,
    subject_name,
    total_questions,
    marks_per_question,
    negative_marking,
    answer_key_json !== undefined ? JSON.stringify(answer_key_json) : null,
    id,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteOmrTemplateModel = async (id) => {
  const query = `DELETE FROM omr_templates WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const saveAnswerKeyModel = async (id, answerKeyJson) => {
  const query = `
    UPDATE omr_templates
    SET answer_key_json = $1
    WHERE id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [JSON.stringify(answerKeyJson), id]);
  return result.rows[0];
};

// =====================================================
// OMR EVALUATION ENGINE
// =====================================================

export const evaluateOmrSheetModel = async ({
  omr_template_id,
  student_name,
  roll_number,
  class_id,
  section_id,
  scanned_answers_json = {},
}) => {
  // Fetch template and master key
  const template = await getOmrTemplateByIdModel(omr_template_id);
  if (!template) {
    throw new Error("OMR Template not found.");
  }

  const totalQuestions = Number(template.total_questions) || 50;
  const marksPerQuestion = Number(template.marks_per_question) || 1;
  const negativeMarking = Number(template.negative_marking) || 0;
  const masterKey = template.answer_key_json || {};

  let correctCount = 0;
  let incorrectCount = 0;
  let blankCount = 0;

  const itemBreakdown = [];

  for (let q = 1; q <= totalQuestions; q++) {
    const qKey = q.toString();
    const correctAns = (masterKey[qKey] || "").toUpperCase();
    const studentAns = (scanned_answers_json[qKey] || "").toUpperCase();

    if (!studentAns) {
      blankCount++;
      itemBreakdown.push({
        question_number: q,
        correct_answer: correctAns,
        student_answer: null,
        status: "BLANK",
        marks: 0,
      });
    } else if (correctAns && studentAns === correctAns) {
      correctCount++;
      itemBreakdown.push({
        question_number: q,
        correct_answer: correctAns,
        student_answer: studentAns,
        status: "CORRECT",
        marks: marksPerQuestion,
      });
    } else {
      incorrectCount++;
      itemBreakdown.push({
        question_number: q,
        correct_answer: correctAns,
        student_answer: studentAns,
        status: "INCORRECT",
        marks: -negativeMarking,
      });
    }
  }

  const rawScore = correctCount * marksPerQuestion - incorrectCount * negativeMarking;
  const finalScore = Number(Math.max(0, rawScore).toFixed(2));
  const maxTotalMarks = Number((totalQuestions * marksPerQuestion).toFixed(2));
  const percentage = maxTotalMarks > 0 ? Number(((finalScore / maxTotalMarks) * 100).toFixed(2)) : 0;

  const insertQuery = `
    INSERT INTO omr_evaluations (
      omr_template_id, student_name, roll_number, class_id, section_id,
      scanned_answers_json, score, total_marks, percentage,
      correct_count, incorrect_count, blank_count, evaluated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    RETURNING *
  `;
  const values = [
    omr_template_id,
    student_name,
    roll_number || "",
    class_id || template.class_id || null,
    section_id || null,
    JSON.stringify(scanned_answers_json),
    finalScore,
    maxTotalMarks,
    percentage,
    correctCount,
    incorrectCount,
    blankCount,
  ];

  const result = await pool.query(insertQuery, values);

  return {
    evaluation: result.rows[0],
    itemBreakdown,
    summary: {
      totalQuestions,
      correctCount,
      incorrectCount,
      blankCount,
      score: finalScore,
      totalMarks: maxTotalMarks,
      percentage,
      negativeDeductions: Number((incorrectCount * negativeMarking).toFixed(2)),
    },
  };
};

export const getEvaluationsByTemplateIdModel = async (omrTemplateId) => {
  const query = `
    SELECT 
      oe.*,
      c.class_name,
      s.section_name
    FROM omr_evaluations oe
    LEFT JOIN classes c ON oe.class_id = c.id
    LEFT JOIN sections s ON oe.section_id = s.id
    WHERE oe.omr_template_id = $1
    ORDER BY oe.evaluated_at DESC
  `;
  const result = await pool.query(query, [omrTemplateId]);
  return result.rows;
};

export const deleteEvaluationModel = async (id) => {
  const query = `DELETE FROM omr_evaluations WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// =====================================================
// STATISTICAL & ITEM DISTRACTOR ANALYSIS
// =====================================================
export const getOmrAnalyticsModel = async (omrTemplateId) => {
  const template = await getOmrTemplateByIdModel(omrTemplateId);
  if (!template) {
    throw new Error("Template not found.");
  }

  const evaluations = await getEvaluationsByTemplateIdModel(omrTemplateId);
  const totalStudents = evaluations.length;
  const totalQuestions = Number(template.total_questions) || 50;
  const masterKey = template.answer_key_json || {};

  const questionStats = [];

  for (let q = 1; q <= totalQuestions; q++) {
    const qKey = q.toString();
    const correctOption = masterKey[qKey] || "UNSET";
    const counts = { A: 0, B: 0, C: 0, D: 0, blank: 0 };

    evaluations.forEach((ev) => {
      const ans = (ev.scanned_answers_json?.[qKey] || "").toUpperCase();
      if (counts[ans] !== undefined) {
        counts[ans]++;
      } else {
        counts.blank++;
      }
    });

    const correctResponses = counts[correctOption] || 0;
    const accuracyPercentage =
      totalStudents > 0 ? Number(((correctResponses / totalStudents) * 100).toFixed(1)) : 0;

    questionStats.push({
      question_number: q,
      correct_option: correctOption,
      counts,
      correct_responses: correctResponses,
      accuracy_percentage: accuracyPercentage,
    });
  }

  const avgScore =
    totalStudents > 0
      ? Number((evaluations.reduce((sum, e) => sum + Number(e.score), 0) / totalStudents).toFixed(2))
      : 0;

  const highestScore =
    totalStudents > 0 ? Math.max(...evaluations.map((e) => Number(e.score))) : 0;
  const lowestScore =
    totalStudents > 0 ? Math.min(...evaluations.map((e) => Number(e.score))) : 0;

  return {
    template,
    totalStudents,
    avgScore,
    highestScore,
    lowestScore,
    questionStats,
  };
};
