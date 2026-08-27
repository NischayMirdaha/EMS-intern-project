import pool from "../config/database.js";

const mapMessage = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    message: row.message,
    createdAt: row.created_at,
  };
};

export const ensureClassChatTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_chat_messages (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES online_classes(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_class_chat_class_id ON class_chat_messages(class_id, created_at);
  `);
};

export const saveMessage = async ({ classId, senderId, message }) => {
  const result = await pool.query(
    `
      INSERT INTO class_chat_messages (class_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *,
        (SELECT username FROM users WHERE id = $2) AS sender_name,
        (SELECT role FROM users WHERE id = $2) AS sender_role
    `,
    [classId, senderId, message]
  );

  return mapMessage(result.rows[0]);
};

export const getMessagesByClassId = async (classId, { limit = 50, before } = {}) => {
  const conditions = ["cm.class_id = $1"];
  const values = [classId];

  if (before) {
    values.push(before);
    conditions.push(`cm.created_at < $${values.length}`);
  }

  values.push(limit);
  const result = await pool.query(
    `
      SELECT cm.*,
        u.username AS sender_name,
        u.role AS sender_role
      FROM class_chat_messages cm
      JOIN users u ON u.id = cm.sender_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY cm.created_at DESC
      LIMIT $${values.length}
    `,
    values
  );

  // Return in chronological order (oldest first)
  return result.rows.reverse().map(mapMessage);
};
