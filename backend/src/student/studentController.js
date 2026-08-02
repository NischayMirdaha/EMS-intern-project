import { findUserById } from "../models/usermodel.js";
import {
  createOrUpdateStudentProfile,
  findStudentById,
  findStudentByUserId,
  listStudents as listStudentProfiles,
  createStudentDocument,
  listStudentDocuments,
  createAcademicRecord,
  listAcademicHistory,
  createHealthRecord,
  listHealthRecords,
  createDisciplinaryRecord,
  listDisciplinaryRecords,
  createScholarship,
  listScholarships,
  createOrUpdateAlumniProfile as createOrUpdateAlumniProfileModel,
  listAlumni as listAlumniRecords,
} from "./studentModel.js";

const ensureAdminOrOwner = (req, student) => {
  if (!req.user) {
    return false;
  }

  const adminRoles = ["admin", "administrator"];
  if (adminRoles.includes(String(req.user.role).toLowerCase())) {
    return true;
  }

  return req.user.id === student.userId;
};

export const listStudents = async (_req, res) => {
  try {
    const students = await listStudentProfiles();

    return res.status(200).json({ success: true, students });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load students.", error: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const student = await findStudentById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    if (!ensureAdminOrOwner(req, student)) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this student profile." });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get student profile.", error: error.message });
  }
};

export const createStudentProfile = async (req, res) => {
  try {
    const { userId, admissionNumber, enrollmentYear, major, dateOfBirth, gender, address, guardianName, guardianPhone, status, isAlumni } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found for provided userId." });
    }

    const studentProfile = await createOrUpdateStudentProfile({
      userId,
      admissionNumber,
      enrollmentYear,
      major,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      status,
      isAlumni,
    });

    return res.status(201).json({ success: true, message: "Student profile created.", student: studentProfile });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create student profile.", error: error.message });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const existingStudent = await findStudentById(studentId);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const { admissionNumber, enrollmentYear, major, dateOfBirth, gender, address, guardianName, guardianPhone, status, isAlumni } = req.body;

    const updatedStudent = await createOrUpdateStudentProfile({
      userId: existingStudent.userId,
      admissionNumber,
      enrollmentYear,
      major,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      status,
      isAlumni,
    });

    return res.status(200).json({ success: true, message: "Student profile updated.", student: updatedStudent });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update student profile.", error: error.message });
  }
};

export const addStudentDocument = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { documentType, title, description, fileUrl } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: "Document title is required." });
    }

    const document = await createStudentDocument({
      studentId,
      documentType,
      title,
      description,
      fileUrl,
      uploadedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, message: "Document saved.", document });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save document.", error: error.message });
  }
};

export const listStudentDocuments = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const documents = await listStudentDocuments(studentId);
    return res.status(200).json({ success: true, documents });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load documents.", error: error.message });
  }
};

export const addAcademicRecord = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { year, term, courseCode, courseName, grade, remarks } = req.body;

    if (!courseName && !courseCode) {
      return res.status(400).json({ success: false, message: "Course code or course name is required." });
    }

    const record = await createAcademicRecord({
      studentId,
      year,
      term,
      courseCode,
      courseName,
      grade,
      remarks,
    });

    return res.status(201).json({ success: true, message: "Academic record saved.", record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save academic record.", error: error.message });
  }
};

export const listAcademicHistory = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const records = await listAcademicHistory(studentId);
    return res.status(200).json({ success: true, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load academic history.", error: error.message });
  }
};

export const addHealthRecord = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { recordDate, healthCondition, treatment, notes } = req.body;
    if (!recordDate) {
      return res.status(400).json({ success: false, message: "Record date is required." });
    }

    const record = await createHealthRecord({
      studentId,
      recordDate,
      healthCondition,
      treatment,
      notes,
      recordedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, message: "Health record saved.", record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save health record.", error: error.message });
  }
};

export const listHealthRecords = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const records = await listHealthRecords(studentId);
    return res.status(200).json({ success: true, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load health records.", error: error.message });
  }
};

export const addDisciplinaryRecord = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { incidentDate, offense, actionTaken, notes } = req.body;
    if (!incidentDate || !offense) {
      return res.status(400).json({ success: false, message: "Incident date and offense are required." });
    }

    const record = await createDisciplinaryRecord({
      studentId,
      incidentDate,
      offense,
      actionTaken,
      notes,
      recordedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, message: "Disciplinary record saved.", record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save disciplinary record.", error: error.message });
  }
};

export const listDisciplinaryRecords = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const records = await listDisciplinaryRecords(studentId);
    return res.status(200).json({ success: true, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load disciplinary records.", error: error.message });
  }
};

export const addScholarship = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { scholarshipName, amount, awardDate, status, notes } = req.body;
    if (!scholarshipName) {
      return res.status(400).json({ success: false, message: "Scholarship name is required." });
    }

    const scholarship = await createScholarship({
      studentId,
      scholarshipName,
      amount,
      awardDate,
      status,
      notes,
    });

    return res.status(201).json({ success: true, message: "Scholarship saved.", scholarship });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save scholarship.", error: error.message });
  }
};

export const listScholarships = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const scholarships = await listScholarships(studentId);
    return res.status(200).json({ success: true, scholarships });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load scholarships.", error: error.message });
  }
};

export const createOrUpdateAlumniProfile = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ success: false, message: "A valid student id is required." });
    }

    const { graduationYear, currentEmployer, contactEmail, contactPhone, notes } = req.body;
    const alumniRecord = await createOrUpdateAlumniProfileModel({
      studentId,
      graduationYear,
      currentEmployer,
      contactEmail,
      contactPhone,
      notes,
    });

    return res.status(200).json({ success: true, message: "Alumni profile saved.", alumni: alumniRecord });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save alumni profile.", error: error.message });
  }
};

export const listAlumni = async (_req, res) => {
  try {
    const alumni = await listAlumniRecords();
    return res.status(200).json({ success: true, alumni });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load alumni records.", error: error.message });
  }
};
