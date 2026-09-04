import nodemailer from "nodemailer";

const getEmailConfig = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || process.env.EMAIL_SECURE || "false").toLowerCase() === "true";

  return { user, pass, host, port, secure };
};

const createTransporter = () => {
  const { user, pass, host, port, secure } = getEmailConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const isEmailConfigured = () => {
  const { user, pass } = getEmailConfig();
  return Boolean(user && pass);
};

const requireEmailConfiguration = () => {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS."
    );
  }
};

export const sendRegistrationOtpEmail = async ({ email, username, otp }) => {
  requireEmailConfiguration();

  const transporter = createTransporter();
  await transporter.verify();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    to: email,
    subject: "Verify your EduVerse account",
    text: [
      `Hello ${username},`,
      "",
      `Your EduVerse verification code is ${otp}.`,
      "It expires in 10 minutes.",
      "",
      `Email: ${email}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Verify your EduVerse account</h2>
        <p>Hello ${username},</p>
        <p>Your verification code is shown below. It expires in 10 minutes.</p>
        <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; font-size: 24px; letter-spacing: 4px; font-weight: 700; text-align: center;">
          ${otp}
        </div>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Username:</strong> ${username}</li>
        </ul>
      </div>
    `,
  });
};

export const sendForgotPasswordOtpEmail = async ({ email, username, otp }) => {
  requireEmailConfiguration();

  const transporter = createTransporter();
  await transporter.verify();

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    to: email,
    subject: "EduVerse forgot password OTP",
    text: `Hello ${username}, your forgot password OTP is ${otp}. It expires in 10 minutes.`,
  });
};
