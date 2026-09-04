import pool from "../config/database.js";
import {
  sanitizeStudentProfile,
  sanitizeStudentDocument,
  sanitizeAcademicRecord,
  sanitizeHealthRecord,
  sanitizeDisciplinaryRecord,
  sanitizeScholarship,
  sanitizeAlumniProfile,
} from "./studentUtils.js";

const mapStudentRow = (row) => {
  if (!row) return null;

  return sanitizeStudentProfile({
    user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      is_verified: row.is_verified,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
    },
    profile: {
      id: row.student_id,
      admission_number: row.admission_number,
      enrollment_year: row.enrollment_year,
      major: row.major,
      date_of_birth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      guardian_name: row.guardian_name,
      guardian_phone: row.guardian_phone,
      status: row.status,
      is_alumni: row.is_alumni,
      created_at: row.student_created_at,
      updated_at: row.student_updated_at,
    },
  });
};

export const ensureStudentTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      admission_number VARCHAR(100) UNIQUE,
      enrollment_year INTEGER,
      major VARCHAR(150),
      date_of_birth DATE,
      gender VARCHAR(30),
      address TEXT,
      guardian_name VARCHAR(150),
      guardian_phone VARCHAR(30),
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      is_alumni BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_documents (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      document_type VARCHAR(100),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      file_url TEXT,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_academic_records (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      year INTEGER,
      term VARCHAR(50),
      course_code VARCHAR(50),
      course_name VARCHAR(200),
      grade VARCHAR(20),
      remarks TEXT,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_health_records (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      record_date DATE NOT NULL,
      health_condition TEXT,
      treatment TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_disciplinary_records (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      incident_date DATE NOT NULL,
      offense TEXT NOT NULL,
      action_taken TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_scholarships (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      scholarship_name VARCHAR(200) NOT NULL,
      amount NUMERIC(12,2),
      award_date DATE,
      status VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alumni_profiles (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
      graduation_year INTEGER,
      current_employer VARCHAR(200),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(30),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const createOrUpdateStudentProfile = async ({
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
}) => {
  const columns = ["user_id"];
  const placeholders = ["$1"];
  const values = [userId];
  let index = 2;
  const add = (column, value) => {
    if (value === undefined) return;
    columns.push(column);
    placeholders.push(`$${index}`);
    values.push(value);
    index += 1;
  };

  add("admission_number", admissionNumber ?? null);
  add("enrollment_year", enrollmentYear ?? null);
  add("major", major ?? null);
  add("date_of_birth", dateOfBirth ?? null);
  add("gender", gender ?? null);
  add("address", address ?? null);
  add("guardian_name", guardianName ?? null);
  add("guardian_phone", guardianPhone ?? null);
  add("status", status ?? null);
  add("is_alumni", isAlumni ?? null);

  const updateStatements = [];
  if (admissionNumber !== undefined) updateStatements.push("admission_number = EXCLUDED.admission_number");
  if (enrollmentYear !== undefined) updateStatements.push("enrollment_year = EXCLUDED.enrollment_year");
  if (major !== undefined) updateStatements.push("major = EXCLUDED.major");
  if (dateOfBirth !== undefined) updateStatements.push("date_of_birth = EXCLUDED.date_of_birth");
  if (gender !== undefined) updateStatements.push("gender = EXCLUDED.gender");
  if (address !== undefined) updateStatements.push("address = EXCLUDED.address");
  if (guardianName !== undefined) updateStatements.push("guardian_name = EXCLUDED.guardian_name");
  if (guardianPhone !== undefined) updateStatements.push("guardian_phone = EXCLUDED.guardian_phone");
  if (status !== undefined) updateStatements.push("status = EXCLUDED.status");
  if (isAlumni !== undefined) updateStatements.push("is_alumni = EXCLUDED.is_alumni");
  updateStatements.push("updated_at = NOW()");

  const result = await pool.query(
    `
      INSERT INTO student_profiles (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      ON CONFLICT (user_id)
      DO UPDATE SET ${updateStatements.join(", ")}
      RETURNING *
    `,
    values
  );

  return result.rows[0];
};

export const listStudents = async () => {
  const result = await pool.query(
    `
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.is_verified,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        sp.id AS student_id,
        sp.admission_number,
        sp.enrollment_year,
        sp.major,
        sp.date_of_birth,
        sp.gender,
        sp.address,
        sp.guardian_name,
        sp.guardian_phone,
        sp.status,
        sp.is_alumni,
        sp.created_at AS student_created_at,
        sp.updated_at AS student_updated_at
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      ORDER BY sp.id ASC
    `
  );

  return result.rows.map(mapStudentRow);
};

export const findStudentById = async (studentId) => {
  const result = await pool.query(
    `
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.is_verified,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        sp.id AS student_id,
        sp.admission_number,
        sp.enrollment_year,
        sp.major,
        sp.date_of_birth,
        sp.gender,
        sp.address,
        sp.guardian_name,
        sp.guardian_phone,
        sp.status,
        sp.is_alumni,
        sp.created_at AS student_created_at,
        sp.updated_at AS student_updated_at
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.id = $1
    `,
    [studentId]
  );

  return mapStudentRow(result.rows[0]);
};

export const findStudentByUserId = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.is_verified,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        sp.id AS student_id,
        sp.admission_number,
        sp.enrollment_year,
        sp.major,
        sp.date_of_birth,
        sp.gender,
        sp.address,
        sp.guardian_name,
        sp.guardian_phone,
        sp.status,
        sp.is_alumni,
        sp.created_at AS student_created_at,
        sp.updated_at AS student_updated_at
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE u.id = $1
    `,
    [userId]
  );

  return mapStudentRow(result.rows[0]);
};

export const createStudentDocument = async ({ studentId, documentType, title, description, fileUrl, uploadedBy }) => {
  const result = await pool.query(
    `
      INSERT INTO student_documents (student_id, document_type, title, description, file_url, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [studentId, documentType ?? null, title, description ?? null, fileUrl ?? null, uploadedBy ?? null]
  );

  return sanitizeStudentDocument(result.rows[0]);
};

export const listStudentDocuments = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_documents
      WHERE student_id = $1
      ORDER BY uploaded_at DESC
    `,
    [studentId]
  );

  return result.rows.map(sanitizeStudentDocument);
};

export const createAcademicRecord = async ({ studentId, year, term, courseCode, courseName, grade, remarks }) => {
  const result = await pool.query(
    `
      INSERT INTO student_academic_records (student_id, year, term, course_code, course_name, grade, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [studentId, year ?? null, term ?? null, courseCode ?? null, courseName ?? null, grade ?? null, remarks ?? null]
  );

  return sanitizeAcademicRecord(result.rows[0]);
};

export const listAcademicHistory = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_academic_records
      WHERE student_id = $1
      ORDER BY recorded_at DESC
    `,
    [studentId]
  );

  return result.rows.map(sanitizeAcademicRecord);
};

export const createHealthRecord = async ({ studentId, recordDate, healthCondition, treatment, notes, recordedBy }) => {
  const result = await pool.query(
    `
      INSERT INTO student_health_records (student_id, record_date, health_condition, treatment, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [studentId, recordDate, healthCondition ?? null, treatment ?? null, notes ?? null, recordedBy ?? null]
  );

  return sanitizeHealthRecord(result.rows[0]);
};

export const listHealthRecords = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_health_records
      WHERE student_id = $1
      ORDER BY record_date DESC, created_at DESC
    `,
    [studentId]
  );

  return result.rows.map(sanitizeHealthRecord);
};

export const createDisciplinaryRecord = async ({ studentId, incidentDate, offense, actionTaken, notes, recordedBy }) => {
  const result = await pool.query(
    `
      INSERT INTO student_disciplinary_records (student_id, incident_date, offense, action_taken, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [studentId, incidentDate, offense, actionTaken ?? null, notes ?? null, recordedBy ?? null]
  );

  return sanitizeDisciplinaryRecord(result.rows[0]);
};

export const listDisciplinaryRecords = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_disciplinary_records
      WHERE student_id = $1
      ORDER BY incident_date DESC, created_at DESC
    `,
    [studentId]
  );

  return result.rows.map(sanitizeDisciplinaryRecord);
};

export const createScholarship = async ({ studentId, scholarshipName, amount, awardDate, status, notes }) => {
  const result = await pool.query(
    `
      INSERT INTO student_scholarships (student_id, scholarship_name, amount, award_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [studentId, scholarshipName, amount ?? null, awardDate ?? null, status ?? null, notes ?? null]
  );

  return sanitizeScholarship(result.rows[0]);
};

export const listScholarships = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_scholarships
      WHERE student_id = $1
      ORDER BY award_date DESC, created_at DESC
    `,
    [studentId]
  );

  return result.rows.map(sanitizeScholarship);
};

export const createOrUpdateAlumniProfile = async ({ studentId, graduationYear, currentEmployer, contactEmail, contactPhone, notes }) => {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const insertResult = await pool.query(
    `
      INSERT INTO alumni_profiles (student_id, graduation_year, current_employer, contact_email, contact_phone, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (student_id)
      DO UPDATE SET
        graduation_year = EXCLUDED.graduation_year,
        current_employer = EXCLUDED.current_employer,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `,
    [studentId, graduationYear ?? null, currentEmployer ?? null, contactEmail ?? null, contactPhone ?? null, notes ?? null]
  );

  await pool.query(
    `
      UPDATE student_profiles
      SET is_alumni = TRUE,
          status = 'alumni',
          updated_at = NOW()
      WHERE id = $1
    `,
    [studentId]
  );

  return sanitizeAlumniProfile(insertResult.rows[0]);
};

export const getAlumniProfile = async (studentId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM alumni_profiles
      WHERE student_id = $1
    `,
    [studentId]
  );

  return sanitizeAlumniProfile(result.rows[0]);
};

