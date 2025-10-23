import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import dotenv from "dotenv";
import { sendResponse } from "../../src/utils/responseHelper.js"; // ✅ make sure you import this

dotenv.config();

// ✅ Admin / Staff Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find admin or staff by email and role
    const admin = await User.findOne({
      where: { email, role: ["admin", "staff"] },
    });

    if (!admin) return sendResponse(res, false, "Admin/Staff not found", null, 404);

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return sendResponse(res, false, "Invalid credentials", null, 401);

    // 3️⃣ Generate Access Token
    const accessToken = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    // 4️⃣ Generate Refresh Token
    const refreshToken = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    // 5️⃣ Store refresh token in DB
    admin.refreshToken = refreshToken;
    await admin.save();

    // 6️⃣ Calculate token expiry timestamps
    const accessTokenExpiresAt =
      Date.now() + 1 * 24 * 60 * 60 * 1000; // 1 day
    const refreshTokenExpiresAt =
      Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // 7️⃣ Send response
    return sendResponse(res, true, "Admin login successful", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    });
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, err.message, null, 500);
  }
};
