// src/routes/admin/adminUserRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../controllers/admin/adminUserController.js";

import { authenticate, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes: only authenticated admins
router.use(authenticate, adminOnly);

// Get all users
router.get("/", getAllUsers);

// Get single user by ID
router.get("/:id", getUserById);

// Update user by ID
router.put("/:id", updateUser);

// Delete user by ID
router.delete("/:id", deleteUser);

export default router;
