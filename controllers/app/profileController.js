import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000"; // use your deployed URL

// ✅ Get Profile Details
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "mobile", "role", "profilePic", "createdAt", "updatedAt"],
    });

    if (!user) return sendResponse(res, false, "User not found", null, 404);

    // ✅ Convert relative profilePic to full URL if exists
    const userData = user.toJSON();
    if (userData.profilePic) {
      userData.profilePic = `${BASE_URL}/${userData.profilePic}`;
    }

    return sendResponse(res, true, "Profile fetched successfully", userData);
  } catch (err) {
    console.error("❌ getProfile Error:", err);
    return sendResponse(res, false, "Error fetching profile", err.message, 500);
  }
};

// ✅ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mobile } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    // ✅ Handle profilePic upload if provided
    if (req.file) {
      const uploadPath = req.file.path.replace(/\\/g, "/");

      // Delete old file if exists
      if (user.profilePic && fs.existsSync(user.profilePic)) {
        fs.unlinkSync(user.profilePic);
      }

      user.profilePic = uploadPath;
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;

    await user.save();

    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      profilePic: user.profilePic ? `${BASE_URL}/${user.profilePic}` : null,
    };

    return sendResponse(res, true, "Profile updated successfully", updatedUser);
  } catch (err) {
    console.error("❌ updateProfile Error:", err);
    return sendResponse(res, false, "Error updating profile", err.message, 500);
  }
};
    