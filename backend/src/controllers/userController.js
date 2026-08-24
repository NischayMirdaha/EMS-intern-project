import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../config/database.js";
import {
  createRegistrationOtp,
  createForgotPasswordOtp,
  createUser,
  findUserByEmail,
  updatePendingUser,
  verifyForgotPasswordOtp,
  verifyPassword,
  verifyRegistrationOtp as verifyRegistrationOtpFromModel,
  resetPassword as resetPasswordFromModel,
} from "../models/usermodel.js";
import {
  isEmailConfigured,
  sendForgotPasswordOtpEmail,
  sendRegistrationOtpEmail,
} from "../services/emailService.js";

const buildToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (user) => ({
  id: user?.id,
  username: user?.username,
  email: user?.email,
  role: user?.role,
  isVerified: user?.is_verified ?? user?.isVerified,
  createdAt: user?.created_at ?? user?.createdAt,
});

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, req.user.password);
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect current password.",
      });
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      RETURNING *
      `,
      [hashedPassword, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      user: sanitizeUser(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password change failed.",
      error: error.message,
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, adminSecret } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    let resolvedRole = "user";
    if (role && role !== "user") {
      if (
        process.env.ADMIN_REGISTRATION_SECRET &&
        adminSecret === process.env.ADMIN_REGISTRATION_SECRET
      ) {
        resolvedRole = role;
      } else {
        return res.status(403).json({
          success: false,
          message: "Only standard users can self-register without admin approval.",
        });
      }
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser?.isVerified) {
      return res.status(409).json({
        success: false,
        message: "Email already registered and verified.",
      });
    }

    const user = existingUser
      ? await updatePendingUser({
          username: normalizedUsername,
          email: normalizedEmail,
          password,
          role: resolvedRole,
        })
      : await createUser({
          username: normalizedUsername,
          email: normalizedEmail,
          password,
          role: resolvedRole,
        });

    const { otp, expiresAt } = await createRegistrationOtp(user.id);

    if (isEmailConfigured()) {
      await sendRegistrationOtpEmail({
        email: user.email,
        username: user.username,
        otp,
      });
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured.");
    }

    return res.status(201).json({
      success: true,
      message: "Registration OTP sent. Verify your email to activate the account.",
      user: sanitizeUser(user),
      ...(isEmailConfigured() || process.env.NODE_ENV === "production"
        ? {}
        : { otp, expiresAt }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email with the registration OTP before logging in.",
      });
    }

    const token = buildToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await findUserByEmail(email);
    const response = {
      success: true,
      message: "If this email exists, a forgot password OTP has been sent.",
    };

    if (!user) {
      return res.status(200).json(response);
    }

    const { otp, expiresAt } = await createForgotPasswordOtp(user.id);

    if (isEmailConfigured()) {
      await sendForgotPasswordOtpEmail({
        email: user.email,
        username: user.username,
        otp,
      });
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured.");
    }

    if (!isEmailConfigured() && process.env.NODE_ENV !== "production") {
      response.otp = otp;
      response.expiresAt = expiresAt;
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Forgot password request failed.",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const user = await resetPasswordFromModel({ email, password });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset password OTP is not verified or has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset failed.",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) =>
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });

export const verifyOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit code.",
      });
    }

    let otpPurpose = "forgot-password";
    let user = await verifyForgotPasswordOtp({ email, otp });

    if (!user) {
      otpPurpose = "registration";
      user = await verifyRegistrationOtpFromModel({ email, otp });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    const response = {
      success: true,
      message: otpPurpose === "registration"
        ? "Registration verified successfully."
        : "OTP verified successfully.",
      user: sanitizeUser(user),
    };

    if (otpPurpose === "registration") {
      response.token = buildToken(user);
    }

    return res.status(200).json({
      ...response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "OTP verification failed.",
      error: error.message,
    });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit code.",
      });
    }

    const user = await verifyRegistrationOtpFromModel({ email, otp });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    const token = buildToken(user);

    return res.status(200).json({
      success: true,
      message: "Registration verified successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration OTP verification failed.",
      error: error.message,
    });
  }
};
