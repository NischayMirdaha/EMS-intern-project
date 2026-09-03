import pool from "../config/database.js";
import { ASSIGNMENT_STATUS } from "../constants/assignmentStatus.js";

const mapAssignment = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    // Free-text for now (see note in usermodel.js). Should become a
    // class_id / subject_id foreign key once a Class/Subject module exists.
    className: row.class_name,
    section: row.section,
    subject: row.subject,
    teacherId: row.teacher_id,
    dueDate: row.due_date,
    maxMarks: row.max_marks,
    attachmentUrl: row.attachment_url,
    attachmentOriginalName: row.attachment_original_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const ensureAssignmentsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      class_name VARCHAR(50) NOT NULL,
      section VARCHAR(20),
      subject VARCHAR(100) NOT NULL,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      due_date TIMESTAMPTZ NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 100,
      attachment_url TEXT,
      status VARCHAR(20) NOT NULL DEFAULT '${ASSIGNMENT_STATUS.PUBLISHED}',
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Every list query filters by class/section/subject/teacher and excludes
  // soft-deleted rows, so index the columns that matter most.
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_assignments_class_section ON assignments(class_name, section);
  `);

  // Added for file-upload support: the disk filename is a UUID for
  // collision/traversal safety, but downloads should show the user their
  // original filename ("Algebra Worksheet.pdf"), not the UUID.
  await pool.query(`
    ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS attachment_original_name VARCHAR(255)
  `);
};

export const createAssignment = async ({
  title,
  description,
  className,
  section,
  subject,
  teacherId,
  dueDate,
  maxMarks,
  attachmentUrl,
  attachmentOriginalName,
  status,
}) => {
  const result = await pool.query(
    `
      INSERT INTO assignments
        (title, description, class_name, section, subject, teacher_id, due_date, max_marks, attachment_url, attachment_original_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      title,
      description || null,
      className,
      section || null,
      subject,
      teacherId,
      dueDate,
      maxMarks,
      attachmentUrl || null,
      attachmentOriginalName || null,
      status,
    ]
  );

  return mapAssignment(result.rows[0]);
};



export const findAssignmentsByTeacher = async (teacherId) => {
  const result = await pool.query(
    `
      SELECT *
      FROM assignments
      WHERE teacher_id = $1
      ORDER BY created_at DESC
    `,
    [teacherId]
  );

  return result.rows;

};

export const findAssignmentById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM assignments WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  return mapAssignment(result.rows[0]);
};

// Single flexible list query used by teachers, students, and admins alike —
// the controller decides which filters to pass in based on req.user.role.
export const listAssignments = async ({
  teacherId,
  className,
  section,
  subject,
  status,
} = {}) => {
  const conditions = ["deleted_at IS NULL"];
  const values = [];

  if (teacherId) {
    values.push(teacherId);
    conditions.push(`teacher_id = $${values.length}`);
  }
  if (className) {
    values.push(className);
    conditions.push(`class_name = $${values.length}`);
  }
  if (section) {
    values.push(section);
    conditions.push(`section = $${values.length}`);
  }
  if (subject) {
    values.push(subject);
    conditions.push(`subject = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const result = await pool.query(
    `
      SELECT * FROM assignments
      WHERE ${conditions.join(" AND ")}
      ORDER BY due_date ASC
    `,
    values
  );

  return result.rows.map(mapAssignment);
};

export const updateAssignment = async (id, fields) => {
  const columnMap = {
    title: "title",
    description: "description",
    className: "class_name",
    section: "section",
    subject: "subject",
    dueDate: "due_date",
    maxMarks: "max_marks",
    attachmentUrl: "attachment_url",
    attachmentOriginalName: "attachment_original_name",
    status: "status",
  };

  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      setClauses.push(`${column} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return findAssignmentById(id);
  }

  values.push(id);
  const result = await pool.query(
    `
      UPDATE assignments
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length} AND deleted_at IS NULL
      RETURNING *
    `,
    values
  );

  return mapAssignment(result.rows[0]);
};

// Soft delete: keeps the row (and any student submissions/grades attached
// to it) for record-keeping instead of destroying history.
export const softDeleteAssignment = async (id) => {
  const result = await pool.query(
    `
      UPDATE assignments
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *

    `,
    [id]
  );
  return result.rows[0];
};



export const deleteAssignment = async ({id, teacherId}) => {
  const result = await pool.query(
    `
      DELETE FROM assignments
      WHERE id = $1
        AND teacher_id = $2
      RETURNING *
    `,
    [id, teacherId]
  );

  return result.rows[0];
};

