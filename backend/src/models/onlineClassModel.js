import pool from "../config/database.js";

const mapOnlineClass = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    className: row.class_name,
    section: row.section,
    subject: row.subject,
    teacherId: row.teacher_id,
    meetingUrl: row.meeting_url || null,
    classMode: row.meeting_url ? "external" : "livekit",
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const ensureOnlineClassesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS online_classes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      class_name VARCHAR(50) NOT NULL,
      section VARCHAR(20),
      subject VARCHAR(100) NOT NULL,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meeting_url TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Allow meetingUrl to be null for in-house WebRTC classes
  await pool.query(`
    ALTER TABLE online_classes ALTER COLUMN meeting_url DROP NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_online_classes_teacher_id ON online_classes(teacher_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_online_classes_class_section ON online_classes(class_name, section);
  `);
};

export const createOnlineClass = async ({
  title,
  description,
  className,
  section,
  subject,
  teacherId,
  meetingUrl,
  scheduledAt,
  durationMinutes,
  status,
}) => {
  const result = await pool.query(
    `
      INSERT INTO online_classes
        (title, description, class_name, section, subject, teacher_id, meeting_url, scheduled_at, duration_minutes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      title,
      description || null,
      className,
      section || null,
      subject,
      teacherId,
      meetingUrl,
      scheduledAt,
      durationMinutes,
      status || "scheduled",
    ]
  );

  return mapOnlineClass(result.rows[0]);
};

export const findOnlineClassById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM online_classes WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  return mapOnlineClass(result.rows[0]);
};

export const listOnlineClasses = async ({
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
      SELECT * FROM online_classes
      WHERE ${conditions.join(" AND ")}
      ORDER BY scheduled_at ASC
    `,
    values
  );

  return result.rows.map(mapOnlineClass);
};

export const updateOnlineClass = async (id, fields) => {
  const columnMap = {
    title: "title",
    description: "description",
    className: "class_name",
    section: "section",
    subject: "subject",
    meetingUrl: "meeting_url",
    scheduledAt: "scheduled_at",
    durationMinutes: "duration_minutes",
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
    return findOnlineClassById(id);
  }

  values.push(id);
  const result = await pool.query(
    `
      UPDATE online_classes
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length} AND deleted_at IS NULL
      RETURNING *
    `,
    values
  );

  return mapOnlineClass(result.rows[0]);
};

export const softDeleteOnlineClass = async (id) => {
  const result = await pool.query(
    `
      UPDATE online_classes
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `,
    [id]
  );

  return mapOnlineClass(result.rows[0]);
};
