import bcrypt from "bcrypt";
import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { transporter } from "../../src/config/mail.js";

// ✅ Step 1: Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return sendResponse(res, false, "Email is required", null, 400);

    const user = await User.findOne({ where: { email } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 min

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save({ validate: false });

    // Send mail
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Password Reset OTP - SriRam News",
      html: `<h3>Your OTP for password reset is:</h3>
             <h2>${otp}</h2>
             <p>This OTP will expire in 10 minutes.</p>`,
    });

    return sendResponse(res, true, "OTP sent successfully to your email", null);
  } catch (err) {
    console.error("❌ sendOtp Error:", err);
    return sendResponse(res, false, "Failed to send OTP", err.message, 500);
  }
};

// ✅ Step 2: Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return sendResponse(res, false, "Email and OTP are required", null, 400);

    const user = await User.findOne({ where: { email } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    if (!user.otp || user.otp !== otp)
      return sendResponse(res, false, "Invalid OTP", null, 400);

    if (new Date() > new Date(user.otpExpiresAt))
      return sendResponse(res, false, "OTP expired", null, 400);

    // Mark verified by clearing OTP
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save({ validate: false });

    return sendResponse(res, true, "OTP verified successfully", { email });
  } catch (err) {
    console.error("❌ verifyOtp Error:", err);
    return sendResponse(res, false, "OTP verification failed", err.message, 500);
  }
};

// ✅ Step 3: Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)
      return sendResponse(res, false, "Email and new password are required", null, 400);

    const user = await User.findOne({ where: { email } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save({ validate: false });

    return sendResponse(res, true, "Password reset successfully", null);
  } catch (err) {
    console.error("❌ resetPassword Error:", err);
    return sendResponse(res, false, "Failed to reset password", err.message, 500);
  }
};
