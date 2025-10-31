import User from "../../models/User.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import fs from "fs";
import path from "path";
import { buildFileUrl, deleteFileIfExists } from "../../src/utils/fileHelper.js";



// ✅ Get Profile Details

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "mobile", "role", "profilePic", "createdAt", "updatedAt"],
    });

    if (!user) return sendResponse(res, false, "User not found", null, 404);

    const data = user.toJSON();
    data.profilePic = buildFileUrl(req, data.profilePic);

    return sendResponse(res, true, "Profile fetched successfully", data);
  } catch (err) {
    console.error("❌ getProfile Error:", err);
    return sendResponse(res, false, "Error fetching profile", err.message, 500);
  }
};

// ✅ Update Profile

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, mobile, email } = req.body;

    if (!userId)
      return sendResponse(res, false, "Unauthorized", null, 401);

    const user = await User.findByPk(userId);
    if (!user)
      return sendResponse(res, false, "User not found", null, 404);

    // ✅ Check for duplicate email (if updated)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists)
        return sendResponse(res, false, "Email already in use", null, 400);

      user.email = email;
    }

    // ✅ Check for duplicate mobile (if updated)
    if (mobile && mobile !== user.mobile) {
      const mobileExists = await User.findOne({ where: { mobile } });
      if (mobileExists)
        return sendResponse(res, false, "Mobile number already in use", null, 400);

      user.mobile = mobile;
    }

    // ✅ Handle profile picture upload (if provided)
    if (req.file) {
      const newPath = req.file.path.replace(/\\/g, "/");

      // Safely delete old file using helper
      if (user.profilePic) {
        deleteFileIfExists(user.profilePic);
      }

      user.profilePic = newPath;
    }

    // ✅ Update name (if provided)
    if (name) user.name = name;

    // ✅ Save updates safely (skip revalidation of unchanged fields)
    await user.save({ validate: false });

    // ✅ Prepare response with file URL
    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      profilePic: buildFileUrl(req, user.profilePic),
    };

    return sendResponse(res, true, "Profile updated successfully", updatedUser);
  } catch (err) {
    console.error("❌ updateProfile Error:", err);
    if (err.errors) {
      err.errors.forEach((e) =>
        console.error("👉", e.message, e.path, e.value)
      );
    }
    return sendResponse(res, false, "Error updating profile", err.message, 500);
  }
};


    