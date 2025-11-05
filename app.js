import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import path from "path";
import { fileURLToPath } from "url";

// Import Routes
import authRoutes from "./routes/app/authRoutes.js";
import appCategoryRoutes from "./routes/app/appCategoryRoutes.js";
import appNewsRoutes from "./routes/app/appNewsRoutes.js";
import bookmarkRoutes from "./routes/app/bookmarkRoutes.js";
import userProfileRoutes from "./routes/app/userProfileRoutes.js";
import bannerRoutes from "./routes/app/bannerRoutes.js";

import adminAuthRoutes from "./routes/admin/adminAuthRoutes.js";
import adminCategoryRoutes from "./routes/admin/adminCategoryRoutes.js";
import adminNewsRoutes from "./routes/admin/adminNewsRoutes.js";
import adminUserRoutes from "./routes/admin/adminUserRoutes.js";
import adminBannerRoutes from "./routes/admin/adminBannerRoutes.js";
import adminStaffRoutes from "./routes/admin/adminStaffRoutes.js";
import adminDashboardRoutes from "./routes/admin/adminDashboardRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Get correct directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve src/uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======= App Routes =======
app.use("/api/auth", authRoutes);
app.use("/api/app/categories", appCategoryRoutes);
app.use("/api/app/news", appNewsRoutes);
app.use("/api/app/bookmarks", bookmarkRoutes);
app.use("/api/app/user", userProfileRoutes);
app.use("/api/app/banners", bannerRoutes);

// ======= Admin Routes =======
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/news", adminNewsRoutes);
app.use("/api/admin/banners", adminBannerRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

// Sync database
sequelize.sync({ alter: true }).then(() => console.log("Database synced ✅"));

export default app;
