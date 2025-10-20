import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { sendResponse } from "../../src/utils/responseHelper.js";

// Helper to build full profilePic URL
const buildFileUrl = (req, filePath) => filePath ? `${req.protocol}://${req.get("host")}/${filePath}` : null;

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { role: "user" }, 
      attributes: { exclude: ["password"] } 
    });

    const formatted = users.map(u => ({
      ...u.toJSON(),
      profilePic: buildFileUrl(req, u.profilePic),
    }));

    return sendResponse(res, true, "Users fetched successfully", formatted);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ["password"] } });
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    const formatted = {
      ...user.toJSON(),
      profilePic: buildFileUrl(req, user.profilePic),
    };

    return sendResponse(res, true, "User fetched successfully", formatted);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, mobile, password, profilePic } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (profilePic) user.profilePic = profilePic; // Optionally handle file upload separately

    await user.save();

    const formatted = {
      ...user.toJSON(),
      profilePic: buildFileUrl(req, user.profilePic),
    };

    return sendResponse(res, true, "User updated successfully", formatted);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendResponse(res, false, "User not found", null, 404);

    await user.destroy();
    return sendResponse(res, true, "User deleted successfully", null);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};
