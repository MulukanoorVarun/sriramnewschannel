// routes/bookmarkRoutes.js
import express from "express";
import { toggleBookmark, getUserBookmarks } from "../../controllers/app/bookmarkController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Toggle bookmark for a news (authenticated user)
router.post("/toggle", authenticate, toggleBookmark);

// Get all bookmarks for the logged-in user
router.get("/get_bookmarks", authenticate, getUserBookmarks);

export default router;
