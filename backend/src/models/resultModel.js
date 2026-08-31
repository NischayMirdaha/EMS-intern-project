import pool from "../config/database.js";

// =====================================================
// ENSURE RESULTS TABLE EXISTS
// =====================================================
export const ensureResultsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      student_name VARCHAR(150) NOT NULL,
      roll_number VARCHAR(50),
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
      subjects_marks_json JSONB DEFAULT '[]'::jsonb,
      total_obtained NUMERIC DEFAULT 0,
      grand_total NUMERIC DEFAULT 0,
      percentage NUMERIC DEFAULT 0,
      gpa NUMERIC DEFAULT 0,
      grade VARCHAR(10),
      result_status VARCHAR(20) DEFAULT 'Pass',
      rank INTEGER,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

// =====================================================
// GPA & GRADING HELPER UTILITIES
// =====================================================

export const computeSubjectGradeAndGPA = (obtained, full, pass) => {
  const fullMarks = Number(full) || 100;
  const obtainedMarks = Number(obtained) || 0;
  const passMarks = Number(pass) || (fullMarks * 0.35);

  if (fullMarks <= 0) return { gradePoint: 0, grade: "NG", status: "Fail" };
  const pct = (obtainedMarks / fullMarks) * 100;
  const isPass = obtainedMarks >= passMarks;

  let grade = "NG";
  let gradePoint = 0.0;

  if (pct >= 90) { grade = "A+"; gradePoint = 4.0; }
  else if (pct >= 80) { grade = "A"; gradePoint = 3.6; }
  else if (pct >= 70) { grade = "B+"; gradePoint = 3.2; }
  else if (pct >= 60) { grade = "B"; gradePoint = 2.8; }
  else if (pct >= 50) { grade = "C+"; gradePoint = 2.4; }
  else if (pct >= 40) { grade = "C"; gradePoint = 2.0; }
  else if (pct >= 35) { grade = "D"; gradePoint = 1.6; }
  else { grade = "NG"; gradePoint = 0.0; }

  return {
    percentage: Number(pct.toFixed(2)),
    gradePoint,
    grade,
    status: isPass ? "Pass" : "Fail",
  };
};

export const computeOverallResult = (subjectsMarks = []) => {
  let totalObtained = 0;
  let grandTotal = 0;
  let totalGradePoints = 0;
  let hasFailedSubject = false;

  const processedSubjects = (subjectsMarks || []).map((sub) => {
    const theory = Number(sub.theory_marks) || 0;
    const practical = Number(sub.practical_marks) || 0;
    const obtained = Number((theory + practical).toFixed(2));
    const full = Number(sub.full_marks) || 100;
    const pass = Number(sub.pass_marks) || Number((full * 0.35).toFixed(2));

    const grading = computeSubjectGradeAndGPA(obtained, full, pass);
    if (grading.status === "Fail") {
      hasFailedSubject = true;
    }

    totalObtained += obtained;
    grandTotal += full;
    totalGradePoints += grading.gradePoint;

    return {
      subject_name: sub.subject_name || "General Subject",
      full_marks: full,
      pass_marks: pass,
      theory_marks: theory,
      practical_marks: practical,
      total_marks: obtained,
      grade_point: grading.gradePoint,
      letter_grade: grading.grade,
      status: grading.status,
      remarks: sub.remarks || (grading.status === "Pass" ? "Passed" : "Needs Improvement"),
    };
  });

  const percentage = grandTotal > 0 ? Number(((totalObtained / grandTotal) * 100).toFixed(2)) : 0;
  const rawAvgGPA = subjectsMarks.length > 0 ? Number((totalGradePoints / subjectsMarks.length).toFixed(2)) : 0;

  let finalGrade = "NG";
  let finalGPA = rawAvgGPA;
  let finalStatus = hasFailedSubject ? "Fail" : "Pass";

  if (finalStatus === "Fail") {
    finalGrade = "NG";
    finalGPA = 0.0;
  } else {
    if (percentage >= 90) finalGrade = "A+";
    else if (percentage >= 80) finalGrade = "A";
    else if (percentage >= 70) finalGrade = "B+";
    else if (percentage >= 60) finalGrade = "B";
    else if (percentage >= 50) finalGrade = "C+";
    else if (percentage >= 40) finalGrade = "C";
    else if (percentage >= 35) finalGrade = "D";
    else {
      finalGrade = "NG";
      finalStatus = "Fail";
      finalGPA = 0.0;
    }
  }

  return {
    processedSubjects,
    totalObtained: Number(totalObtained.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    percentage,
    gpa: finalGPA,
    grade: finalGrade,
    resultStatus: finalStatus,
  };
};

// =====================================================
// RECALCULATE RANKS
// =====================================================
export const recalculateRanksForExamModel = async (examId) => {
  if (!examId) return;

  const res = await pool.query(
    `
    SELECT id, gpa, total_obtained, result_status
    FROM results
    WHERE exam_id = $1
    ORDER BY
      CASE WHEN result_status = 'Pass' THEN 1 ELSE 2 END ASC,
      gpa DESC,
      total_obtained DESC,
      id ASC
    `,
    [examId]
  );

  let rank = 1;
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    const assignedRank = row.result_status === "Pass" ? rank++ : null;
    await pool.query(
      `UPDATE results SET rank = $1, updated_at = NOW() WHERE id = $2`,
      [assignedRank, row.id]
    );
  }
};

