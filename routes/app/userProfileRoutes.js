import express from "express";
import { getProfile, updateProfile } from "../../controllers/app/profileController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/uploadMiddleware.js"; // ✅ using your shared multer config

const router = express.Router();

// ✅ Routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, upload.single("profilePic"), updateProfile);

export default router;
