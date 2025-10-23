import Category from "../../models/Category.js";
import { sendResponse } from "../../src/utils/responseHelper.js";
import { formatDate } from "../../src/utils/dateHelper.js";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
      return sendResponse(res, false, "Category name is required", null, 400);
    }

    const category = await Category.create({ name: name.trim() });
    return sendResponse(res, true, "Category created successfully", category, 201);
  } catch (err) {
    console.error("Create Category Error:", err.message);
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeDatabaseError") {
      return sendResponse(res, false, "Invalid input or missing required fields", null, 400);
    }
    return sendResponse(res, false, "Failed to create category. Please try again.", null, 500);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["createdAt", "DESC"]],
    });

    if (!categories || categories.length === 0)
      return sendResponse(res, false, "No categories found", []);

    // Format to DD MMM YYYY (e.g., "14 Oct 2025")
    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: formatDate(cat.createdAt),
      updatedAt: formatDate(cat.updatedAt),
    }));

    return sendResponse(res, true, "Categories fetched successfully", formatted);
  } catch (err) {
    console.error("Get All Categories Error:", err.message);
    return sendResponse(res, false, "Failed to fetch categories", null, 500);
  }
};


export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category)
      return sendResponse(res, false, "Category not found", null, 404);

    const formattedCategory = {
      id: category.id,
      name: category.name,
      createdAt: formatDate(category.createdAt),
      updatedAt: formatDate(category.updatedAt),
    };

    return sendResponse(res, true, "Category fetched successfully", formattedCategory);
  } catch (err) {
    return sendResponse(res, false, "Failed to fetch category details", null, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return sendResponse(res, false, "Category name is required", null, 400);
    }

    const category = await Category.findByPk(req.params.id);
    if (!category)
      return sendResponse(res, false, "Category not found", null, 404);

    category.name = name.trim();
    await category.save();

    return sendResponse(res, true, "Category updated successfully", category);
  } catch (err) {
    console.error("Update Category Error:", err.message);
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeDatabaseError") {
      return sendResponse(res, false, "Invalid input or missing required fields", null, 400);
    }
    return sendResponse(res, false, "Failed to update category. Please try again.", null, 500);
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
    console.error("Delete Category Error:", err.message);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return sendResponse(
        res,
        false,
        "Cannot delete this category because it is linked to other records.",
        null,
        400
      );
    }
    return sendResponse(res, false, "Failed to delete category. Please try again.", null, 500);
  }
};
