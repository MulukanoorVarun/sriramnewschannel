import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { sendResponse } from "../../src/utils/responseHelper.js";

// ✅ Add new staff (only admin can create)
export const addStaff = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password)
      return sendResponse(res, false, "All fields are required", null, 400);

    const existing = await User.findOne({ where: { email } });
    if (existing) return sendResponse(res, false, "Email already exists", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, mobile, password: hashedPassword, role: "staff" });

    return sendResponse(res, true, "Staff added successfully", user, 201);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Get all staff
export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: "staff" },
      attributes: { exclude: ["password"] },
    });
    return sendResponse(res, true, "Staff fetched successfully", staff);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Update staff
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, password } = req.body;

    const user = await User.findByPk(id);
    if (!user || user.role !== "staff") return sendResponse(res, false, "Staff not found", null, 404);

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    return sendResponse(res, true, "Staff updated successfully", user);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

// ✅ Delete staff
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user || user.role !== "staff") return sendResponse(res, false, "Staff not found", null, 404);

    await user.destroy();
    return sendResponse(res, true, "Staff deleted successfully", null);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};


// ✅ Get single staff by ID
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: { exclude: ["password"] } });

    if (!user || user.role !== "staff") {
      return sendResponse(res, false, "Staff not found", null, 404);
    }

    return sendResponse(res, true, "Staff fetched successfully", user);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};
