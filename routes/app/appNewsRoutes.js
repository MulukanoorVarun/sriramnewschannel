import express from "express";
import { authenticate, optionalAuthenticate, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getAllNews,
  getNewsById,
  toggleLike
} from "../../controllers/app/appNewsController.js";

const router = express.Router();

router.get("/", optionalAuthenticate, getAllNews);

// Get single news details by ID
router.get("/:id", optionalAuthenticate, getNewsById);
router.post("/toggle-like", authenticate, toggleLike);

export default router;
