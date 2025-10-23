import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { sendResponse } from "../../src/utils/responseHelper.js";

// ✅ Add new staff (only admin can create)
export const addStaff = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return sendResponse(res, false, "All fields (name, email, mobile, password) are required", null, 400);
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return sendResponse(res, false, "Email already exists", null, 400);

    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile) return sendResponse(res, false, "Mobile number already exists", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, mobile, password: hashedPassword, role: "staff" });

    return sendResponse(res, true, "Staff added successfully", {}, 201);
  } catch (err) {
    console.error("Add Staff Error:", err);

    if (err.name === "SequelizeValidationError") {
      const messages = err.errors.map(e => e.message).join(", ");
      return sendResponse(res, false, `Validation error: ${messages}`, null, 400);
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err.errors[0].path;
      return sendResponse(res, false, `Duplicate value for field: ${field}`, null, 400);
    }

    return sendResponse(res, false, "Failed to add staff. Please try again later.", null, 500);
  }
};


// ✅ Get all staff
export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: "staff" },
      attributes: { exclude: ["password"] },
    });

    if (!staff || staff.length === 0) {
      return sendResponse(res, false, "No staff members found", [], 404);
    }

    return sendResponse(res, true, "Staff fetched successfully", staff);
  } catch (err) {
    console.error("Get All Staff Error:", err.message);
    return sendResponse(res, false, "Failed to fetch staff. Please try again later.", null, 500);
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
    console.error("Get Staff By ID Error:", err.message);
    return sendResponse(res, false, "Failed to fetch staff details. Please try again later.", null, 500);
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, password } = req.body;

    const user = await User.findByPk(id);
    if (!user || user.role !== "staff") {
      return sendResponse(res, false, "Staff not found", null, 404);
    }

    // Check for email uniqueness if updating email
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email, id: { $ne: id } } });
      if (existingEmail) return sendResponse(res, false, "Email already exists", null, 400);
    }

    // Check for mobile uniqueness if updating mobile
    if (mobile && mobile !== user.mobile) {
      const existingMobile = await User.findOne({ where: { mobile, id: { $ne: id } } });
      if (existingMobile) return sendResponse(res, false, "Mobile number already exists", null, 400);
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    return sendResponse(res, true, "Staff updated successfully", {});
  } catch (err) {
    console.error("Update Staff Error:", err);

    if (err.name === "SequelizeValidationError") {
      const messages = err.errors.map(e => e.message).join(", ");
      return sendResponse(res, false, `Validation error: ${messages}`, null, 400);
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err.errors[0].path;
      return sendResponse(res, false, `Duplicate value for field: ${field}`, null, 400);
    }

    return sendResponse(res, false, "Failed to update staff. Please try again later.", null, 500);
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
    console.error("Delete Staff Error:", err.message);

    if (err.name === "SequelizeForeignKeyConstraintError") {
      return sendResponse(
        res,
        false,
        "Cannot delete this staff member because it is linked to other records.",
        null,
        400
      );
    }

    return sendResponse(res, false, "Failed to delete staff. Please try again later.", null, 500);
  }
};
