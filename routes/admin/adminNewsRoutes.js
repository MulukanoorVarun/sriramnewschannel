import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} from "../../controllers/admin/adminNewsController.js";

import { authenticate, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();

// 🧩 Create uploads folder dynamically if not exists
const uploadDir = "uploads/news";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

// ✅ Multer filter (only allow images/videos)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg","image/webp", "video/mp4", "video/mkv"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and MP4/MKV are allowed."));
  }
};

const upload = multer({ storage, fileFilter });

// 🔐 Protect all admin routes
router.use(authenticate, adminOnly);

// 📤 Create News (accepts image + video via form-data)
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createNews
);

// 📥 Get all news
router.get("/", getAllNews);

// 📄 Get single news by ID
router.get("/:id", getNewsById);

// ✏️ Update News (accepts image + video)
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateNews
);

// ❌ Delete News
router.delete("/:id", deleteNews);

export default router;
