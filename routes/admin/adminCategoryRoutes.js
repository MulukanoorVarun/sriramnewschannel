import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../../controllers/admin/adminCategoryController.js";

import { authenticate, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate, adminOnly);

router.post("/", createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
