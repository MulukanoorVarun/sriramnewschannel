import express from "express";
import { adminLogin } from "../../controllers/admin/adminAuthController.js";

const router = express.Router();

router.post("/login", adminLogin); // Admin login only

export default router;
