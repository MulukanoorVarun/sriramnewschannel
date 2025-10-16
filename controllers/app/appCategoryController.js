// src/controllers/app/appCategoryController.js
import Category from "../../models/Category.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
/**
 * Get all categories for the app
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
  return sendResponse(res, true, "Categories fetched successfully", categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