export const listAlumni = async () => {
  const result = await pool.query(
    `
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.is_verified,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        sp.id AS student_id,
        sp.admission_number,
        sp.enrollment_year,
        sp.major,
        sp.date_of_birth,
        sp.gender,
        sp.address,
        sp.guardian_name,
        sp.guardian_phone,
        sp.status,
        sp.is_alumni,
        sp.created_at AS student_created_at,
        sp.updated_at AS student_updated_at,
        ap.id AS alumni_id,
        ap.graduation_year,
        ap.current_employer,
        ap.contact_email,
        ap.contact_phone,
        ap.notes AS alumni_notes,
        ap.created_at AS alumni_created_at,
        ap.updated_at AS alumni_updated_at
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN alumni_profiles ap ON ap.student_id = sp.id
      WHERE sp.is_alumni = TRUE OR sp.status = 'alumni'
      ORDER BY sp.id ASC
    `
  );

  return result.rows.map((row) => ({
    student: mapStudentRow(row),
    alumni: sanitizeAlumniProfile({
      id: row.alumni_id,
      student_id: row.student_id,
      graduation_year: row.graduation_year,
      current_employer: row.current_employer,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      notes: row.alumni_notes,
      created_at: row.alumni_created_at,
      updated_at: row.alumni_updated_at,
    }),
  }));
};
