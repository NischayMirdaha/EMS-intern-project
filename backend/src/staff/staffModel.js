import pool from "../config/database.js";
import { isStaffRole, sanitizeStaff } from "./staffUtils.js";

const mapStaffRow = (row) => {
  if (!row) {
    return null;
  }

  return sanitizeStaff({
    user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      role: row.role,
      isVerified: row.is_verified,
      createdAt: row.user_created_at,
      updatedAt: row.user_updated_at,
    },
    profile: {
      department: row.department,
      position: row.position,
      phone: row.phone,
      is_active: row.is_active,
      updated_at: row.staff_updated_at,
    },
  });
};

export const ensureStaffTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      department VARCHAR(100),
      position VARCHAR(100),
      phone VARCHAR(30),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const findStaffByUserId = async (userId) => {
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
        sp.department,
        sp.position,
        sp.phone,
        sp.is_active,
        sp.updated_at AS staff_updated_at
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1
        AND u.role = ANY(ARRAY['teacher','accountant','librarian','administrator','admin'])
    `,
    [userId]
  );

  return mapStaffRow(result.rows[0]);
};

export const listStaff = async () => {
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
        sp.department,
        sp.position,
        sp.phone,
        sp.is_active,
        sp.updated_at AS staff_updated_at
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.role = ANY(ARRAY['teacher','accountant','librarian','administrator','admin'])
      ORDER BY u.id ASC
    `
  );

  return result.rows.map(mapStaffRow);
};

export const createOrUpdateStaffProfile = async ({ userId, department, position, phone, isActive = true }) => {
  const result = await pool.query(
    `
      INSERT INTO staff_profiles (user_id, department, position, phone, is_active, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        phone = EXCLUDED.phone,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
    `,
    [userId, department ?? null, position ?? null, phone ?? null, isActive]
  );

  return result.rows[0];
};

export const updateStaffRole = async ({ userId, role }) => {
  if (!isStaffRole(role)) {
    throw new Error("Unsupported staff role.");
  }

  const result = await pool.query(
    `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `,
    [role, userId]
  );

  return result.rows[0];
};

export const toggleStaffStatus = async ({ userId, isActive }) => {
  const result = await pool.query(
    `
      UPDATE staff_profiles
      SET is_active = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING user_id
    `,
    [isActive, userId]
  );

  return result.rows[0];
};
