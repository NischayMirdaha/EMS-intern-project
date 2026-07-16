import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/database.js";

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    role: row.role,
    className: row.class_name || null,
    section: row.section || null,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const ensureUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS forgot_password_otp_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS forgot_password_otp_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS forgot_password_verified_at TIMESTAMPTZ
  `);
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS registration_otp_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS registration_otp_expires_at TIMESTAMPTZ
  `);

  // class_name and section are used by the assignment module to scope
  // which assignments a student can see / submit to.
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS class_name VARCHAR(50),
    ADD COLUMN IF NOT EXISTS section VARCHAR(20)
  `);
};

export const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  return mapUser(result.rows[0]);
};

export const findUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

  return mapUser(result.rows[0]);
};

export const createUser = async ({ username, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      INSERT INTO users (username, email, password, role, is_verified)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING *
    `,
    [username, email.toLowerCase(), hashedPassword, role]
  );

  return mapUser(result.rows[0]);
};

export const updatePendingUser = async ({ username, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      UPDATE users
      SET username = $1,
          email = $2,
          password = $3,
          role = $4,
          is_verified = FALSE,
          registration_otp_hash = NULL,
          registration_otp_expires_at = NULL,
          updated_at = NOW()
      WHERE email = $2
        AND COALESCE(is_verified, FALSE) = FALSE
      RETURNING *
    `,
    [username, email.toLowerCase(), hashedPassword, role]
  );

  return mapUser(result.rows[0]);
};

export const verifyPassword = (password, hashedPassword) =>
  bcrypt.compare(password, hashedPassword);

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

export const createRegistrationOtp = async (userId) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `
      UPDATE users
      SET registration_otp_hash = $1,
          registration_otp_expires_at = $2,
          is_verified = FALSE,
          updated_at = NOW()
      WHERE id = $3
    `,
    [otpHash, expiresAt, userId]
  );

  return { otp, expiresAt };
};

export const verifyRegistrationOtp = async ({ email, otp }) => {
  const result = await pool.query(
    `
      UPDATE users
      SET registration_otp_hash = NULL,
          registration_otp_expires_at = NULL,
          is_verified = TRUE,
          updated_at = NOW()
      WHERE email = $1
        AND registration_otp_hash = $2
        AND registration_otp_expires_at > NOW()
      RETURNING *
    `,
    [email.toLowerCase(), hashOtp(otp)]
  );

  return mapUser(result.rows[0]);
};

export const createForgotPasswordOtp = async (userId) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `
      UPDATE users
      SET forgot_password_otp_hash = $1,
          forgot_password_otp_expires_at = $2,
          forgot_password_verified_at = NULL,
          updated_at = NOW()
      WHERE id = $3
    `,
    [otpHash, expiresAt, userId]
  );

  return { otp, expiresAt };
};

export const verifyForgotPasswordOtp = async ({ email, otp }) => {
  const result = await pool.query(
    `
      UPDATE users
      SET forgot_password_otp_hash = NULL,
          forgot_password_otp_expires_at = NULL,
          forgot_password_verified_at = NOW(),
          updated_at = NOW()
      WHERE email = $1
        AND forgot_password_otp_hash = $2
        AND forgot_password_otp_expires_at > NOW()
      RETURNING *
    `,
    [email.toLowerCase(), hashOtp(otp)]
  );

  return mapUser(result.rows[0]);
};

export const resetPassword = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      UPDATE users
      SET password = $1,
          forgot_password_verified_at = NULL,
          updated_at = NOW()
      WHERE email = $2
        AND forgot_password_verified_at > NOW() - INTERVAL '10 minutes'
      RETURNING *
    `,
    [hashedPassword, email.toLowerCase()]
  );

  return mapUser(result.rows[0]);
};
