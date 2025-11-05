// routes/dashboardRoutes.js
import express from "express";
import { getDashboardStats } from "../../controllers/admin/adminDashboard.js";

import { authenticate, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /api/dashboard
router.get("/", getDashboardStats);

export default router;
