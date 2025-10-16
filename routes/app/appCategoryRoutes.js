import express from "express";
import { getAllCategories } from "../../controllers/app/appCategoryController.js";


const router = express.Router();

// App users can fetch categories without authentication (or you can add auth if needed)
router.get("/", getAllCategories);

export default router;
