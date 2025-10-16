import express from "express";
import { register, login } from "../../controllers/app/authController.js";

const router = express.Router();

router.post("/register", register); // App user registration
router.post("/login", login);       // App user login

export default router;
