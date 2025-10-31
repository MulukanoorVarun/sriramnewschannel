import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import dotenv from "dotenv";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { transporter } from "../../src/config/mail.js";


dotenv.config();

// ✅ Register App User
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // 🧩 Validate required fields
    if (!name || !email || !mobile || !password) {
      return sendResponse(res, false, "All fields are required", null, 400);
    }

    // 🧩 Check for duplicates
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail)
      return sendResponse(res, false, "Email already exists", null, 400);

    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile)
      return sendResponse(res, false, "Mobile number already exists", null, 400);

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "user",
    });

    // 🧹 Clean output (hide password)
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    };

    return sendResponse(res, true, "User registered successfully", responseUser, 201);
  } catch (err) {
    console.error("❌ Register Error:", err);

    if (err.errors) {
      err.errors.forEach((e) => {
        console.error(`👉 Field: ${e.path} | Message: ${e.message} | Value: ${e.value}`);
      });
    }

    return sendResponse(res, false, "Failed to register user", err.message, 500);
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ where: { email } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return sendResponse(res, false, "Invalid credentials", null, 401);

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    // Optional: store refresh token in DB for later invalidation
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Calculate expiry timestamps
    // Access token expiry in milliseconds
    const accessTokenExpiresAt = Date.now() + 1 * 24 * 60 * 60 * 1000; // 7 days

    // Refresh token expiry in milliseconds
    const refreshTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days


    // 6. Send response
    return sendResponse(res, true, "Login successful", {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
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


export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // 1️⃣ Validate input
    if (!refreshToken)
      return sendResponse(res, false, "Refresh token is required", null, 400);

    // 2️⃣ Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return sendResponse(res, false, "Invalid or expired refresh token", null, 401);
    }

    // 3️⃣ Find user in DB and validate token match
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return sendResponse(res, false, "Refresh token mismatch or user not found", null, 401);
    }

    // 4️⃣ Generate new tokens
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    // 5️⃣ Rotate refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validate: false });

    // 6️⃣ Compute expiry timestamps
    const accessTokenExpiresAt = Date.now() + 1 * 24 * 60 * 60 * 1000; // 1 day
    const refreshTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // 7️⃣ Respond with new tokens
    return sendResponse(res, true, "Access token refreshed successfully", {
      accessToken: newAccessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt,
    });
  } catch (err) {
    console.error("❌ refreshAccessToken Error:", err);
    return sendResponse(res, false, "Failed to refresh access token", err.message, 500);
  }
};



