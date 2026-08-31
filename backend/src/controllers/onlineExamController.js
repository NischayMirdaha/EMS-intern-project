import {
  getAllOnlineExamsModel,
  getOnlineExamByIdModel,
  createOnlineExamModel,
  updateOnlineExamModel,
  deleteOnlineExamModel,
  getQuestionsByExamIdModel,
  saveQuestionsBulkModel,
  createStudentAttemptModel,
  submitStudentAttemptModel,
  getSubmissionsByExamIdModel,
  getAttemptByIdModel,
} from "../models/onlineExamModel.js";

// =====================================================
// GET ALL ONLINE EXAMS
// =====================================================
export const getAllOnlineExams = async (req, res) => {
  try {
    const exams = await getAllOnlineExamsModel();
    return res.status(200).json({
      success: true,
      message: "Online exams fetched successfully.",
      data: exams,
    });
  } catch (error) {
    console.error("Get All Online Exams Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch online exams.",
    });
  }
};

// =====================================================
// GET SINGLE ONLINE EXAM
// =====================================================
export const getOnlineExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await getOnlineExamByIdModel(id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Online exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Get Online Exam By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch online exam.",
    });
  }
};

// =====================================================
// CREATE ONLINE EXAM
// =====================================================
export const createOnlineExam = async (req, res) => {
  try {
    const {
      exam_id,
      title,
      subject_name,
      duration_minutes,
      total_marks,
      pass_marks,
      instructions,
      is_active,
    } = req.body;

    if (!title || !subject_name) {
      return res.status(400).json({
        success: false,
        message: "Exam title and subject name are required.",
      });
    }

    const created = await createOnlineExamModel({
      exam_id: exam_id ? Number(exam_id) : null,
      title: title.trim(),
      subject_name: subject_name.trim(),
      duration_minutes: duration_minutes ? Number(duration_minutes) : 60,
      total_marks: total_marks ? Number(total_marks) : 100,
      pass_marks: pass_marks ? Number(pass_marks) : 40,
      instructions: instructions || "",
      is_active: is_active !== undefined ? is_active : true,
    });

    return res.status(201).json({
      success: true,
      message: "Online exam created successfully.",
      data: created,
    });
  } catch (error) {
    console.error("Create Online Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create online exam.",
    });
  }
};

// =====================================================
// UPDATE ONLINE EXAM
// =====================================================
export const updateOnlineExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exam_id,
      title,
      subject_name,
      duration_minutes,
      total_marks,
      pass_marks,
      instructions,
      is_active,
    } = req.body;

    const existing = await getOnlineExamByIdModel(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Online exam not found.",
      });
    }

    const updated = await updateOnlineExamModel(id, {
      exam_id: exam_id !== undefined ? (exam_id ? Number(exam_id) : null) : undefined,
      title: title ? title.trim() : undefined,
      subject_name: subject_name ? subject_name.trim() : undefined,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
      total_marks: total_marks !== undefined ? Number(total_marks) : undefined,
      pass_marks: pass_marks !== undefined ? Number(pass_marks) : undefined,
      instructions: instructions !== undefined ? instructions : undefined,
      is_active: is_active !== undefined ? is_active : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Online exam updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update Online Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update online exam.",
    });
  }
};

// =====================================================
// DELETE ONLINE EXAM
// =====================================================
export const deleteOnlineExam = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteOnlineExamModel(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Online exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Online exam deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete Online Exam Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete online exam.",
    });
  }
};

// =====================================================
// GET EXAM QUESTIONS
// =====================================================
export const getExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    // If student is taking the test, we hide answers unless mode=edit / teacher
    const isTeacherOrAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "teacher" || req.user.role === "user");
    const mode = req.query.mode;
    const includeAnswer = mode === "edit" || (isTeacherOrAdmin && mode !== "take");

    const questions = await getQuestionsByExamIdModel(id, includeAnswer);

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully.",
      data: questions,
    });
  } catch (error) {
    console.error("Get Exam Questions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch questions.",
    });
  }
};

// =====================================================
// SAVE QUESTIONS BULK
// =====================================================
export const saveExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required.",
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} has incomplete fields. Question text, options A-D, and correct option are required.`,
        });
      }
      if (!["A", "B", "C", "D"].includes(q.correct_option.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} correct option must be A, B, C, or D.`,
        });
      }
    }

    const saved = await saveQuestionsBulkModel(id, questions);

    // Update total marks on the exam based on question sum
    const totalMarks = saved.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    await updateOnlineExamModel(id, { total_marks: totalMarks });

    return res.status(200).json({
      success: true,
      message: `${saved.length} questions saved successfully.`,
      data: saved,
    });
  } catch (error) {
    console.error("Save Questions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save questions.",
    });
  }
};

// =====================================================
// STUDENT: START EXAM ATTEMPT
// =====================================================
export const startExamAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, roll_number, class_id, section_id } = req.body;

    if (!student_name) {
      return res.status(400).json({
        success: false,
        message: "Student name is required to begin the exam.",
      });
    }

    const exam = await getOnlineExamByIdModel(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Online exam not found.",
      });
    }

    if (!exam.is_active) {
      return res.status(400).json({
        success: false,
        message: "This online exam is currently inactive.",
      });
    }

    const attempt = await createStudentAttemptModel({
      online_exam_id: id,
      user_id: req.user ? req.user.id : null,
      student_name: student_name.trim(),
      roll_number: roll_number ? roll_number.trim() : "",
      class_id: class_id || exam.class_id || null,
      section_id: section_id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Exam session started.",
      data: {
        attempt_id: attempt.id,
        exam: {
          id: exam.id,
          title: exam.title,
          subject_name: exam.subject_name,
          duration_minutes: exam.duration_minutes,
          total_marks: exam.total_marks,
          instructions: exam.instructions,
        },
      },
    });
  } catch (error) {
    console.error("Start Exam Attempt Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start exam session.",
    });
  }
};

// =====================================================
// STUDENT: SUBMIT EXAM ATTEMPT
// =====================================================
export const submitExamAttempt = async (req, res) => {
  try {
    const { attempt_id, answers_json, tab_switches_count } = req.body;

    if (!attempt_id) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    const gradingResult = await submitStudentAttemptModel({
      attempt_id,
      answers_json: answers_json || {},
      tab_switches_count: Number(tab_switches_count) || 0,
    });

    return res.status(200).json({
      success: true,
      message: "Exam submitted and graded successfully!",
      data: gradingResult,
    });
  } catch (error) {
    console.error("Submit Exam Attempt Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit exam attempt.",
    });
  }
};

// =====================================================
// GET SUBMISSIONS BY EXAM ID
// =====================================================
export const getExamSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await getSubmissionsByExamIdModel(id);

    return res.status(200).json({
      success: true,
      message: "Submissions fetched successfully.",
      data: submissions,
    });
  } catch (error) {
    console.error("Get Exam Submissions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch submissions.",
    });
  }
};

// =====================================================
// GET ATTEMPT DETAILS
// =====================================================
export const getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await getAttemptByIdModel(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error("Get Attempt Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch attempt details.",
    });
  }
};
