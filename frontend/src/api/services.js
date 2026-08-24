import apiClient from "./apiClient";

// ==========================================
// Authentication APIs
// ==========================================
export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post("/users/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post("/users/register", userData);
    return response.data;
  },

  verifyRegistrationOtp: async ({ email, otp }) => {
    const response = await apiClient.post("/users/verify-registration-otp", { email, otp });
    return response.data;
  },

  verifyOtp: async ({ email, otp }) => {
    const response = await apiClient.post("/users/verify-otp", { email, otp });
    return response.data;
  },

  forgotPassword: async ({ email }) => {
    const response = await apiClient.post("/users/forgot-password", { email });
    return response.data;
  },

  resetPassword: async ({ email, password }) => {
    const response = await apiClient.post("/users/reset-password", { email, password });
    return response.data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await apiClient.post("/users/change-password", { currentPassword, newPassword });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },
};

// ==========================================
// Classes APIs (Including Section Aggregation)
// ==========================================
export const classApi = {
  getAllClasses: async () => {
    const response = await apiClient.get("/classes");
    return response.data;
  },

  getClassById: async (id) => {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
  },

  createClass: async (classData) => {
    const response = await apiClient.post("/classes", classData);
    return response.data;
  },

  updateClass: async (id, classData) => {
    const response = await apiClient.put(`/classes/${id}`, classData);
    return response.data;
  },

  deleteClass: async (id) => {
    const response = await apiClient.delete(`/classes/${id}`);
    return response.data;
  },

  getClassSections: async (id) => {
    const response = await apiClient.get(`/classes/${id}/sections`);
    return response.data;
  },
};

// ==========================================
// Sections APIs
// ==========================================
export const sectionApi = {
  getAllSections: async (classId = null) => {
    const url = classId ? `/sections?class_id=${classId}` : "/sections";
    const response = await apiClient.get(url);
    return response.data;
  },

  getSectionById: async (id) => {
    const response = await apiClient.get(`/sections/${id}`);
    return response.data;
  },

  createSection: async (sectionData) => {
    const response = await apiClient.post("/sections", sectionData);
    return response.data;
  },

  updateSection: async (id, sectionData) => {
    const response = await apiClient.put(`/sections/${id}`, sectionData);
    return response.data;
  },

  deleteSection: async (id) => {
    const response = await apiClient.delete(`/sections/${id}`);
    return response.data;
  },
};

// ==========================================
// Exams APIs
// ==========================================
export const examApi = {
  getAllExams: async () => {
    const response = await apiClient.get("/exams");
    return response.data;
  },

  getExamById: async (id) => {
    const response = await apiClient.get(`/exams/${id}`);
    return response.data;
  },

  createExam: async (examData) => {
    const response = await apiClient.post("/exams", examData);
    return response.data;
  },

  updateExam: async (id, examData) => {
    const response = await apiClient.put(`/exams/${id}`, examData);
    return response.data;
  },

  deleteExam: async (id) => {
    const response = await apiClient.delete(`/exams/${id}`);
    return response.data;
  },
};

// ==========================================
// Question Papers APIs
// ==========================================
export const questionPaperApi = {
  getAllQuestionPapers: async () => {
    const response = await apiClient.get("/question-papers");
    return response.data;
  },

  getQuestionPaperById: async (id) => {
    const response = await apiClient.get(`/question-papers/${id}`);
    return response.data;
  },

  createQuestionPaper: async (formData) => {
    const response = await apiClient.post("/question-papers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateQuestionPaper: async (id, formData) => {
    const response = await apiClient.put(`/question-papers/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteQuestionPaper: async (id) => {
    const response = await apiClient.delete(`/question-papers/${id}`);
    return response.data;
  },
};
