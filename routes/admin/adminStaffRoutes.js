import express from "express";
import { authenticate, authorizeRoles } from "../../middleware/authMiddleware.js";
import { addStaff, getAllStaff, updateStaff, deleteStaff,getStaffById } from "../../controllers/admin/adminStaffController.js";

const router = express.Router();

// Only super_admin can manage staff/admin
router.post("/", authenticate, authorizeRoles("admin"), addStaff);
router.get("/", authenticate, authorizeRoles("admin"), getAllStaff);
router.get("/:id", authenticate, authorizeRoles("admin"), getStaffById);
router.put("/:id", authenticate, authorizeRoles("admin"), updateStaff);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteStaff);

export default router;
