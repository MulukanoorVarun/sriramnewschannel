import express from "express";
import { register, login ,refreshAccessToken } from "../../controllers/app/authController.js";
import { sendOtp, verifyOtp, resetPassword } from "../../controllers/app/forgotPasswordController.js";

const router = express.Router();

router.post("/register", register); // App user registration
router.post("/login", login);       // App user login
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshAccessToken);
export default router;
