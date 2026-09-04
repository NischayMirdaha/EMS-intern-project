import jwt from "jsonwebtoken";
import {
  createRegistrationOtp,
  createForgotPasswordOtp,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updatePendingUser,
  updateUserByAdmin as updateUserRecordByAdmin,
  deleteUserByAdmin as deleteUserRecordByAdmin,
  verifyForgotPasswordOtp,
  verifyPassword,
  verifyRegistrationOtp as verifyRegistrationOtpFromModel,
  resetPassword as resetPasswordFromModel,
  updateUserClass
} from "../models/usermodel.js";
import {
  isEmailConfigured,
  sendForgotPasswordOtpEmail,
  sendRegistrationOtpEmail,
} from "../services/emailService.js";
import { ROLES, VALID_ROLES } from "../constants/roles.js";

const buildToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, adminSecret } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified.",
      });
    }

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    let resolvedRole = ROLES.STUDENT; // Default role for self-registration
    if (role && role !== ROLES.STUDENT) {
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

export const listAllUsers = async (_req, res) => {
  try {
    const users = await listUsers();

    return res.status(200).json({
      success: true,
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
      error: error.message,
    });
  }
};

export const getUserByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid user id is required.",
      });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
      error: error.message,
    });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { username, email, password, role, isVerified } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid user id is required.",
      });
    }

    const updatedUser = await updateUserRecordByAdmin({
      userId,
      username,
      email,
      password,
      role,
      isVerified,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
      error: error.message,
    });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid user id is required.",
      });
    }

    if (req.user?.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const deletedUser = await deleteUserRecordByAdmin(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};

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


export const updateUserClassController = async (req, res) => {
  try {
    // If /:id/class is used, update that user.
    // Otherwise, update the currently logged-in user.
    const userId = req.params.id || req.user.id;

    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required.",
      });
    }

    const user = await updateUserClass(userId, classId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User class updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user class.",
      error: error.message,
    });
  }
};

