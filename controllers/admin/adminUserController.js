import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { sendResponse } from "../../src/utils/responseHelper.js";
import fs from "fs";
import { buildFileUrl, getAbsoluteFilePath, deleteFileIfExists } from "../../src/utils/fileHelper.js";


// 🟡 Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { role: "user" },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (!rows || rows.length === 0) {
      return sendResponse(res, false, "No users found", [], 404);
    }

    const formatted = rows.map(u => ({
      ...u.toJSON(),
      profilePic: buildFileUrl(req, u.profilePic),
    }));

    const totalPages = Math.ceil(count / limit);

    return sendResponse(res, true, "Users fetched successfully", {
      totalRecords: count,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      users: formatted,
    });

  } catch (err) {
    console.error("Get All Users Error:", err);
    return sendResponse(res, false, "Failed to fetch users. Please try again later.", null, 500);
  }
};

// 🟢 Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ["password"] } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    return sendResponse(res, true, "User fetched successfully", {
      ...user.toJSON(),
      profilePic: buildFileUrl(req, user.profilePic),
    });

  } catch (err) {
    console.error("Get User By ID Error:", err);
    return sendResponse(res, false, "Failed to fetch user. Please try again later.", null, 500);
  }
};

// 🟢 Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    // Check for email uniqueness if updating
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email, id: { $ne: user.id } } });
      if (existingEmail) return sendResponse(res, false, "Email already exists", null, 400);
    }

    // Check for mobile uniqueness if updating
    if (mobile && mobile !== user.mobile) {
      const existingMobile = await User.findOne({ where: { mobile, id: { $ne: user.id } } });
      if (existingMobile) return sendResponse(res, false, "Mobile number already exists", null, 400);
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    if (password) user.password = await bcrypt.hash(password, 10);

    // Handle profile picture if uploaded via file
    if (req.file) {
      try {
        if (user.profilePic) {
          const oldPath = getAbsoluteFilePath(user.profilePic);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        user.profilePic = `uploads/users/${req.file.filename}`;
      } catch (fsErr) {
        console.warn("Failed to delete old profile picture:", fsErr.message);
      }
    }

    await user.save();

    return sendResponse(res, true, "User updated successfully", {
      ...user.toJSON(),
      profilePic: buildFileUrl(req, user.profilePic),
    });

  } catch (err) {
    console.error("Update User Error:", err);

    if (err.name === "SequelizeValidationError") {
      const messages = err.errors.map(e => e.message).join(", ");
      return sendResponse(res, false, `Validation error: ${messages}`, null, 400);
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err.errors[0].path;
      return sendResponse(res, false, `Duplicate value for field: ${field}`, null, 400);
    }

    return sendResponse(res, false, "Failed to update user. Please try again later.", null, 500);
  }
};

// 🔴 Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    // Delete profile picture if exists
    if (user.profilePic) {
      try {
        const filePath = getAbsoluteFilePath(user.profilePic);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (fsErr) {
        console.warn("Failed to delete profile picture:", fsErr.message);
      }
    }

    await user.destroy();
    return sendResponse(res, true, "User deleted successfully", null);

  } catch (err) {
    console.error("Delete User Error:", err);
    return sendResponse(res, false, "Failed to delete user. Please try again later.", null, 500);
  }
};
