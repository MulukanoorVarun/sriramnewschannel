import Category from "../../models/Category.js";
import { sendResponse } from "../../src/utils/responseHelper.js";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    return sendResponse(res, true, "Category created successfully", category, 201);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    return sendResponse(res, true, "Categories fetched successfully", categories);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category)
      return sendResponse(res, false, "Category not found", null, 404);

    return sendResponse(res, true, "Category fetched successfully", category);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category)
      return sendResponse(res, false, "Category not found", null, 404);

    category.name = name;
    await category.save();
    return sendResponse(res, true, "Category updated successfully", category);
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category)
      return sendResponse(res, false, "Category not found", null, 404);

    await category.destroy();
    return sendResponse(res, true, "Category deleted successfully");
  } catch (err) {
    return sendResponse(res, false, err.message, null, 500);
  }
};