// =====================================================
// RESULT CRUD & PROCESSING MODELS
// =====================================================

export const getAllResultsModel = async ({ exam_id, class_id, section_id, search }) => {
  let query = `
    SELECT 
      r.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      s.section_name
    FROM results r
    LEFT JOIN exams e ON r.exam_id = e.id
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN sections s ON r.section_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (exam_id) {
    params.push(exam_id);
    query += ` AND r.exam_id = $${params.length}`;
  }
  if (class_id) {
    params.push(class_id);
    query += ` AND r.class_id = $${params.length}`;
  }
  if (section_id) {
    params.push(section_id);
    query += ` AND r.section_id = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (r.student_name ILIKE $${params.length} OR r.roll_number ILIKE $${params.length})`;
  }

  query += `
    ORDER BY 
      CASE WHEN r.rank IS NOT NULL THEN r.rank ELSE 9999 END ASC,
      r.percentage DESC,
      r.id ASC
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getResultByIdModel = async (id) => {
  const query = `
    SELECT 
      r.*,
      e.exam_name,
      e.exam_type,
      e.start_date,
      e.end_date,
      c.class_name,
      s.section_name,
      s.class_teacher
    FROM results r
    LEFT JOIN exams e ON r.exam_id = e.id
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN sections s ON r.section_id = s.id
    WHERE r.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const getResultsByExamIdModel = async (examId) => {
  const query = `
    SELECT 
      r.*,
      e.exam_name,
      e.exam_type,
      c.class_name,
      s.section_name
    FROM results r
    LEFT JOIN exams e ON r.exam_id = e.id
    LEFT JOIN classes c ON r.class_id = c.id
    LEFT JOIN sections s ON r.section_id = s.id
    WHERE r.exam_id = $1
    ORDER BY 
      CASE WHEN r.rank IS NOT NULL THEN r.rank ELSE 9999 END ASC,
      r.percentage DESC,
      r.id ASC
  `;
  const result = await pool.query(query, [examId]);
  const rows = result.rows;

  // Compute Class Aggregate Statistics
  const totalStudents = rows.length;
  const passedStudents = rows.filter((r) => r.result_status === "Pass").length;
  const failedStudents = totalStudents - passedStudents;
  const passRate = totalStudents > 0 ? Number(((passedStudents / totalStudents) * 100).toFixed(1)) : 0;
  
  const avgGpa = totalStudents > 0
    ? Number((rows.reduce((sum, r) => sum + Number(r.gpa || 0), 0) / totalStudents).toFixed(2))
    : 0;

  const highestScore = totalStudents > 0 ? Math.max(...rows.map((r) => Number(r.total_obtained || 0))) : 0;
  const topStudent = rows.find((r) => r.rank === 1) || (rows.length > 0 ? rows[0] : null);

  return {
    examId,
    results: rows,
    statistics: {
      totalStudents,
      passedStudents,
      failedStudents,
      passRate,
      avgGpa,
      highestScore,
      topStudent: topStudent ? { name: topStudent.student_name, roll: topStudent.roll_number, gpa: topStudent.gpa, score: topStudent.total_obtained } : null,
    },
  };
};

export const saveOrUpdateResultModel = async ({
  id,
  exam_id,
  student_name,
  roll_number,
  class_id,
  section_id,
  subjects_marks_json = [],
  remarks = "",
}) => {
  const computed = computeOverallResult(subjects_marks_json);

  let savedResult;
  if (id) {
    // Update existing result
    const query = `
      UPDATE results
      SET
        exam_id = COALESCE($1, exam_id),
        student_name = COALESCE($2, student_name),
        roll_number = COALESCE($3, roll_number),
        class_id = COALESCE($4, class_id),
        section_id = COALESCE($5, section_id),
        subjects_marks_json = $6,
        total_obtained = $7,
        grand_total = $8,
        percentage = $9,
        gpa = $10,
        grade = $11,
        result_status = $12,
        remarks = $13,
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `;
    const values = [
      exam_id,
      student_name,
      roll_number,
      class_id,
      section_id,
      JSON.stringify(computed.processedSubjects),
      computed.totalObtained,
      computed.grandTotal,
      computed.percentage,
      computed.gpa,
      computed.grade,
      computed.resultStatus,
      remarks,
      id,
    ];
    const res = await pool.query(query, values);
    savedResult = res.rows[0];
  } else {
    // Check if student already has a result for this exam
    const existing = await pool.query(
      `SELECT id FROM results WHERE exam_id = $1 AND (LOWER(student_name) = LOWER($2) OR (roll_number != '' AND roll_number = $3))`,
      [exam_id, student_name, roll_number || ""]
    );

    if (existing.rows.length > 0) {
      const updateQuery = `
        UPDATE results
        SET
          student_name = $1,
          roll_number = $2,
          class_id = $3,
          section_id = $4,
          subjects_marks_json = $5,
          total_obtained = $6,
          grand_total = $7,
          percentage = $8,
          gpa = $9,
          grade = $10,
          result_status = $11,
          remarks = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
      `;
      const res = await pool.query(updateQuery, [
        student_name,
        roll_number,
        class_id,
        section_id,
        JSON.stringify(computed.processedSubjects),
        computed.totalObtained,
        computed.grandTotal,
        computed.percentage,
        computed.gpa,
        computed.grade,
        computed.resultStatus,
        remarks,
        existing.rows[0].id,
      ]);
      savedResult = res.rows[0];
    } else {
      const insertQuery = `
        INSERT INTO results (
          exam_id, student_name, roll_number, class_id, section_id,
          subjects_marks_json, total_obtained, grand_total, percentage,
          gpa, grade, result_status, remarks, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `;
      const values = [
        exam_id,
        student_name,
        roll_number || "",
        class_id || null,
        section_id || null,
        JSON.stringify(computed.processedSubjects),
        computed.totalObtained,
        computed.grandTotal,
        computed.percentage,
        computed.gpa,
        computed.grade,
        computed.resultStatus,
        remarks,
      ];
      const res = await pool.query(insertQuery, values);
      savedResult = res.rows[0];
    }
  }

  // Recalculate ranks for the whole exam
  if (savedResult && savedResult.exam_id) {
    await recalculateRanksForExamModel(savedResult.exam_id);
  }

  return getResultByIdModel(savedResult.id);
};

export const batchProcessExamResultsModel = async (examId, classId, sectionId, studentsList = []) => {
  const processedResults = [];

  for (const student of studentsList) {
    const computed = computeOverallResult(student.subjects_marks || []);

    const existing = await pool.query(
      `SELECT id FROM results WHERE exam_id = $1 AND (LOWER(student_name) = LOWER($2) OR (roll_number != '' AND roll_number = $3))`,
      [examId, student.student_name, student.roll_number || ""]
    );

    if (existing.rows.length > 0) {
      const res = await pool.query(
        `
        UPDATE results
        SET
          student_name = $1,
          roll_number = $2,
          class_id = $3,
          section_id = $4,
          subjects_marks_json = $5,
          total_obtained = $6,
          grand_total = $7,
          percentage = $8,
          gpa = $9,
          grade = $10,
          result_status = $11,
          remarks = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *
        `,
        [
          student.student_name,
          student.roll_number || "",
          classId || student.class_id || null,
          sectionId || student.section_id || null,
          JSON.stringify(computed.processedSubjects),
          computed.totalObtained,
          computed.grandTotal,
          computed.percentage,
          computed.gpa,
          computed.grade,
          computed.resultStatus,
          student.remarks || "",
          existing.rows[0].id,
        ]
      );
      processedResults.push(res.rows[0]);
    } else {
      const res = await pool.query(
        `
        INSERT INTO results (
          exam_id, student_name, roll_number, class_id, section_id,
          subjects_marks_json, total_obtained, grand_total, percentage,
          gpa, grade, result_status, remarks, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
        `,
        [
          examId,
          student.student_name,
          student.roll_number || "",
          classId || student.class_id || null,
          sectionId || student.section_id || null,
          JSON.stringify(computed.processedSubjects),
          computed.totalObtained,
          computed.grandTotal,
          computed.percentage,
          computed.gpa,
          computed.grade,
          computed.resultStatus,
          student.remarks || "",
        ]
      );
      processedResults.push(res.rows[0]);
    }
  }

  // Recalculate ranks across the whole exam class
  await recalculateRanksForExamModel(examId);

  return getResultsByExamIdModel(examId);
};

// =====================================================
// SMART AGGREGATION FROM ONLINE EXAMS & OMR
// =====================================================
export const aggregateFromOnlineExamsAndOMRModel = async (examId) => {
  // 1. Get Exam details
  const examRes = await pool.query(`SELECT * FROM exams WHERE id = $1`, [examId]);
  if (examRes.rows.length === 0) {
    throw new Error("Exam not found.");
  }
  const exam = examRes.rows[0];

  // 2. Fetch Online Exam Attempts linked to this exam_id
  const onlineAttemptsRes = await pool.query(
    `
    SELECT 
      sea.*,
      oe.title AS online_exam_title,
      oe.total_marks AS online_total_marks,
      oe.pass_marks AS online_pass_marks
    FROM student_exam_attempts sea
    JOIN online_exams oe ON sea.online_exam_id = oe.id
    WHERE oe.exam_id = $1
    ORDER BY sea.id ASC
    `,
    [examId]
  );

  // 3. Fetch OMR Evaluations linked to this exam_id
  const omrEvalsRes = await pool.query(
    `
    SELECT 
      oev.*,
      ot.title AS omr_title,
      ot.subject_name AS omr_subject,
      ot.total_questions,
      ot.marks_per_question
    FROM omr_evaluations oev
    JOIN omr_templates ot ON oev.omr_template_id = ot.id
    WHERE ot.exam_id = $1
    ORDER BY oev.id ASC
    `,
    [examId]
  );

  // Group by Student Key: (roll_number || student_name)
  const studentMap = new Map();

  // Helper to ensure student record in map
  const getOrCreateStudent = (name, roll, classId, sectionId) => {
    const key = (roll ? `ROLL_${roll.trim().toLowerCase()}` : `NAME_${name.trim().toLowerCase()}`);
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        student_name: name,
        roll_number: roll || "",
        class_id: classId || exam.class_id,
        section_id: sectionId || null,
        subjects_marks: [],
      });
    }
    return studentMap.get(key);
  };

  // Add Online Exam scores as subjects
  onlineAttemptsRes.rows.forEach((att) => {
    const student = getOrCreateStudent(
      att.student_name,
      att.roll_number,
      att.class_id,
      att.section_id
    );

    const subjectName = `Online Quiz: ${att.online_exam_title || "Assessment"}`;
    const full = Number(att.online_total_marks) || Number(att.total_marks) || 100;
    const pass = Number(att.online_pass_marks) || (full * 0.35);
    const obtained = Number(att.score) || 0;

    student.subjects_marks.push({
      subject_name: subjectName,
      full_marks: full,
      pass_marks: pass,
      theory_marks: obtained,
      practical_marks: 0,
      total_marks: obtained,
      remarks: `Auto-Aggregated from Online Test (Score: ${obtained}/${full})`,
    });
  });

  // Add OMR scores as subjects
  omrEvalsRes.rows.forEach((omr) => {
    const student = getOrCreateStudent(
      omr.student_name,
      omr.roll_number,
      omr.class_id,
      omr.section_id
    );

    const subjectName = `OMR: ${omr.omr_subject || omr.omr_title || "Multiple Choice"}`;
    const full = Number(omr.total_marks) || 50;
    const pass = Number((full * 0.35).toFixed(2));
    const obtained = Number(omr.score) || 0;

    student.subjects_marks.push({
      subject_name: subjectName,
      full_marks: full,
      pass_marks: pass,
      theory_marks: obtained,
      practical_marks: 0,
      total_marks: obtained,
      remarks: `Auto-Aggregated from OMR Sheet (Correct: ${omr.correct_count}, Incorrect: ${omr.incorrect_count})`,
    });
  });

  const studentsList = Array.from(studentMap.values());

  if (studentsList.length === 0) {
    return {
      success: true,
      message: "No Online Exam attempts or OMR evaluations found for this exam.",
      count: 0,
      results: [],
    };
  }

  // Save all aggregated results in batch
  const batchRes = await batchProcessExamResultsModel(
    examId,
    exam.class_id,
    null,
    studentsList
  );

  return {
    success: true,
    message: `Successfully aggregated ${studentsList.length} student results from Online Exams & OMR.`,
    count: studentsList.length,
    aggregatedData: batchRes,
  };
};

export const deleteResultModel = async (id) => {
  const res = await pool.query(`DELETE FROM results WHERE id = $1 RETURNING *`, [id]);
  const deleted = res.rows[0];
  if (deleted && deleted.exam_id) {
    await recalculateRanksForExamModel(deleted.exam_id);
  }
  return deleted;
};

export const deleteResultsByExamModel = async (examId) => {
  const res = await pool.query(`DELETE FROM results WHERE exam_id = $1 RETURNING *`, [examId]);
  return res.rows;
};
