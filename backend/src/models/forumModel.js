import pool from "../config/database.js";

// ─── Thread Mapper ───────────────────────────────────────────────
const mapThread = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    className: row.class_name,
    section: row.section,
    subject: row.subject,
    authorId: row.author_id,
    authorName: row.author_name,     // joined from users
    authorRole: row.author_role,     // joined from users
    isPinned: row.is_pinned,
    isLocked: row.is_locked,
    replyCount: row.reply_count != null ? Number(row.reply_count) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── Reply Mapper ────────────────────────────────────────────────
const mapReply = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    threadId: row.thread_id,
    body: row.body,
    authorId: row.author_id,
    authorName: row.author_name,     // joined from users
    authorRole: row.author_role,     // joined from users
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── Table Setup ─────────────────────────────────────────────────
export const ensureForumTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forum_threads (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      class_name VARCHAR(50),
      section VARCHAR(20),
      subject VARCHAR(100),
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS forum_replies (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_forum_threads_class ON forum_threads(class_name, section);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);
  `);
};

// ─── Thread CRUD ─────────────────────────────────────────────────
export const createThread = async ({
  title,
  body,
  className,
  section,
  subject,
  authorId,
}) => {
  const result = await pool.query(
    `
      INSERT INTO forum_threads (title, body, class_name, section, subject, author_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *,
        (SELECT username FROM users WHERE id = $6) AS author_name,
        (SELECT role FROM users WHERE id = $6) AS author_role,
        0 AS reply_count
    `,
    [title, body, className || null, section || null, subject || null, authorId]
  );

  return mapThread(result.rows[0]);
};

export const findThreadById = async (id) => {
  const result = await pool.query(
    `
      SELECT t.*,
        u.username AS author_name,
        u.role AS author_role,
        (SELECT COUNT(*) FROM forum_replies r WHERE r.thread_id = t.id AND r.deleted_at IS NULL) AS reply_count
      FROM forum_threads t
      JOIN users u ON u.id = t.author_id
      WHERE t.id = $1 AND t.deleted_at IS NULL
    `,
    [id]
  );

  return mapThread(result.rows[0]);
};

export const listThreads = async ({
  className,
  section,
  subject,
  authorId,
} = {}) => {
  const conditions = ["t.deleted_at IS NULL"];
  const values = [];

  if (className) {
    values.push(className);
    // Show threads that target this class OR are school-wide (class_name IS NULL)
    conditions.push(`(t.class_name = $${values.length} OR t.class_name IS NULL)`);
  }
  if (section) {
    values.push(section);
    conditions.push(`(t.section = $${values.length} OR t.section IS NULL)`);
  }
  if (subject) {
    values.push(subject);
    conditions.push(`t.subject = $${values.length}`);
  }
  if (authorId) {
    values.push(authorId);
    conditions.push(`t.author_id = $${values.length}`);
  }

  const result = await pool.query(
    `
      SELECT t.*,
        u.username AS author_name,
        u.role AS author_role,
        (SELECT COUNT(*) FROM forum_replies r WHERE r.thread_id = t.id AND r.deleted_at IS NULL) AS reply_count
      FROM forum_threads t
      JOIN users u ON u.id = t.author_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `,
    values
  );

  return result.rows.map(mapThread);
};

export const updateThread = async (id, fields) => {
  const columnMap = {
    title: "title",
    body: "body",
    className: "class_name",
    section: "section",
    subject: "subject",
    isPinned: "is_pinned",
    isLocked: "is_locked",
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
    return findThreadById(id);
  }

  values.push(id);
  await pool.query(
    `
      UPDATE forum_threads
      SET ${setClauses.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length} AND deleted_at IS NULL
    `,
    values
  );

  return findThreadById(id);
};

export const softDeleteThread = async (id) => {
  const result = await pool.query(
    `
      UPDATE forum_threads
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `,
    [id]
  );

  return mapThread(result.rows[0]);
};

// ─── Reply CRUD ──────────────────────────────────────────────────
export const createReply = async ({ threadId, body, authorId }) => {
  const result = await pool.query(
    `
      INSERT INTO forum_replies (thread_id, body, author_id)
      VALUES ($1, $2, $3)
      RETURNING *,
        (SELECT username FROM users WHERE id = $3) AS author_name,
        (SELECT role FROM users WHERE id = $3) AS author_role
    `,
    [threadId, body, authorId]
  );

  return mapReply(result.rows[0]);
};

export const listRepliesForThread = async (threadId) => {
  const result = await pool.query(
    `
      SELECT r.*,
        u.username AS author_name,
        u.role AS author_role
      FROM forum_replies r
      JOIN users u ON u.id = r.author_id
      WHERE r.thread_id = $1 AND r.deleted_at IS NULL
      ORDER BY r.created_at ASC
    `,
    [threadId]
  );

  return result.rows.map(mapReply);
};

export const findReplyById = async (id) => {
  const result = await pool.query(
    `
      SELECT r.*,
        u.username AS author_name,
        u.role AS author_role
      FROM forum_replies r
      JOIN users u ON u.id = r.author_id
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `,
    [id]
  );

  return mapReply(result.rows[0]);
};

export const updateReply = async (id, body) => {
  await pool.query(
    `
      UPDATE forum_replies
      SET body = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
    `,
    [body, id]
  );

  return findReplyById(id);
};

export const softDeleteReply = async (id) => {
  const result = await pool.query(
    `
      UPDATE forum_replies
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `,
    [id]
  );

  return mapReply(result.rows[0]);
};
