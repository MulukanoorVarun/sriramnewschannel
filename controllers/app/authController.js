import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import dotenv from "dotenv";
import { sendResponse } from "../../src/utils/responseHelper.js";

dotenv.config();

// ✅ Register App User
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return sendResponse(res, false, "Email already exists", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    return sendResponse(res, true, "User registered successfully", user, 201);
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, err.message, null, 500);
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