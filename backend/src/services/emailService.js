import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

export const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const requireEmailConfiguration = () => {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Set EMAIL_USER and EMAIL_PASS to send mail through Gmail."
    );
  }
};

export const sendRegistrationOtpEmail = async ({ email, username, otp }) => {
  requireEmailConfiguration();

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
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

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "EduVerse forgot password OTP",
    text: `Hello ${username}, your forgot password OTP is ${otp}. It expires in 10 minutes.`,
  });
};
