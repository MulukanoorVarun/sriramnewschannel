import express from "express";
import { authenticate, authorizeRoles } from "../../middleware/authMiddleware.js";
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from "../../controllers/admin/adminUserController.js";

const router = express.Router();

// ✅ All routes are admin protected
router.get("/", authenticate, authorizeRoles("admin"), getAllUsers); // Get all users
router.get("/:id", authenticate, authorizeRoles("admin"), getUserById); // Get single user
router.put("/:id", authenticate, authorizeRoles("admin"), updateUser); // Update user
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteUser); // Delete user

export default router;
