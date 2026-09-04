import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/database.js";
import { isEmailConfigured, sendRegistrationOtpEmail } from "../services/emailService.js";

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

export const getSuperAdminCredentials = () => ({
  username: process.env.SUPER_ADMIN_USERNAME || "super_admin",
  email: process.env.SUPER_ADMIN_EMAIL || "manisharai1029@gmail.com",
  password: process.env.SUPER_ADMIN_PASSWORD || "admin123",
  role: "super_admin",
});

export const ensureSuperAdminUser = async () => {
  const adminCredentials = getSuperAdminCredentials();
  const existingAdmin = await findUserByEmail(adminCredentials.email);

  if (existingAdmin) {
    if (!existingAdmin.isVerified) {
      const result = await pool.query(
        `
          UPDATE users
          SET is_verified = TRUE,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [existingAdmin.id]
      );

      return mapUser(result.rows[0]);
    }

    return existingAdmin;
  }

  const newAdmin = await createUser({
    username: adminCredentials.username,
    email: adminCredentials.email,
    password: adminCredentials.password,
    role: adminCredentials.role,
  });

  const result = await pool.query(
    `
      UPDATE users
      SET is_verified = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [newAdmin.id]
  );

  return mapUser(result.rows[0]);
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      CONSTRAINT chk_role
      CHECK (role IN ('admin', 'school_admin', 'teacher', 'student','super_admin'))
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


export const listUsers = async () => {
  const result = await pool.query(`
    SELECT *
    FROM users
    ORDER BY id ASC
  `);

  return result.rows.map(mapUser);
};

export const updateUserByAdmin = async ({
  userId,
  username,
  email,
  password,
  role,
  isVerified,
}) => {
  const fields = [];
  const values = [];
  let index = 1;

  const addField = (column, value) => {
    if (value === undefined) {
      return;
    }

    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  };

  addField("username", username);
  addField("email", email ? email.toLowerCase() : undefined);

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    addField("password", hashedPassword);
  }

  addField("role", role);
  addField("is_verified", isVerified);
  fields.push(`updated_at = NOW()`);

  const result = await pool.query(
    `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `,
    [...values, userId]
  );

  return mapUser(result.rows[0]);
};

export const deleteUserByAdmin = async (userId) => {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
    `,
    [userId]
  );

  return result.rows[0];
};
export const createUser = async ({ username, email, password, role, className, section }) => {

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      INSERT INTO users (username, email, password, role, class_name, section, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING *
    `,
    [username, email.toLowerCase(), hashedPassword, role, className || null, section || null]
  );

  return mapUser(result.rows[0]);
};

export const updateUserClass = async (id, { className, section }) => {
  const result = await pool.query(
    `
      UPDATE users
      SET class_name = $1,
          section = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `,
    [className || null, section || null, id]
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
